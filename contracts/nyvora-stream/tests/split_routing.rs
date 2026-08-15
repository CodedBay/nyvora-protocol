use soroban_sdk::{testutils::Address as _, Address, Env};
use nyvora_stream::{NyvoraProtocol, NyvoraProtocolClient, SplitRoute};

#[test]
fn test_split_route_configuration() {
    let env = Env::default();
    env.mock_all_auths();

    let owner = Address::generate(&env);
    let route_recipient_1 = Address::generate(&env);
    let route_recipient_2 = Address::generate(&env);

    let contract_id = env.register_contract(None, NyvoraProtocol);
    let client = NyvoraProtocolClient::new(&env, &contract_id);

    // Create split routes
    let routes: Vec<SplitRoute> = vec![
        &env,
        SplitRoute {
            percentage: 5000, // 50%
            recipient: route_recipient_1.clone(),
            active: true,
        },
        SplitRoute {
            percentage: 5000, // 50%
            recipient: route_recipient_2.clone(),
            active: true,
        },
    ];

    // Configure split routes for owner
    client.configure_split_routes(&owner, &routes);

    // Retrieve routes and verify they were stored correctly
    let retrieved_routes = client.get_split_routes(&owner);
    
    assert_eq!(retrieved_routes.len(), 2);
    assert_eq!(retrieved_routes.get_unchecked(0).percentage, 5000);
    assert_eq!(retrieved_routes.get_unchecked(0).recipient, route_recipient_1);
    assert_eq!(retrieved_routes.get_unchecked(0).active, true);
    assert_eq!(retrieved_routes.get_unchecked(1).percentage, 5000);
    assert_eq!(retrieved_routes.get_unchecked(1).recipient, route_recipient_2);
    assert_eq!(retrieved_routes.get_unchecked(1).active, true);
}

#[test]
fn test_split_route_percentage_validation() {
    let env = Env::default();
    env.mock_all_auths();

    let owner = Address::generate(&env);
    let route_recipient_1 = Address::generate(&env);
    let route_recipient_2 = Address::generate(&env);

    let contract_id = env.register_contract(None, NyvoraProtocol);
    let client = NyvoraProtocolClient::new(&env, &contract_id);

    // Valid routes: total = 100%
    let valid_routes: Vec<SplitRoute> = vec![
        &env,
        SplitRoute {
            percentage: 6000, // 60%
            recipient: route_recipient_1.clone(),
            active: true,
        },
        SplitRoute {
            percentage: 4000, // 40%
            recipient: route_recipient_2.clone(),
            active: true,
        },
    ];

    // Should succeed
    client.configure_split_routes(&owner, &valid_routes);

    // Verify stored correctly
    let retrieved = client.get_split_routes(&owner);
    assert_eq!(retrieved.len(), 2);

    // Test with invalid percentages (exceeds 100%)
    let invalid_routes: Vec<SplitRoute> = vec![
        &env,
        SplitRoute {
            percentage: 6000, // 60%
            recipient: route_recipient_1.clone(),
            active: true,
        },
        SplitRoute {
            percentage: 5000, // 50% - total exceeds 100%
            recipient: route_recipient_2.clone(),
            active: true,
        },
    ];

    // Should panic/error on invalid configuration
    std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.configure_split_routes(&owner, &invalid_routes);
    }))
    .expect_err("Should reject routes exceeding 100%");
}

#[test]
fn test_circular_route_prevention() {
    let env = Env::default();
    env.mock_all_auths();

    let owner1 = Address::generate(&env);
    let owner2 = Address::generate(&env);
    let owner3 = Address::generate(&env);

    let contract_id = env.register_contract(None, NyvoraProtocol);
    let client = NyvoraProtocolClient::new(&env, &contract_id);

    // Set up a linear route chain: owner1 -> owner2 -> owner3
    let route1: Vec<SplitRoute> = vec![
        &env,
        SplitRoute {
            percentage: 10000, // 100% to owner2
            recipient: owner2.clone(),
            active: true,
        },
    ];

    let route2: Vec<SplitRoute> = vec![
        &env,
        SplitRoute {
            percentage: 10000, // 100% to owner3
            recipient: owner3.clone(),
            active: true,
        },
    ];

    client.configure_split_routes(&owner1, &route1);
    client.configure_split_routes(&owner2, &route2);

    // Attempt to create circular dependency: owner3 -> owner1
    let circular_route: Vec<SplitRoute> = vec![
        &env,
        SplitRoute {
            percentage: 10000,
            recipient: owner1.clone(),
            active: true,
        },
    ];

    // Should detect and prevent circular route
    std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
        client.configure_split_routes(&owner3, &circular_route);
    }))
    .expect_err("Should detect circular routing dependency");
}

#[test]
fn test_split_route_distribution() {
    let env = Env::default();
    env.mock_all_auths();

    let owner = Address::generate(&env);
    let recipient_1 = Address::generate(&env);
    let recipient_2 = Address::generate(&env);
    let recipient_3 = Address::generate(&env);

    let contract_id = env.register_contract(None, NyvoraProtocol);
    let client = NyvoraProtocolClient::new(&env, &contract_id);

    // Configure uneven split
    let routes: Vec<SplitRoute> = vec![
        &env,
        SplitRoute {
            percentage: 5000, // 50%
            recipient: recipient_1.clone(),
            active: true,
        },
        SplitRoute {
            percentage: 3000, // 30%
            recipient: recipient_2.clone(),
            active: true,
        },
        SplitRoute {
            percentage: 2000, // 20%
            recipient: recipient_3.clone(),
            active: true,
        },
    ];

    client.configure_split_routes(&owner, &routes);

    // Verify distribution percentages
    let retrieved = client.get_split_routes(&owner);
    
    assert_eq!(retrieved.len(), 3);
    assert_eq!(retrieved.get_unchecked(0).percentage, 5000); // 50%
    assert_eq!(retrieved.get_unchecked(1).percentage, 3000); // 30%
    assert_eq!(retrieved.get_unchecked(2).percentage, 2000); // 20%

    // Calculate remainder (0% in this case)
    let total: u32 = retrieved.iter().fold(0u32, |acc, route| {
        acc + route.percentage
    });
    assert_eq!(total, 10000); // Exactly 100%
}

#[test]
fn test_split_route_with_remainder() {
    let env = Env::default();
    env.mock_all_auths();

    let owner = Address::generate(&env);
    let recipient_1 = Address::generate(&env);
    let recipient_2 = Address::generate(&env);

    let contract_id = env.register_contract(None, NyvoraProtocol);
    let client = NyvoraProtocolClient::new(&env, &contract_id);

    // Routes that don't sum to exactly 100% (will have remainder)
    let routes: Vec<SplitRoute> = vec![
        &env,
        SplitRoute {
            percentage: 3333, // 33.33%
            recipient: recipient_1.clone(),
            active: true,
        },
        SplitRoute {
            percentage: 3333, // 33.33%
            recipient: recipient_2.clone(),
            active: true,
        },
        // Remainder: 33.34% stays with owner
    ];

    client.configure_split_routes(&owner, &routes);

    // Verify routes are stored
    let retrieved = client.get_split_routes(&owner);
    assert_eq!(retrieved.len(), 2);

    // Calculate what percentage remains with owner
    let distributed: u32 = retrieved.iter().fold(0u32, |acc, route| {
        acc + route.percentage
    });
    
    let remainder = 10000 - distributed;
    assert_eq!(remainder, 3334); // Remainder goes to sender
}

#[test]
fn test_deactivate_split_routes() {
    let env = Env::default();
    env.mock_all_auths();

    let owner = Address::generate(&env);
    let recipient = Address::generate(&env);

    let contract_id = env.register_contract(None, NyvoraProtocol);
    let client = NyvoraProtocolClient::new(&env, &contract_id);

    // Create active route
    let routes: Vec<SplitRoute> = vec![
        &env,
        SplitRoute {
            percentage: 10000,
            recipient: recipient.clone(),
            active: true,
        },
    ];

    client.configure_split_routes(&owner, &routes);

    // Deactivate the route
    let inactive_routes: Vec<SplitRoute> = vec![
        &env,
        SplitRoute {
            percentage: 10000,
            recipient: recipient.clone(),
            active: false,
        },
    ];

    client.configure_split_routes(&owner, &inactive_routes);

    // Verify route is now inactive
    let retrieved = client.get_split_routes(&owner);
    assert_eq!(retrieved.get_unchecked(0).active, false);
}
