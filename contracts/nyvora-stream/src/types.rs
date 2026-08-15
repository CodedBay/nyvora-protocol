use soroban_sdk::{contracttype, Address};

/// Main Stream data structure
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct Stream {
    /// Original funding sender
    pub sender: Address,
    /// Initial recipient (can have split-routing)
    pub receiver: Address,
    /// SAC token address
    pub token: Address,
    /// Total tokens allocated to stream
    pub total_amount: i128,
    /// Stream start time (Unix timestamp)
    pub start_time: u64,
    /// Stream end time (Unix timestamp)
    pub end_time: u64,
    /// Amount already withdrawn
    pub withdrawn: i128,
    /// Timestamp when stream was created
    pub created_at: u64,
    /// Whether stream is paused
    pub paused: bool,
}

/// Split routing configuration
#[contracttype]
#[derive(Clone, Debug, Eq, PartialEq)]
pub struct SplitRoute {
    /// Percentage to route (0-100, 2 decimals: 5000 = 50%)
    pub percentage: u32,
    /// Recipient address
    pub recipient: Address,
    /// Is this route active
    pub active: bool,
}

/// Split router for a receiver
#[contracttype]
#[derive(Clone, Debug)]
pub struct SplitRouter {
    /// Owner of this split configuration
    pub owner: Address,
    /// List of routes
    pub routes: [Option<SplitRoute>; 10],
    /// Total routes count
    pub route_count: u32,
}

/// Storage keys for persistent data
#[contracttype]
pub enum DataKey {
    Stream(u64),              // Stream ID -> Stream struct
    StreamCount,              // Global stream counter
    SplitRouter(Address),     // Address -> SplitRouter config
    Admin,                    // Admin address
}

/// Contract metadata
#[contracttype]
pub struct ContractMetadata {
    pub name: Symbol,
    pub version: Symbol,
    pub created_at: u64,
}

// Re-export Symbol type for use in metadata
pub use soroban_sdk::Symbol;
