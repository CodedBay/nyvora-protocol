# Deployment Guide

## Prerequisites

### System Requirements

- **Rust**: 1.70+ with `wasm32-unknown-unknown` target
- **Node.js**: 18+
- **Soroban CLI**: Latest version
- **Stellar Account**: With sufficient XLM balance

### Installation

```bash
# Install Rust (if not already installed)
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Add WASM target
rustup target add wasm32-unknown-unknown

# Install Soroban CLI
cargo install soroban-cli

# Install Node.js 18+ (macOS with Homebrew)
brew install node@18

# Verify installations
rustc --version
soroban --version
node --version
```

## Local Development

### Setup

```bash
# Clone repository
git clone https://github.com/CodedBay/nyvora-protocol.git
cd nyvora-protocol

# Install all dependencies
npm run setup

# Build contracts
cargo build --target wasm32-unknown-unknown --release

# Start frontend dev server
npm run dev
```

### Testing

```bash
# Run all tests
npm run test

# Run integration tests
npm run test:integration

# Generate coverage report
npm run test:coverage
```

### Linting

```bash
# Format and lint all code
npm run lint

# Auto-format code
npm run format
```

## Testnet Deployment

### Step 1: Setup Testnet Account

```bash
# Create account or use existing
soroban account create --network testnet <account-name>

# Get account details
soroban account info --network testnet <account-name>

# Fund account (visit https://developers.stellar.org/testnet-faucet)
```

### Step 2: Configure Environment

```bash
# Copy and edit environment file
cp .env.example .env

# Edit .env with testnet details
cat > .env << EOF
SOROBAN_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
SOROBAN_RPC_HOST="https://soroban-testnet.stellar.org"
STELLAR_SECRET_KEY=your_secret_key_here
ADMIN_ADDRESS=your_public_key_here
EOF
```

### Step 3: Deploy Contract

```bash
# Deploy to testnet
bash scripts/deploy.sh testnet

# Output: Contract ID (save this!)
# CONTRACT_ID=C...
```

### Step 4: Setup Contract

```bash
# Use returned contract ID
bash scripts/setup-contracts.sh <CONTRACT_ID> testnet
```

### Step 5: Configure Frontend

```bash
# Update frontend environment
cat > frontend/.env.local << EOF
NEXT_PUBLIC_CONTRACT_ID=<CONTRACT_ID>
NEXT_PUBLIC_NETWORK="testnet"
NEXT_PUBLIC_RPC_URL="https://soroban-testnet.stellar.org"
NEXT_PUBLIC_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
EOF

# Start frontend
cd frontend && npm run dev
```

## Mainnet Deployment

### ⚠️ Pre-Deployment Checklist

Before deploying to mainnet:

- [ ] Contract thoroughly tested on testnet
- [ ] Formal security audit completed
- [ ] Team consensus on contract code
- [ ] Emergency plan documented
- [ ] Backup and recovery procedures in place
- [ ] Legal review completed
- [ ] Community review completed

### Step 1: Mainnet Account Setup

```bash
# Create mainnet account
soroban account create --network mainnet <account-name>

# Fund account with sufficient XLM
# - Minimum: 2 XLM per transaction
# - Recommended: 50+ XLM for operations

# Verify account
soroban account info --network mainnet <account-name>
```

### Step 2: Configure Mainnet Environment

```bash
# Create mainnet config
cat > .env.mainnet << EOF
SOROBAN_NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"
SOROBAN_RPC_HOST="https://soroban-mainnet.stellar.org"
STELLAR_SECRET_KEY=your_mainnet_secret_key
ADMIN_ADDRESS=your_mainnet_public_key
EOF

# Export for deployment
export $(cat .env.mainnet | xargs)
```

### Step 3: Build Release

```bash
# Build optimized release
cargo build --target wasm32-unknown-unknown --release

# Optimize WASM
soroban contract optimize \
  --wasm target/wasm32-unknown-unknown/release/nyvora_stream.wasm
```

### Step 4: Deploy to Mainnet

```bash
# Safety prompt included in script
bash scripts/deploy-mainnet.sh

# Confirmation required - read carefully!
# Type 'yes' to proceed
```

### Step 5: Verify Deployment

```bash
# Check contract on-chain
soroban contract info \
  --id <CONTRACT_ID> \
  --network mainnet

# View on Stellar Expert
# https://expert.stellar.org/contract/<CONTRACT_ID>
```

### Step 6: Production Frontend

```bash
# Build production frontend
cd frontend
npm run build

# Set mainnet environment
cat > .env.production << EOF
NEXT_PUBLIC_CONTRACT_ID=<MAINNET_CONTRACT_ID>
NEXT_PUBLIC_NETWORK="mainnet"
NEXT_PUBLIC_RPC_URL="https://soroban-mainnet.stellar.org"
NEXT_PUBLIC_NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"
EOF

# Deploy to hosting (Vercel, Netlify, etc.)
npm run start
```

## Deployment Scripts

### `deploy.sh`

Universal deployment script for testnet and mainnet.

```bash
# Testnet
bash scripts/deploy.sh testnet

# Mainnet (with safety check)
bash scripts/deploy-mainnet.sh
```

### `setup-contracts.sh`

Configure deployed contract.

```bash
bash scripts/setup-contracts.sh <CONTRACT_ID> <NETWORK>
```

## CI/CD Deployment

### GitHub Actions

Automatic deployment on push to main:

```yaml
# Triggered on:
# - Push to main branch
# - Tag creation (release)

# Runs:
# 1. Tests
# 2. Build WASM
# 3. Deploy to testnet
# 4. Build frontend
```

### Enabling CI/CD

1. Add secrets to GitHub repository:
   - `STELLAR_TESTNET_SECRET_KEY`
   - `STELLAR_MAINNET_SECRET_KEY` (optional)

2. Push to trigger workflows:
   ```bash
   git push origin main
   ```

3. Monitor in Actions tab

## Monitoring & Verification

### On-Chain Verification

```bash
# Get contract source
soroban contract metadata <CONTRACT_ID>

# Check balance
soroban account balance <CONTRACT_ADDRESS>

# View recent transactions
soroban contract events <CONTRACT_ID>
```

### Block Explorer

- **Testnet**: https://soroban-testnet.stellar.org
- **Mainnet**: https://soroban-mainnet.stellar.org

### Frontend Verification

```bash
# Check contract connection
curl "https://soroban-testnet.stellar.org/soroban/rpc" \
  -X POST \
  -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}'
```

## Rollback Procedures

### If Contract Fails

1. **Immediate Actions**
   - Pause affected streams (if possible)
   - Alert users
   - Disable transactions

2. **Investigation**
   - Check contract state
   - Review transactions
   - Identify root cause

3. **Recovery**
   - Deploy new contract (v0.1.1)
   - Migrate state if possible
   - Or restart with migration plan

4. **Prevention**
   - Implement circuit breaker
   - Add transaction limits
   - Increase monitoring

## Backup & Recovery

### Contract Backup

```bash
# Export contract metadata
soroban contract metadata <CONTRACT_ID> > contract-backup.json

# Save transaction history
# Via block explorer or API

# Document state
# Current streams, routes, balances
```

### State Recovery

```bash
# If contract upgraded:
# 1. Read old contract state
# 2. Export key data
# 3. Deploy new contract
# 4. Migrate state via initialization
```

## Security Considerations

### Key Management

```bash
# Never commit secrets
echo ".env" >> .gitignore
echo ".env.*.local" >> .gitignore

# Use environment variables
export STELLAR_SECRET_KEY="your_key_here"

# Rotate keys periodically
# Keep backup in secure location
```

### Network Selection

```bash
# Always test on testnet first
# Use different keys for testnet/mainnet
# Set environment carefully

# Verify network before deploy
export SOROBAN_NETWORK_PASSPHRASE="correct_passphrase"
```

### Monitoring

```bash
# Watch for suspicious activity
# Monitor gas costs
# Check for failed transactions
# Review event logs
```

## Troubleshooting

### Contract Won't Deploy

```bash
# Check WASM size
ls -lh target/wasm32-unknown-unknown/release/nyvora_stream.optimized.wasm

# Should be < 64KB
# If larger, check for unused dependencies
```

### Insufficient Balance

```bash
# Fund additional account
# Minimum 2 XLM per transaction
# Check current balance

soroban account balance <ACCOUNT> --network testnet
```

### RPC Connection Errors

```bash
# Check network status
curl https://soroban-testnet.stellar.org/health

# Try alternative RPC
export SOROBAN_RPC_HOST="alternative_url"
```

### Transaction Timeouts

```bash
# Increase timeout
export SOROBAN_TIMEOUT=60

# Check ledger sync
soroban ledger status --network testnet
```

## Support

- Documentation: https://developers.stellar.org
- Discord: https://discord.gg/stellar
- Issues: https://github.com/CodedBay/nyvora-protocol/issues
