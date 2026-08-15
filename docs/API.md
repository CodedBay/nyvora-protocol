# Nyvora Protocol API Reference

## Overview

Nyvora Protocol exposes a comprehensive API for stream management and split-routing on Stellar Soroban. All contract functions are deterministic and safe.

## Stream Management

### `create_stream`

Create a new continuous payment stream.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `sender` | Address | Stream funding source (must authorize) |
| `receiver` | Address | Initial stream recipient |
| `token` | Address | SAC token contract address |
| `amount` | i128 | Total tokens to stream (must be > 0) |
| `start_time` | u64 | Stream start (Unix timestamp, future only) |
| `end_time` | u64 | Stream end (Unix timestamp, must be > start_time) |

**Returns:** `u64` - Unique stream ID

**Errors:**

| Error | Condition |
|-------|-----------|
| `InvalidAmount` | Amount ≤ 0 |
| `InvalidTimeRange` | End time ≤ start time |
| `StartTimeInPast` | Start time in past |
| `TransferFailed` | Token transfer unsuccessful |

**Example:**

```rust
let stream_id = client.create_stream(
    &sender,
    &receiver,
    &token,
    &1_000_000_000,  // 1000 tokens (7 decimals)
    &1_700_000_000,  // 2023-11-15 13:06:40 UTC
    &1_702_592_000,  // 2023-12-15 13:06:40 UTC
)?;
```

---

### `withdraw`

Withdraw available funds from a stream. If split-routing is configured, applies automatic distribution.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `stream_id` | u64 | Target stream ID |
| `to` | Address | Recipient address (ignored if split-routing active) |

**Returns:** `i128` - Amount withdrawn

**Authorization:** Must be signed by stream receiver

**Errors:**

| Error | Condition |
|-------|-----------|
| `StreamNotFound` | Invalid stream ID |
| `StreamNotStarted` | Current time ≤ start time |
| `StreamPaused` | Stream is paused |
| `NoFundsAvailable` | All funds already withdrawn |

**Example:**

```rust
let amount = client.withdraw(&stream_id, &receiver)?;
println!("Withdrew: {} tokens", amount);
```

---

### `cancel_stream`

Cancel a stream early. Only the sender can cancel.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `stream_id` | u64 | Stream to cancel |

**Returns:** None

**Authorization:** Must be signed by stream sender

**Side Effects:**

- Refunds remaining unclaimed tokens to sender
- Receiver can still claim accrued amount
- Updates stream end_time to current timestamp

**Example:**

```rust
client.cancel_stream(&stream_id)?;
```

---

### `pause_stream`

Pause a stream temporarily. Only the sender can pause.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `stream_id` | u64 | Stream to pause |

**Returns:** None

**Authorization:** Must be signed by stream sender

**Effects:**

- Prevents withdrawals while paused
- Stream time does NOT advance while paused
- Sender can resume at any time

**Example:**

```rust
client.pause_stream(&stream_id)?;
```

---

### `resume_stream`

Resume a paused stream.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `stream_id` | u64 | Stream to resume |

**Returns:** None

**Authorization:** Must be signed by stream sender

**Errors:**

| Error | Condition |
|-------|-----------|
| `StreamNotPaused` | Stream not currently paused |

**Example:**

```rust
client.resume_stream(&stream_id)?;
```

---

## Query Functions

### `get_stream`

Retrieve stream details.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `stream_id` | u64 | Target stream ID |

**Returns:**

```rust
Stream {
    sender: Address,
    receiver: Address,
    token: Address,
    total_amount: i128,
    start_time: u64,
    end_time: u64,
    withdrawn: i128,
    created_at: u64,
    paused: bool,
}
```

**Errors:**

| Error | Condition |
|-------|-----------|
| `StreamNotFound` | Invalid stream ID |

**Example:**

```rust
let stream = client.get_stream(&stream_id)?;
println!("Stream duration: {} seconds", stream.end_time - stream.start_time);
```

---

### `get_available_balance`

Calculate currently available (claimable) balance for a stream.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `stream_id` | u64 | Target stream ID |

**Returns:** `i128` - Available balance (already withdrawn deducted)

**Calculation:**

```
available = min(
    (total × elapsed) / duration,
    total
) - already_withdrawn
```

Where `elapsed = min(now - start_time, duration)`

**Example:**

```rust
let available = client.get_available_balance(&stream_id)?;
if available > 0 {
    println!("Can withdraw: {} tokens", available);
}
```

---

### `get_stream_count`

Get total number of streams created.

**Parameters:** None

**Returns:** `u64` - Total stream count

**Example:**

```rust
let total = client.get_stream_count()?;
println!("Total streams: {}", total);
```

---

## Split Routing API

### `configure_split_routes`

Set up automatic fund routing for a receiver.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `owner` | Address | Receiver address configuring routes |
| `routes` | SplitRoute[] | Array of route configurations |

**Returns:** None

**Authorization:** Must be signed by owner

**SplitRoute Structure:**

```rust
SplitRoute {
    percentage: u32,    // 0-10000 (100% = 10000)
    recipient: Address, // Destination address
    active: bool,       // Enable/disable route
}
```

**Constraints:**

- Max 10 routes per receiver
- Total percentage of active routes ≤ 100%
- No duplicate recipients
- No circular routing (A→B→A)
- Minimum percentage if active: 1 (0.01%)

**Errors:**

| Error | Condition |
|-------|-----------|
| `RouteLimitExceeded` | > 10 routes |
| `InvalidSplitPercentage` | Invalid percentage values |
| `CircularRoutingDetected` | Circular route detected |
| `DuplicateRecipient` | Duplicate recipient in routes |

**Example:**

```rust
let routes = vec![
    SplitRoute {
        percentage: 5000,  // 50%
        recipient: team_address,
        active: true,
    },
    SplitRoute {
        percentage: 3000,  // 30%
        recipient: dao_address,
        active: true,
    },
    SplitRoute {
        percentage: 2000,  // 20%
        recipient: treasury_address,
        active: true,
    },
];

client.configure_split_routes(&receiver, &routes)?;
```

---

### `clear_split_routes`

Remove all split routes for a receiver.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `owner` | Address | Receiver address |

**Returns:** None

**Authorization:** Must be signed by owner

**Example:**

```rust
client.clear_split_routes(&receiver)?;
```

---

### `get_split_routes`

Retrieve split route configuration.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `owner` | Address | Receiver address |

**Returns:**

```rust
SplitRouter {
    owner: Address,
    routes: [Option<SplitRoute>; 10],
    route_count: u32,
}
```

**Errors:**

| Error | Condition |
|-------|-----------|
| `RouterNotConfigured` | No routes configured |

**Example:**

```rust
let router = client.get_split_routes(&receiver)?;
println!("Active routes: {}", router.route_count);
```

---

### `has_split_routes`

Check if a receiver has split routes configured.

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `receiver` | Address | Address to check |

**Returns:** `bool` - True if routes exist

**Example:**

```rust
if client.has_split_routes(&receiver)? {
    println!("Split routing is active");
}
```

---

## Initialization

### `initialize`

Initialize contract with admin address (optional, for future governance).

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `admin` | Address | Admin address |

**Returns:** None

**Authorization:** Must be signed by admin

**Example:**

```rust
client.initialize(&admin)?;
```

---

## Data Types

### Stream

Complete stream information.

```rust
pub struct Stream {
    pub sender: Address,        // Funding source
    pub receiver: Address,      // Primary recipient
    pub token: Address,         // Token contract
    pub total_amount: i128,     // Total allocated
    pub start_time: u64,        // Start timestamp
    pub end_time: u64,          // End timestamp
    pub withdrawn: i128,        // Already claimed
    pub created_at: u64,        // Creation timestamp
    pub paused: bool,           // Pause status
}
```

### SplitRoute

Individual routing rule.

```rust
pub struct SplitRoute {
    pub percentage: u32,        // Route percentage (0-10000)
    pub recipient: Address,     // Destination
    pub active: bool,           // Enable/disable
}
```

### SplitRouter

Complete split configuration.

```rust
pub struct SplitRouter {
    pub owner: Address,                    // Configuration owner
    pub routes: [Option<SplitRoute>; 10],  // Route array
    pub route_count: u32,                  // Active count
}
```

---

## Events

All events are emitted on successful operations.

### StreamCreated

```
topic: "stream_created"
data: (stream_id, sender, receiver, token, amount, start_time, end_time)
```

### Withdrawal

```
topic: "withdrawal"
indexed_data: (stream_id, recipient)
data: (amount, remaining)
```

### StreamCancelled

```
topic: "stream_cancelled"
indexed_data: (stream_id)
data: (sender_refund, receiver_claimable)
```

### StreamPaused

```
topic: "stream_paused"
indexed_data: (stream_id)
```

### StreamResumed

```
topic: "stream_resumed"
indexed_data: (stream_id)
```

### RoutesConfigured

```
topic: "routes_configured"
indexed_data: (owner)
data: (active_route_count)
```

### SplitRouted

```
topic: "split_routed"
indexed_data: (stream_id, from, to)
data: (amount)
```

---

## Error Codes

| Code | Name | Meaning |
|------|------|---------|
| 1 | InvalidAmount | Amount must be positive |
| 2 | InvalidTimeRange | End time must be after start time |
| 3 | StartTimeInPast | Start time cannot be in past |
| 4 | StreamNotFound | Stream ID does not exist |
| 5 | StreamNotStarted | Stream hasn't started yet |
| 6 | NoFundsAvailable | No claimable funds |
| 7 | WithdrawalFailed | Withdrawal operation failed |
| 8 | Unauthorized | Not authorized for operation |
| 9 | StreamPaused | Stream is paused |
| 10 | StreamAlreadyPaused | Stream already paused |
| 11 | StreamNotPaused | Stream is not paused |
| 12 | InvalidSplitPercentage | Invalid route percentage |
| 13 | RouteLimitExceeded | Too many routes |
| 14 | CircularRoutingDetected | Circular dependency detected |
| 15 | RouterNotConfigured | No routes configured |
| 16 | OverflowError | Arithmetic overflow |
| 17 | UnderflowError | Arithmetic underflow |
| 18 | DivisionByZeroError | Division by zero |
| 19 | TransferFailed | Token transfer failed |
| 20 | TokenNotFound | Token contract not found |
| 21 | DuplicateRecipient | Duplicate recipient in routes |
| 100 | InternalError | Internal contract error |

---

## Best Practices

### Stream Creation

1. Always verify token contract address
2. Ensure sufficient balance before creating
3. Use realistic time values (avoid extreme dates)
4. Test on testnet first

### Withdrawals

1. Check available balance before withdrawing
2. Handle split routing configuration beforehand
3. Monitor withdrawal events
4. Consider gas costs for multiple withdrawals

### Split Routing

1. Validate all recipient addresses
2. Test routes on testnet
3. Start with simple configurations
4. Monitor total percentage allocation

### Error Handling

```rust
match client.withdraw(&stream_id, &to) {
    Ok(amount) => println!("Withdrawn: {}", amount),
    Err(ContractError::StreamNotStarted) => println!("Stream not yet active"),
    Err(ContractError::NoFundsAvailable) => println!("All funds claimed"),
    Err(e) => println!("Error: {:?}", e),
}
```
