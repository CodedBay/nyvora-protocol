use soroban_sdk::{Env, Address, topic, Symbol};

/// Emitted when a stream is created
pub fn emit_stream_created(
    env: &Env,
    stream_id: u64,
    sender: Address,
    receiver: Address,
    token: Address,
    amount: i128,
    start_time: u64,
    end_time: u64,
) {
    let topics = (
        Symbol::new(env, "stream_created"),
        stream_id,
    );
    env.events().publish(
        topics,
        (sender, receiver, token, amount, start_time, end_time),
    );
}

/// Emitted when funds are withdrawn
pub fn emit_withdrawal(
    env: &Env,
    stream_id: u64,
    recipient: Address,
    amount: i128,
    remaining: i128,
) {
    let topics = (
        Symbol::new(env, "withdrawal"),
        stream_id,
        recipient,
    );
    env.events().publish(topics, (amount, remaining));
}

/// Emitted when stream is cancelled
pub fn emit_stream_cancelled(
    env: &Env,
    stream_id: u64,
    sender_refund: i128,
    receiver_claimable: i128,
) {
    let topics = (
        Symbol::new(env, "stream_cancelled"),
        stream_id,
    );
    env.events().publish(topics, (sender_refund, receiver_claimable));
}

/// Emitted when stream is paused
pub fn emit_stream_paused(env: &Env, stream_id: u64) {
    let topics = (
        Symbol::new(env, "stream_paused"),
        stream_id,
    );
    env.events().publish(topics, ());
}

/// Emitted when stream is resumed
pub fn emit_stream_resumed(env: &Env, stream_id: u64) {
    let topics = (
        Symbol::new(env, "stream_resumed"),
        stream_id,
    );
    env.events().publish(topics, ());
}

/// Emitted when split routes are configured
pub fn emit_routes_configured(
    env: &Env,
    owner: Address,
    route_count: u32,
) {
    let topics = (
        Symbol::new(env, "routes_configured"),
        owner,
    );
    env.events().publish(topics, (route_count,));
}

/// Emitted when split routing occurs
pub fn emit_split_routed(
    env: &Env,
    stream_id: u64,
    from: Address,
    to: Address,
    amount: i128,
) {
    let topics = (
        Symbol::new(env, "split_routed"),
        stream_id,
        from,
        to,
    );
    env.events().publish(topics, (amount,));
}
