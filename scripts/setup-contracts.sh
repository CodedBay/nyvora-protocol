#!/bin/bash
set -e

echo "🔧 Setting up Nyvora Protocol contracts..."
echo ""

# Check if contract ID is provided
if [ -z "$1" ]; then
    echo "Usage: bash scripts/setup-contracts.sh <contract-id>"
    echo ""
    echo "Example:"
    echo "  bash scripts/setup-contracts.sh CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF"
    exit 1
fi

CONTRACT_ID=$1
NETWORK=${2:-testnet}

echo "Contract ID: $CONTRACT_ID"
echo "Network: $NETWORK"
echo ""

# Set network parameters
if [ "$NETWORK" = "testnet" ]; then
    NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
    RPC_URL="https://soroban-testnet.stellar.org"
elif [ "$NETWORK" = "mainnet" ]; then
    NETWORK_PASSPHRASE="Public Global Stellar Network ; September 2015"
    RPC_URL="https://soroban-mainnet.stellar.org"
else
    echo "❌ Invalid network: $NETWORK"
    exit 1
fi

export SOROBAN_NETWORK_PASSPHRASE="$NETWORK_PASSPHRASE"
export SOROBAN_RPC_HOST="$RPC_URL"

# Verify contract exists
echo "→ Verifying contract..."
CONTRACT_INFO=$(soroban contract info \
    --id "$CONTRACT_ID" \
    --network "$NETWORK" 2>&1 || echo "NOT_FOUND")

if [ "$CONTRACT_INFO" = "NOT_FOUND" ]; then
    echo "❌ Contract not found: $CONTRACT_ID"
    exit 1
fi

echo "✓ Contract found"
echo ""
echo "✓ Setup complete!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Contract is ready to use at:"
echo "  $CONTRACT_ID"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Next steps:"
echo "1. Update frontend/.env with NEXT_PUBLIC_CONTRACT_ID=$CONTRACT_ID"
echo "2. Start frontend: cd frontend && npm run dev"
echo ""
