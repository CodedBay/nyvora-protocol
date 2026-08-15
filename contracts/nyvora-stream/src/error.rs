use soroban_sdk::contracterror;

#[contracterror]
#[derive(Copy, Clone, Debug, Eq, PartialEq, PartialOrd, Ord)]
pub enum ContractError {
    // Stream validation errors
    InvalidAmount = 1,
    InvalidTimeRange = 2,
    StartTimeInPast = 3,
    StreamNotFound = 4,
    
    // Withdrawal errors
    StreamNotStarted = 5,
    NoFundsAvailable = 6,
    WithdrawalFailed = 7,
    
    // Authorization errors
    Unauthorized = 8,
    
    // Stream state errors
    StreamPaused = 9,
    StreamAlreadyPaused = 10,
    StreamNotPaused = 11,
    
    // Split routing errors
    InvalidSplitPercentage = 12,
    RouteLimitExceeded = 13,
    CircularRoutingDetected = 14,
    RouterNotConfigured = 15,
    DuplicateRecipient = 21,
    
    // Math errors
    OverflowError = 16,
    UnderflowError = 17,
    DivisionByZeroError = 18,
    
    // Token transfer errors
    TransferFailed = 19,
    TokenNotFound = 20,
    
    // Generic errors
    InternalError = 100,
}
