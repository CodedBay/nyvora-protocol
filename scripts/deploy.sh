#!/bin/bash
set -e

NETWORK=${1:-testnet}
WASM_PATH="target/wasm32-unknown-unknown/release/nyvora_stream.wasm"
OPTIMIZED_WASM_PATH="target/wasm32-unknown-unknown/release/nyvora_stream.optimized.wasm"

echo "🏗️  Building Nyvora Protocol Contract..."
echo "Network: $NETWORK"

# Build the contract
echo "→ Building WASM..."
cargo build --target wasm32-unknown-unknown --release

# Check if wasm exists
if [ ! -f "$WASM_PATH" ]; then
    echo "❌ Build failed: WASM file not found at $WASM_PATH"
    exit 1
fi

echo "✓ WASM built successfully"

# Optimize the contract
echo "→ Optimizing WASM..."
soroban contract optimize --wasm "$WASM_PATH" --output "$OPTIMIZED_WASM_PATH"

if [ ! -f "$OPTIMIZED_WASM_PATH" ]; then
    echo "❌ Optimization failed: Optimized WASM file not found"
    exit 1
fi

echo "✓ WASM optimized successfully"
echo "  Size: $(stat -f%z "$OPTIMIZED_WASM_PATH" 2>/dev/null || stat -c%s "$OPTIMIZED_WASM_PATH") bytes"

# Set network parameters
if [ "$NETWORK" = "testnet" ]; then
    NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
    RPC_URL="https://soroban-testnet.stellar.org"
    echo "→ Deploying to Stellar Testnet..."
elif [ "$NETWORK" = "mainnet" ]; then
    NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"
    RPC_URL="https://soroban-mainnet.stellar.org"
    echo "→ Deploying to Stellar Mainnet..."
else
    echo "❌ Invalid network: $NETWORK (use 'testnet' or 'mainnet')"
    exit 1
fi

# Export environment
export SOROBAN_NETWORK_PASSPHRASE="$NETWORK_PASSPHRASE"
export SOROBAN_RPC_HOST="$RPC_URL"

# Deploy contract
echo "→ Deploying contract..."
CONTRACT_ID=$(soroban contract deploy \
    --wasm "$OPTIMIZED_WASM_PATH" \
    --source admin \
    --network "$NETWORK" 2>&1 | grep -oE 'C[A-Z0-9]{55}')

if [ -z "$CONTRACT_ID" ]; then
    echo "❌ Deployment failed: Could not extract contract ID"
    exit 1
fi

echo ""
echo "✓ Deployment successful!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Contract ID: $CONTRACT_ID"
echo "Network: $NETWORK"
echo "RPC URL: $RPC_URL"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "1. Save the contract ID above"
echo "2. Update .env with CONTRACT_ID=$CONTRACT_ID"
echo "3. Run: bash scripts/setup-contracts.sh"
echo ""
