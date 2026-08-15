# Nyvora Protocol: Continuous Asset Streaming & Split-Routing

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Stellar](https://img.shields.io/badge/Stellar-Protocol-1a1a2e)](https://stellar.org)
[![Soroban](https://img.shields.io/badge/Soroban-Smart%20Contracts-FF1654)](https://soroban.stellar.org)

## Overview

Nyvora Protocol is a decentralized continuous streaming protocol built on Stellar Soroban. It enables:

- **Continuous Token Streaming**: Token distribution over time with second-level precision
- **Split-Routing**: Automatic fund distribution to multiple recipients
- **Open-Source Funding**: Framework for contributor rewards and ecosystem funding
- **Asset Security**: Escrow-based fund management with authorization controls

## Key Features

- Continuous streaming with linear unlock
- Programmable split-routing with circular dependency detection
- Authorization controls via Soroban's `require_auth()`
- Precision arithmetic using `i128` to prevent overflow/underflow
- Escrow-based fund management
- Reentrancy protection through state-before-transfer pattern

## Project Structure

```
nyvora-protocol/
├── contracts/
│   └── nyvora-stream/
│       ├── src/
│       │   ├── lib.rs              # Core contract
│       │   ├── error.rs            # Error handling
│       │   ├── events.rs           # Event definitions
│       │   ├── types.rs            # Data structures
│       │   ├── stream.rs           # Stream utilities
│       │   └── split_router.rs     # Split routing logic
│       └── tests/
│           ├── integration.rs
│           └── split_routing.rs
├── frontend/
│   ├── src/
│   │   ├── app/                    # Next.js pages
│   │   ├── components/             # React components
│   │   ├── lib/
│   │   │   ├── soroban.ts          # Soroban RPC client
│   │   │   ├── contracts.ts        # Contract integration
│   │   │   └── utils.ts            # Utilities
│   │   └── types/
│   ├── package.json
│   └── tsconfig.json
├── docs/
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── SPLIT_ROUTING.md
│   ├── SECURITY_AUDIT.md
│   └── DEPLOYMENT.md
├── .github/workflows/
├── Cargo.toml
└── README.md
```

## Status

**Version:** 1.0.0 (Production Ready)  
**Development Stage:** Testnet → Mainnet Ready  
**Last Updated:** August 2026  
**Audit Status:** ✅ Approved

### Production Ready
- ✅ Smart contract core functions (create_stream, withdraw, cancel, pause/resume)
- ✅ Split routing logic with circular dependency prevention
- ✅ Frontend contract invocation layer (soroban.ts, contracts.ts)
- ✅ Comprehensive unit and integration tests
- ✅ Security audit approved
- ✅ Complete documentation

## Prerequisites

- Rust 1.75+ with `wasm32-unknown-unknown` target
- Node.js 18+
- Soroban CLI
- Stellar testnet account (for testing)

## Installation

```bash
# Clone and setup
git clone https://github.com/CodedBay/nyvora-protocol.git
cd nyvora-protocol

# Install dependencies
npm install
cd frontend && npm install && cd ..

# Build contracts
cd contracts/nyvora-stream
cargo build --target wasm32-unknown-unknown --release
cd ../..
```

## Testing

```bash
# Contract tests
cd contracts/nyvora-stream
cargo test

# Frontend tests
cd frontend
npm run test
```

## Development

```bash
# Start dev server
cd frontend
npm run dev
# Opens http://localhost:3000
```

## Deployment

See [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md) for detailed deployment procedures.

### Testnet Deployment (Overview)

```bash
# Build contract
cd contracts/nyvora-stream
cargo build --release

# Deploy to testnet
soroban contract deploy \
  --network testnet \
  --source <public-key> \
  target/wasm32-unknown-unknown/release/nyvora_stream.wasm

# Configure frontend
echo "NEXT_PUBLIC_CONTRACT_ID=<contract-id>" >> frontend/.env.local

# Start frontend
cd frontend
npm run build && npm start
```

## API Reference

### Contract Functions

#### `create_stream(sender, receiver, token, amount, start_time, end_time) -> stream_id`
Creates a new payment stream with specified parameters.

#### `withdraw(stream_id, to) -> amount`
Withdraws available funds from a stream. Applies split routing if configured.

#### `get_stream(stream_id) -> stream_details`
Returns current stream state and parameters.

#### `get_available_balance(stream_id) -> balance`
Calculates the currently claimable amount.

#### `cancel_stream(stream_id)`
Cancels a stream and processes refunds to sender.

#### `pause_stream(stream_id)` / `resume_stream(stream_id)`
Pauses or resumes stream withdrawals.

#### `configure_split_routes(routes)`
Sets up automatic fund distribution.

See [docs/API.md](docs/API.md) for complete reference.

## Architecture

- **Smart Contract**: Manages stream state and fund escrow on Stellar blockchain
- **Soroban RPC Client**: Handles transaction building, signing, and submission
- **Frontend**: React/Next.js UI for stream management and configuration

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for detailed design.

## Security Considerations

- Authorization checks required for all state changes
- Funds held in contract escrow until withdrawal conditions met
- Input validation on stream creation
- Split routing prevents circular dependencies
- Reentrancy protection via state-before-transfer pattern
- Precision arithmetic prevents overflow/underflow

**Audit Status**: Security audit completed and approved. Ready for mainnet deployment.

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Documentation

- [Architecture](docs/ARCHITECTURE.md) - System design and components
- [API Reference](docs/API.md) - Contract function specifications
- [Split Routing](docs/SPLIT_ROUTING.md) - Fund distribution mechanism
- [Security](docs/SECURITY_AUDIT.md) - Security considerations
- [Deployment](docs/DEPLOYMENT.md) - Deployment procedures
- [Deployment Checklist](DEPLOYMENT_CHECKLIST.md) - Step-by-step checklist

## License

MIT License - see [LICENSE](LICENSE)

## Support

- 📚 [Stellar Docs](https://developers.stellar.org)
- 💬 [Stellar Discord](https://discord.gg/stellar)
- 🐛 [GitHub Issues](https://github.com/CodedBay/nyvora-protocol/issues)

## Acknowledgments

Built on [Stellar Soroban](https://soroban.stellar.org). Inspired by streaming payment protocols.

---

**Made for open-source funding on Stellar**
