use soroban_sdk::{Env, Address, Vec};
use crate::{ContractError, DataKey, SplitRoute, SplitRouter, emit_routes_configured, emit_split_routed};

/// Maximum number of active routes per receiver
const MAX_ROUTES: usize = 10;

/// Minimum percentage to avoid rounding to zero (0.01%)
const MIN_PERCENTAGE: u32 = 1;

/// Configure split routes for an address
pub fn configure_routes(
    env: &Env,
    owner: Address,
    routes: &[SplitRoute],
) -> Result<(), ContractError> {
    owner.require_auth();
    
    // Validate route count
    if routes.len() > MAX_ROUTES {
        return Err(ContractError::RouteLimitExceeded);
    }
    
    // Validate total percentage and individual routes
    let mut total_percentage: u32 = 0;
    let mut active_count = 0u32;
    
    for route in routes {
        // Validate percentage (max 10000 = 100%)
        if route.percentage > 10000 {
            return Err(ContractError::InvalidSplitPercentage);
        }
        
        // Ensure non-zero if active
        if route.active && route.percentage < MIN_PERCENTAGE {
            return Err(ContractError::InvalidSplitPercentage);
        }
        
        // Only count active routes in total
        if route.active {
            active_count += 1;
            total_percentage = total_percentage
                .checked_add(route.percentage)
                .ok_or(ContractError::OverflowError)?;
        }
    }
    
    // Total active routes cannot exceed 100%
    if total_percentage > 10000 {
        return Err(ContractError::InvalidSplitPercentage);
    }
    
    // Check for circular routing
    check_for_circular_routes(env, &owner, routes)?;
    
    // Validate no duplicate recipients
    validate_unique_recipients(routes)?;
    
    // Convert routes to fixed array
    let mut route_array: [Option<SplitRoute>; MAX_ROUTES] = [None; MAX_ROUTES];
    for (i, route) in routes.iter().enumerate() {
        route_array[i] = Some(route.clone());
    }
    
    let router = SplitRouter {
        owner: owner.clone(),
        routes: route_array,
        route_count: routes.len() as u32,
    };
    
    // Store router configuration
    env.storage()
        .persistent()
        .set(&DataKey::SplitRouter(owner.clone()), &router);
    
    // Emit event
    emit_routes_configured(env, owner, active_count);
    
    Ok(())
}

/// Clear all split routes for an address
pub fn clear_routes(env: &Env, owner: Address) -> Result<(), ContractError> {
    owner.require_auth();
    
    let data_key = DataKey::SplitRouter(owner.clone());
    env.storage().persistent().remove(&data_key);
    
    emit_routes_configured(env, owner, 0);
    
    Ok(())
}

/// Get split router configuration
pub fn get_split_router(
    env: &Env,
    owner: &Address,
) -> Result<SplitRouter, ContractError> {
    env.storage()
        .persistent()
        .get(&DataKey::SplitRouter(owner.clone()))
        .ok_or(ContractError::RouterNotConfigured)
}

/// Check if a receiver has split routes configured
pub fn has_routes(env: &Env, receiver: &Address) -> bool {
    env.storage()
        .persistent()
        .get::<_, SplitRouter>(&DataKey::SplitRouter(receiver.clone()))
        .is_some()
}

/// Apply split routing to a withdrawal amount
pub fn apply_split_routing(
    env: &Env,
    receiver: &Address,
    amount: i128,
    stream_id: u64,
) -> Result<Vec<(Address, i128)>, ContractError> {
    // Ensure amount is positive
    if amount <= 0 {
        return Err(ContractError::InvalidAmount);
    }
    
    let mut splits: Vec<(Address, i128)> = Vec::new();
    
    // Try to get split router for this receiver
    match env
        .storage()
        .persistent()
        .get::<_, SplitRouter>(&DataKey::SplitRouter(receiver.clone()))
    {
        Some(router) => {
            // Apply split routing
            let mut routed_amount = 0i128;
            
            for route_opt in router.routes.iter() {
                if let Some(route) = route_opt {
                    if route.active && route.percentage > 0 {
                        // Calculate split amount: (amount × percentage) / 10000
                        let split_amount = amount
                            .checked_mul(route.percentage as i128)
                            .ok_or(ContractError::OverflowError)?
                            .checked_div(10000)
                            .ok_or(ContractError::DivisionByZeroError)?;
                        
                        if split_amount > 0 {
                            splits.push((route.recipient.clone(), split_amount));
                            routed_amount = routed_amount
                                .checked_add(split_amount)
                                .ok_or(ContractError::OverflowError)?;
                            
                            // Emit split routing event
                            emit_split_routed(env, stream_id, receiver.clone(), route.recipient.clone(), split_amount);
                        }
                    }
                }
            }
            
            // Add remainder to original receiver if not all routed
            if routed_amount < amount {
                let remainder = amount
                    .checked_sub(routed_amount)
                    .ok_or(ContractError::UnderflowError)?;
                if remainder > 0 {
                    splits.push((receiver.clone(), remainder));
                }
            }
        }
        None => {
            // No split router configured, send all to receiver
            splits.push((receiver.clone(), amount));
        }
    }
    
    Ok(splits)
}

/// Validate unique recipients (no duplicates)
fn validate_unique_recipients(routes: &[SplitRoute]) -> Result<(), ContractError> {
    for i in 0..routes.len() {
        for j in (i + 1)..routes.len() {
            if routes[i].recipient == routes[j].recipient {
                return Err(ContractError::DuplicateRecipient);
            }
        }
    }
    Ok(())
}

/// Check for circular routing (single-level bidirectional check)
fn check_for_circular_routes(
    env: &Env,
    owner: &Address,
    routes: &[SplitRoute],
) -> Result<(), ContractError> {
    for route in routes {
        // Skip if route is to self
        if route.recipient == *owner {
            continue;
        }
        
        // Check if any route recipient has routes back to owner
        if let Ok(recipient_router) = env
            .storage()
            .persistent()
            .get::<_, SplitRouter>(&DataKey::SplitRouter(route.recipient.clone()))
        {
            for recipient_route_opt in recipient_router.routes.iter() {
                if let Some(recipient_route) = recipient_route_opt {
                    if recipient_route.active && recipient_route.recipient == *owner {
                        return Err(ContractError::CircularRoutingDetected);
                    }
                }
            }
        }
    }
    
    Ok(())
}
