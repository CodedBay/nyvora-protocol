#!/bin/bash
set -e

# Safety checks for mainnet deployment
echo "⚠️  WARNING: This will deploy to Stellar Mainnet"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "This is a PRODUCTION deployment."
echo "Ensure you have:"
echo "  ✓ Thoroughly tested on testnet"
echo "  ✓ Security audit completed"
echo "  ✓ Sufficient XLM balance (>2 XLM)"
echo ""
echo "Continue? (type 'yes' to proceed)"
read -r confirmation

if [ "$confirmation" != "yes" ]; then
    echo "Deployment cancelled."
    exit 0
fi

# Check environment
if [ -z "$STELLAR_SECRET_KEY" ]; then
    echo "❌ Error: STELLAR_SECRET_KEY not set"
    exit 1
fi

# Run deployment
bash scripts/deploy.sh mainnet
