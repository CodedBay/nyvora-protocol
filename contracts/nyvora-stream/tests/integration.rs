use soroban_sdk::{testutils::Address as _, Address, Env};
use nyvora_stream::{NyvoraProtocol, NyvoraProtocolClient};

#[test]
fn test_stream_lifecycle() {
    let env = Env::default();
    env.mock_all_auths();

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let admin = Address::generate(&env);

    // Setup mock token
    let token_admin = Address::generate(&env);
    let token = env.register_stellar_asset_contract(token_admin.clone());
    
    // Mint tokens to sender
    let token_client = soroban_sdk::token::StellarAssetClient::new(&env, &token);
    token_client.mint(&sender, &100_000);

    // Register contract
    let contract_id = env.register_contract(None, NyvoraProtocol);
    let client = NyvoraProtocolClient::new(&env, &contract_id);

    // Initialize contract
    let init_result = client.initialize(&admin);
    assert!(init_result.is_ok());

    // Set ledger time
    env.ledger().set_timestamp(100);

    let start_time = 100;
    let end_time = 200;
    let amount = 10_000;

    // Create stream
    let stream_result = client.create_stream(
        &sender,
        &receiver,
        &token,
        &amount,
        &start_time,
        &end_time,
    );
    assert!(stream_result.is_ok());
    let stream_id = stream_result.unwrap();
    assert_eq!(stream_id, 1);

    // Verify stream was created
    let stream = client.get_stream(&stream_id);
    assert!(stream.is_ok());
    let stream = stream.unwrap();
    assert_eq!(stream.total_amount, amount);
    assert_eq!(stream.withdrawn, 0);

    // Check available balance at start (should be 0)
    let balance = client.get_available_balance(&stream_id);
    assert!(balance.is_ok());
    assert_eq!(balance.unwrap(), 0);

    // Fast forward halfway through stream
    env.ledger().set_timestamp(150);

    // Withdraw halfway through
    let withdraw_result = client.withdraw(&stream_id, &receiver);
    assert!(withdraw_result.is_ok());
    let withdrawn = withdraw_result.unwrap();

    // Should be 50% of 10_000
    assert_eq!(withdrawn, 5_000);

    // Check remaining balance
    let balance = client.get_available_balance(&stream_id);
    assert!(balance.is_ok());
    assert_eq!(balance.unwrap(), 5_000);

    // Fast forward to end of stream
    env.ledger().set_timestamp(200);

    // Withdraw remaining
    let withdraw_result2 = client.withdraw(&stream_id, &receiver);
    assert!(withdraw_result2.is_ok());
    let withdrawn2 = withdraw_result2.unwrap();
    assert_eq!(withdrawn2, 5_000);

    // No more funds available
    let balance = client.get_available_balance(&stream_id);
    assert!(balance.is_ok());
    assert_eq!(balance.unwrap(), 0);
}

#[test]
fn test_stream_creation_validation() {
    let env = Env::default();
    env.mock_all_auths();

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let token = env.register_stellar_asset_contract(token_admin);

    let token_client = soroban_sdk::token::StellarAssetClient::new(&env, &token);
    token_client.mint(&sender, &100_000);

    let contract_id = env.register_contract(None, NyvoraProtocol);
    let client = NyvoraProtocolClient::new(&env, &contract_id);

    env.ledger().set_timestamp(100);

    // Test: Invalid amount (negative)
    let result = client.create_stream(
        &sender,
        &receiver,
        &token,
        &-1000,
        &100,
        &200,
    );
    assert!(result.is_err());

    // Test: Invalid time range (end before start)
    let result = client.create_stream(
        &sender,
        &receiver,
        &token,
        &1000,
        &200,
        &100,
    );
    assert!(result.is_err());

    // Test: Start time in past
    let result = client.create_stream(
        &sender,
        &receiver,
        &token,
        &1000,
        &50,
        &200,
    );
    assert!(result.is_err());
}

#[test]
fn test_multiple_streams() {
    let env = Env::default();
    env.mock_all_auths();

    let sender = Address::generate(&env);
    let receiver1 = Address::generate(&env);
    let receiver2 = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let token = env.register_stellar_asset_contract(token_admin);

    let token_client = soroban_sdk::token::StellarAssetClient::new(&env, &token);
    token_client.mint(&sender, &100_000);

    let contract_id = env.register_contract(None, NyvoraProtocol);
    let client = NyvoraProtocolClient::new(&env, &contract_id);

    env.ledger().set_timestamp(100);

    // Create first stream
    let stream1 = client.create_stream(
        &sender,
        &receiver1,
        &token,
        &5_000,
        &100,
        &200,
    );
    assert!(stream1.is_ok());
    assert_eq!(stream1.unwrap(), 1);

    // Create second stream
    let stream2 = client.create_stream(
        &sender,
        &receiver2,
        &token,
        &3_000,
        &100,
        &200,
    );
    assert!(stream2.is_ok());
    assert_eq!(stream2.unwrap(), 2);

    // Both streams should exist independently
    let s1 = client.get_stream(&1);
    let s2 = client.get_stream(&2);

    assert!(s1.is_ok());
    assert!(s2.is_ok());
    assert_eq!(s1.unwrap().total_amount, 5_000);
    assert_eq!(s2.unwrap().total_amount, 3_000);
}

#[test]
fn test_stream_pause_resume() {
    let env = Env::default();
    env.mock_all_auths();

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let token = env.register_stellar_asset_contract(token_admin);

    let token_client = soroban_sdk::token::StellarAssetClient::new(&env, &token);
    token_client.mint(&sender, &100_000);

    let contract_id = env.register_contract(None, NyvoraProtocol);
    let client = NyvoraProtocolClient::new(&env, &contract_id);

    env.ledger().set_timestamp(100);

    let stream_id = client.create_stream(
        &sender,
        &receiver,
        &token,
        &10_000,
        &100,
        &200,
    )
    .unwrap();

    // Pause stream
    let pause_result = client.pause_stream(&stream_id);
    assert!(pause_result.is_ok());

    // Try to withdraw while paused
    let withdraw_result = client.withdraw(&stream_id, &receiver);
    assert!(withdraw_result.is_err());

    // Resume stream
    let resume_result = client.resume_stream(&stream_id);
    assert!(resume_result.is_ok());

    // Now withdrawal should work
    env.ledger().set_timestamp(150);
    let withdraw_result = client.withdraw(&stream_id, &receiver);
    assert!(withdraw_result.is_ok());
}

#[test]
fn test_stream_cancellation() {
    let env = Env::default();
    env.mock_all_auths();

    let sender = Address::generate(&env);
    let receiver = Address::generate(&env);
    let token_admin = Address::generate(&env);
    let token = env.register_stellar_asset_contract(token_admin);

    let token_client = soroban_sdk::token::StellarAssetClient::new(&env, &token);
    token_client.mint(&sender, &100_000);

    let contract_id = env.register_contract(None, NyvoraProtocol);
    let client = NyvoraProtocolClient::new(&env, &contract_id);

    env.ledger().set_timestamp(100);

    let stream_id = client.create_stream(
        &sender,
        &receiver,
        &token,
        &10_000,
        &100,
        &200,
    )
    .unwrap();

    // Fast forward to halfway
    env.ledger().set_timestamp(150);

    // Cancel stream
    let cancel_result = client.cancel_stream(&stream_id);
    assert!(cancel_result.is_ok());

    // Stream should still exist but end_time should be updated
    let stream = client.get_stream(&stream_id);
    assert!(stream.is_ok());
    assert_eq!(stream.unwrap().end_time, 150);
}
