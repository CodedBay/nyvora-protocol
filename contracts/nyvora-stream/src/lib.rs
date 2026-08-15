#![no_std]

pub mod types;
pub mod error;
pub mod events;
pub mod stream;
pub mod split_router;

pub use error::ContractError;
pub use types::*;
pub use events::*;
pub use stream::*;
pub use split_router::*;

use soroban_sdk::{contract, contractimpl, Address, Env};

#[contract]
pub struct NyvoraProtocol;

#[contractimpl]
impl NyvoraProtocol {
    /// Initialize the contract (optional, for future governance/admin setup)
    pub fn initialize(env: Env, admin: Address) -> Result<(), ContractError> {
        admin.require_auth();
        
        // Store admin for future use
        let data_key = DataKey::Admin;
        env.storage().instance().set(&data_key, &admin);
        
        Ok(())
    }

    /// Creates a continuous payment stream from sender to receiver.
    pub fn create_stream(
        env: Env,
        sender: Address,
        receiver: Address,
        token: Address,
        amount: i128,
        start_time: u64,
        end_time: u64,
    ) -> Result<u64, ContractError> {
        sender.require_auth();
        
        // Validate inputs
        validate_stream_inputs(amount, start_time, end_time, &env)?;
        
        // Transfer funds from sender to contract escrow
        transfer_tokens(&env, &token, &sender, &env.current_contract_address(), &amount)?;
        
        // Generate new stream ID
        let stream_id = generate_stream_id(&env)?;
        
        // Create stream struct
        let stream = Stream {
            sender: sender.clone(),
            receiver: receiver.clone(),
            token: token.clone(),
            total_amount: amount,
            start_time,
            end_time,
            withdrawn: 0,
            created_at: env.ledger().timestamp(),
            paused: false,
        };
        
        // Persist stream
        env.storage().persistent().set(&DataKey::Stream(stream_id), &stream);
        
        // Emit event
        emit_stream_created(
            &env,
            stream_id,
            sender.clone(),
            receiver.clone(),
            token.clone(),
            amount,
            start_time,
            end_time,
        );
        
        Ok(stream_id)
    }

    /// Allows the receiver to withdraw unlocked funds from their stream.
    /// If split-routing is configured, funds will be distributed automatically.
    pub fn withdraw(env: Env, stream_id: u64, to: Address) -> Result<i128, ContractError> {
        let mut stream: Stream = env
            .storage()
            .persistent()
            .get(&DataKey::Stream(stream_id))
            .ok_or(ContractError::StreamNotFound)?;
        
        // Ensure only the receiver can trigger withdrawals
        stream.receiver.require_auth();
        
        // Validate stream state
        let current_time = env.ledger().timestamp();
        if current_time <= stream.start_time {
            return Err(ContractError::StreamNotStarted);
        }
        
        if stream.paused {
            return Err(ContractError::StreamPaused);
        }
        
        // Calculate claimable amount
        let total_claimable = calculate_claimable_amount(&stream, current_time)?;
        let mut amount_to_transfer = total_claimable - stream.withdrawn;
        
        if amount_to_transfer <= 0 {
            return Err(ContractError::NoFundsAvailable);
        }
        
        // Update state before transfer (reentrancy protection)
        stream.withdrawn = total_claimable;
        env.storage()
            .persistent()
            .set(&DataKey::Stream(stream_id), &stream);
        
        // Apply split routing if configured
        let splits = apply_split_routing(
            &env,
            &stream.receiver,
            amount_to_transfer,
            stream_id,
        )?;
        
        // Execute transfers for all splits
        for (recipient, split_amount) in splits.iter() {
            if *split_amount > 0 {
                transfer_tokens(
                    &env,
                    &stream.token,
                    &env.current_contract_address(),
                    recipient,
                    split_amount,
                )?;
            }
        }
        
        // Emit event
        emit_withdrawal(
            &env,
            stream_id,
            to.clone(),
            amount_to_transfer,
            stream.total_amount - stream.withdrawn,
        );
        
        Ok(amount_to_transfer)
    }

    /// Cancel a stream (only sender can do this)
    pub fn cancel_stream(env: Env, stream_id: u64) -> Result<(), ContractError> {
        let mut stream: Stream = env
            .storage()
            .persistent()
            .get(&DataKey::Stream(stream_id))
            .ok_or(ContractError::StreamNotFound)?;
        
        stream.sender.require_auth();
        
        let current_time = env.ledger().timestamp();
        
        // Calculate remaining claimable by receiver
        let total_claimable = calculate_claimable_amount(&stream, current_time)?;
        let receiver_claimable = total_claimable - stream.withdrawn;
        
        // Return excess to sender
        let sender_refund = stream.total_amount - total_claimable;
        
        if sender_refund > 0 {
            transfer_tokens(
                &env,
                &stream.token,
                &env.current_contract_address(),
                &stream.sender,
                &sender_refund,
            )?;
        }
        
        // Mark stream as cancelled (set end_time to current)
        stream.end_time = current_time;
        env.storage()
            .persistent()
            .set(&DataKey::Stream(stream_id), &stream);
        
        emit_stream_cancelled(&env, stream_id, sender_refund, receiver_claimable);
        
        Ok(())
    }

    /// Get stream details
    pub fn get_stream(env: Env, stream_id: u64) -> Result<Stream, ContractError> {
        env.storage()
            .persistent()
            .get(&DataKey::Stream(stream_id))
            .ok_or(ContractError::StreamNotFound)
    }

    /// Get available balance for receiver
    pub fn get_available_balance(
        env: Env,
        stream_id: u64,
    ) -> Result<i128, ContractError> {
        let stream: Stream = env
            .storage()
            .persistent()
            .get(&DataKey::Stream(stream_id))
            .ok_or(ContractError::StreamNotFound)?;
        
        let current_time = env.ledger().timestamp();
        let total_claimable = calculate_claimable_amount(&stream, current_time)?;
        let available = total_claimable - stream.withdrawn;
        
        Ok(available)
    }

    /// Pause a stream (sender only)
    pub fn pause_stream(env: Env, stream_id: u64) -> Result<(), ContractError> {
        let mut stream: Stream = env
            .storage()
            .persistent()
            .get(&DataKey::Stream(stream_id))
            .ok_or(ContractError::StreamNotFound)?;
        
        stream.sender.require_auth();
        
        if stream.paused {
            return Err(ContractError::StreamAlreadyPaused);
        }
        
        stream.paused = true;
        env.storage()
            .persistent()
            .set(&DataKey::Stream(stream_id), &stream);
        
        emit_stream_paused(&env, stream_id);
        
        Ok(())
    }

    /// Resume a stream (sender only)
    pub fn resume_stream(env: Env, stream_id: u64) -> Result<(), ContractError> {
        let mut stream: Stream = env
            .storage()
            .persistent()
            .get(&DataKey::Stream(stream_id))
            .ok_or(ContractError::StreamNotFound)?;
        
        stream.sender.require_auth();
        
        if !stream.paused {
            return Err(ContractError::StreamNotPaused);
        }
        
        stream.paused = false;
        env.storage()
            .persistent()
            .set(&DataKey::Stream(stream_id), &stream);
        
        emit_stream_resumed(&env, stream_id);
        
        Ok(())
    }

    /// Configure split routes for a receiver
    pub fn configure_split_routes(
        env: Env,
        owner: Address,
        routes: &[SplitRoute],
    ) -> Result<(), ContractError> {
        configure_routes(&env, owner, routes)
    }

    /// Clear all split routes for a receiver
    pub fn clear_split_routes(env: Env, owner: Address) -> Result<(), ContractError> {
        clear_routes(&env, owner)
    }

    /// Get split router configuration for an address
    pub fn get_split_routes(env: Env, owner: Address) -> Result<SplitRouter, ContractError> {
        get_split_router(&env, &owner)
    }

    /// Check if receiver has split routes configured
    pub fn has_split_routes(env: Env, receiver: Address) -> bool {
        has_routes(&env, &receiver)
    }

    /// Get stream count
    pub fn get_stream_count(env: Env) -> u64 {
        env.storage()
            .persistent()
            .get(&DataKey::StreamCount)
            .unwrap_or(0)
    }
}
