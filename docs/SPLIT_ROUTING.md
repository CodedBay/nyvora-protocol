# Split Routing Guide

## Overview

Split routing enables automatic distribution of stream funds to multiple recipients. When a receiver with split routes configured withdraws from a stream, funds are automatically routed according to their configuration.

## Use Cases

### 1. Open Source Contribution Rewards

```
Developer Stream → Team Lead (60%) + Community Fund (30%) + DAO (10%)
```

### 2. DAO Treasury Distribution

```
Grant Stream → Core Contributors (40%) + Operations (35%) + Reserves (25%)
```

### 3. Multi-Tier Ecosystem Incentives

```
Ecosystem Fund → L1 Protocols (50%) → L2 Apps (40%) → Community (10%)
```

## Configuration

Split routes are configured per receiver using basis points (1 bp = 0.01%):

```rust
let routes = vec![
    SplitRoute {
        percentage: 5000,  // 50.00%
        recipient: team_address,
        active: true,
    },
    SplitRoute {
        percentage: 5000,  // 50.00%
        recipient: dao_address,
        active: true,
    },
];

client.configure_split_routes(&receiver, &routes)?;
```

## Distribution Algorithm

1. Calculate total claimable: `(amount × elapsed) / duration - withdrawn`
2. For each active route: `split = (total × percentage) / 10000`
3. Send splits to each recipient
4. Send remainder to original receiver

## Safety Features

- **Circular Prevention**: Single-level circular routing blocked
- **Unique Recipients**: No duplicates per router
- **Percentage Validation**: Total ≤ 100%
- **Remainder Handling**: Unrouted funds go to receiver
- **Max Routes**: 10 routes per receiver

## Events

All routing operations emit events for auditing:

- `split_routed`: Emitted for each route taken
- Contains: stream_id, from, to, amount
