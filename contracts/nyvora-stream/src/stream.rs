use soroban_sdk::{token, Env, Address};
use crate::{ContractError, DataKey, Stream};

/// Validate stream creation inputs
pub fn validate_stream_inputs(
    amount: i128,
    start_time: u64,
    end_time: u64,
    env: &Env,
) -> Result<(), ContractError> {
    // Validate amount
    if amount <= 0 {
        return Err(ContractError::InvalidAmount);
    }
    
    // Validate time range
    if end_time <= start_time {
        return Err(ContractError::InvalidTimeRange);
    }
    
    // Validate start time is not in past
    let current_time = env.ledger().timestamp();
    if start_time < current_time {
        return Err(ContractError::StartTimeInPast);
    }
    
    Ok(())
}

/// Calculate claimable amount based on time
pub fn calculate_claimable_amount(
    stream: &Stream,
    current_time: u64,
) -> Result<i128, ContractError> {
    // If stream hasn't started, nothing claimable
    if current_time <= stream.start_time {
        return Ok(0);
    }
    
    // Calculate elapsed time
    let elapsed = if current_time >= stream.end_time {
        stream.end_time - stream.start_time
    } else {
        current_time - stream.start_time
    };
    
    let duration = stream.end_time - stream.start_time;
    
    // Safe division: (total * elapsed) / duration
    let total_claimable = (stream.total_amount)
        .checked_mul(elapsed as i128)
        .ok_or(ContractError::OverflowError)?
        .checked_div(duration as i128)
        .ok_or(ContractError::DivisionByZeroError)?;
    
    // Claimable cannot exceed total amount
    Ok(total_claimable.min(stream.total_amount))
}

/// Generate unique stream ID
pub fn generate_stream_id(env: &Env) -> Result<u64, ContractError> {
    let data_key = DataKey::StreamCount;
    let count: u64 = env
        .storage()
        .persistent()
        .get(&data_key)
        .unwrap_or(0);
    
    let new_id = count
        .checked_add(1)
        .ok_or(ContractError::OverflowError)?;
    
    env.storage().persistent().set(&data_key, &new_id);
    
    Ok(new_id)
}

/// Transfer tokens safely
pub fn transfer_tokens(
    env: &Env,
    token: &Address,
    from: &Address,
    to: &Address,
    amount: &i128,
) -> Result<(), ContractError> {
    let token_client = token::Client::new(env, token);
    
    token_client
        .transfer(from, to, amount)
        .map_err(|_| ContractError::TransferFailed)?;
    
    Ok(())
}

/// Get token balance
pub fn get_token_balance(
    env: &Env,
    token: &Address,
    account: &Address,
) -> Result<i128, ContractError> {
    let token_client = token::Client::new(env, token);
    
    let balance = token_client
        .balance(account)
        .map_err(|_| ContractError::TokenNotFound)?;
    
    Ok(balance)
}
