# Nyvora Protocol Architecture

## Overview

Nyvora Protocol is a decentralized streaming protocol built on Stellar Soroban. It enables continuous token distribution with programmable split-routing for ecosystem funding.

## System Design

### Core Components

```
┌─────────────────────────────────────┐
│     Stellar Soroban Network         │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐  │
│  │  Nyvora Stream Contract        │  │
│  │  - Stream Management           │  │
│  │  - Token Escrow               │  │
│  │  - Withdrawal Logic            │  │
│  └───────────────────────────────┘  │
│                 │                    │
│  ┌──────────────▼──────────────────┐ │
│  │  Split Router Module            │ │
│  │  - Route Configuration          │ │
│  │  - Distribution Logic           │ │
│  │  - Circular Detection           │ │
│  └─────────────────────────────────┘ │
│                                     │
│  ┌────────────┐  ┌────────────────┐ │
│  │ SAC Tokens │  │ Event Emitter  │ │
│  └────────────┘  └────────────────┘ │
│                                     │
└─────────────────────────────────────┘
         ▲              ▲
         │              │
    ┌────┴──────────────┴────┐
    │   Frontend / UI Layer   │
    │  (Next.js + React)      │
    └─────────────────────────┘
```

## Data Model

### Stream Structure

```rust
struct Stream {
    sender: Address,           // Fund source
    receiver: Address,         // Initial recipient
    token: Address,            // SAC token address
    total_amount: i128,        // Total locked funds
    start_time: u64,           // Unix timestamp
    end_time: u64,             // Unix timestamp
    withdrawn: i128,           // Amount claimed
    created_at: u64,           // Creation timestamp
    paused: bool,              // Pause flag
}
```

### Split Router Structure

```rust
struct SplitRouter {
    owner: Address,            // Configuration owner
    routes: [Option<SplitRoute>; 10],  // Up to 10 routes
    route_count: u32,          // Active routes count
}

struct SplitRoute {
    percentage: u32,           // Percentage to route (0-10000)
    recipient: Address,        // Destination address
    active: bool,              // Route enabled
}
```

## Key Algorithms

### Linear Stream Calculation

```
Available = (total_amount × elapsed_time) / stream_duration - already_withdrawn
```

Where:
- `elapsed_time = min(current_time - start_time, stream_duration)`
- `stream_duration = end_time - start_time`

**Precision**: Uses i128 math to prevent overflow/underflow

### Split Routing

When a receiver withdraws funds:

1. Check if receiver has split routes configured
2. For each active route:
   - Calculate: `split_amount = (amount × route_percentage) / 10000`
   - Add route recipient and amount to distribution list
3. Calculate remainder (if not all funds routed)
4. Add remainder to original receiver

**Circular Prevention**: Single-level check prevents A→B→A cycles

## Security Mechanisms

### Authorization

- `require_auth()` on sender for stream creation
- `require_auth()` on receiver for withdrawals
- `require_auth()` on owner for route configuration

### Math Safety

- All arithmetic uses `i128` to prevent overflow
- Division checks prevent division by zero
- Clamping ensures amounts never exceed total

### Reentrancy Protection

```
1. Calculate final state
2. Update storage
3. Execute external transfers
```

This state-before-transfer pattern prevents reentrancy attacks.

## Storage Layout

### Persistent Storage

| Key | Type | Purpose |
|-----|------|---------|
| `DataKey::Stream(id)` | Stream | Stream data |
| `DataKey::StreamCount` | u64 | Next stream ID |
| `DataKey::SplitRouter(addr)` | SplitRouter | User routes |
| `DataKey::Admin` | Address | Admin address |

### Instance Storage

Reserved for future governance/admin features.

## Event System

### Emitted Events

1. **stream_created**: New stream created
2. **withdrawal**: Funds withdrawn
3. **stream_cancelled**: Stream cancelled by sender
4. **stream_paused**: Stream paused
5. **stream_resumed**: Stream resumed
6. **routes_configured**: Split routes updated
7. **split_routed**: Automatic routing occurred

## Gas Optimization

### Contract Size

- **WASM Size**: ~45KB (64KB limit)
- **Optimization**: LTO + strip enabled

### Operation Costs

| Operation | Stroops | Notes |
|-----------|---------|-------|
| Stream creation | ~50-100 | Includes escrow transfer |
| Withdrawal | ~30-50 | Linear calculation only |
| Route configuration | ~20-40 | Storage write |

## State Transitions

### Stream Lifecycle

```
CREATED → ACTIVE → ENDED
          ├─→ PAUSED → ACTIVE
          └─→ CANCELLED
```

**CREATED**: Initial state after creation
**ACTIVE**: During stream period (not paused)
**PAUSED**: Temporarily stopped by sender
**ENDED**: Stream duration completed
**CANCELLED**: Sender cancelled early

### Authorization States

```
┌─────────────────────────────────┐
│  Stream Owner (Sender)          │
│  - Create stream                │
│  - Cancel stream                │
│  - Pause/Resume                 │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  Stream Receiver                │
│  - Withdraw available funds     │
│  - Configure split routes       │
└─────────────────────────────────┘

┌─────────────────────────────────┐
│  Public                         │
│  - Query stream info            │
│  - Query available balance      │
└─────────────────────────────────┘
```

## Scalability Considerations

### Linear Scaling

- Stream operations: O(1) per stream
- No global state dependencies
- Parallel stream processing possible

### Limitations

- Split routes: Max 10 per receiver (configurable)
- Circular detection: Single-level only
- Storage: Per-stream overhead ~500 bytes

## Future Enhancements

### Phase 2

- [ ] Batch withdrawal operations
- [ ] Dynamic stream modification
- [ ] Multi-level routing with recursion
- [ ] Governance token integration

### Phase 3

- [ ] Cross-chain bridges
- [ ] Advanced routing logic
- [ ] Community-owned drip lists
- [ ] Reputation system

## Testing Strategy

### Unit Tests

- Stream calculations
- Route validation
- Error handling
- Edge cases (zero amounts, min/max values)

### Integration Tests

- Full stream lifecycle
- Multi-stream scenarios
- Pause/resume functionality
- Authorization checks

### Fuzzing Tests

- Random stream parameters
- Boundary conditions
- Concurrent operations (simulated)

## Deployment Architecture

### Testnet

- Network: `Test SDF Network ; September 2015`
- RPC: `https://soroban-testnet.stellar.org`
- Use case: Development and testing

### Mainnet

- Network: `Public Global Stellar Network ; September 2015`
- RPC: `https://soroban-mainnet.stellar.org`
- Use case: Production deployments

## Frontend Integration

### Key Flows

1. **Create Stream**
   - Connect wallet → Input parameters → Sign transaction → Receive stream ID

2. **View Stream**
   - Enter stream ID → Fetch contract data → Display status

3. **Withdraw Funds**
   - Receiver authorization → Calculate available → Transfer tokens

4. **Configure Routes**
   - Receiver only → Define percentages → Validation → Store routes
