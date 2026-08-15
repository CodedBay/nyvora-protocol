# Nyvora Protocol - Deployment Checklist# Deployment Checklist

**Target:** Testnet Deployment  
**Stage:** Pre-Deployment Verification  
**Updated:** August 2026

This checklist helps ensure all prerequisites and verification steps are completed before deploying to testnet.

---

## Prerequisites

### System Requirements
- [ ] Rust 1.75+ installed (`rustc --version`)
- [ ] Soroban CLI installed (`soroban --version`)
- [ ] Node.js 18+ installed (`node --version`)
- [ ] npm installed (`npm --version`)
- [ ] Git installed (`git --version`)

### Environment Setup
- [ ] Copy `.env.example` to `.env` in `frontend/` directory
- [ ] Copy `.env.example` to `.env` in root directory
- [ ] Update `NEXT_PUBLIC_RPC_URL` to testnet endpoint
- [ ] Ensure `NEXT_PUBLIC_NETWORK_PASSPHRASE` is set to testnet

### Wallet Setup
- [ ] Freighter wallet extension installed
- [ ] Testnet account funded with XLM
- [ ] Verify account has minimum 50 XLM for contract operations

---

## Phase 1: Contract Build & Test (Day 1)

### Build Smart Contract
```bash
cd contracts/nyvora-stream
cargo build --release
```

**Expected Output:**
- [ ] No compilation errors
- [ ] `target/wasm32-unknown-unknown/release/nyvora_stream.wasm` created (< 500KB)
- [ ] All warnings reviewed and acceptable

### Run Contract Tests
```bash
cargo test
```

**Tests to Pass:**
- [ ] `test_split_route_configuration` ✅
- [ ] `test_split_route_percentage_validation` ✅
- [ ] `test_circular_route_prevention` ✅
- [ ] `test_split_route_distribution` ✅
- [ ] `test_split_route_with_remainder` ✅
- [ ] `test_deactivate_split_routes` ✅
- [ ] All integration tests ✅

**Expected Result:** 7/7 tests pass (or see documentation for known issues)

---

## Phase 2: Frontend Build & Test (Day 1-2)

### Install Dependencies
```bash
cd frontend
npm install
```

**Check:**
- [ ] No dependency conflicts
- [ ] `node_modules/` created
- [ ] `@stellar/stellar-sdk` version 11.0.0+
- [ ] `@stellar/freighter-api` version 2.0.0+

### Type Check
```bash
npm run type-check
```

**Expected:** No TypeScript errors

### Run Frontend Tests
```bash
npm run test -- frontend/src/lib/__tests__/contracts.test.ts
```

**Tests to Pass:**
- [ ] `createStream` invocation test ✅
- [ ] `withdrawFromStream` test ✅
- [ ] `getStream` test ✅
- [ ] `getAvailableBalance` test ✅
- [ ] `cancelStream` test ✅
- [ ] `pauseStream` test ✅
- [ ] `resumeStream` test ✅
- [ ] `configureSplitRoutes` test ✅
- [ ] `getStreamCount` test ✅
- [ ] Error handling tests ✅
- [ ] Type safety tests ✅

**Expected Result:** 11/11 tests pass

### Build Frontend
```bash
npm run build
```

**Check:**
- [ ] Build completes without errors
- [ ] `.next/` directory created
- [ ] No TypeScript compilation errors
- [ ] Bundle size reasonable (< 5MB gzip)

---

## Phase 3: Contract Deployment (Day 2)

### Prepare Deployment Account
```bash
# Set testnet account as source
export SOURCE_ACCOUNT="<your-public-key>"
export TESTNET_SECRET="<your-secret-key>"
```

### Deploy Contract
```bash
cd contracts/nyvora-stream
soroban contract deploy \
  --network testnet \
  --source $SOURCE_ACCOUNT \
  --wasm target/wasm32-unknown-unknown/release/nyvora_stream.wasm
```

**Expected Output:**
- [ ] Contract ID returned (format: `C...`)
- [ ] Deployment transaction successful
- [ ] No authorization errors

### Record Contract ID
```bash
# Save to .env
export CONTRACT_ID="<contract-id-from-deployment>"
echo "NEXT_PUBLIC_CONTRACT_ID=$CONTRACT_ID" >> frontend/.env.local
```

### Verify Contract Deployment
```bash
soroban contract info --network testnet --id $CONTRACT_ID
```

**Check:**
- [ ] Contract visible on testnet
- [ ] All contract methods listed
- [ ] Contract storage initialized

---

## Phase 4: Frontend Configuration (Day 2)

### Update Environment Variables
```
# frontend/.env.local
NEXT_PUBLIC_NETWORK_PASSPHRASE="Test SDF Network ; September 2015"
NEXT_PUBLIC_RPC_URL="https://soroban-testnet.stellar.org"
NEXT_PUBLIC_CONTRACT_ID="C..." (from deployment)
```

### Verify Configuration
```bash
npm run type-check
```

**Check:**
- [ ] No environment variable errors
- [ ] `CONTRACT_ID` properly formatted
- [ ] Network passphrase correct

### Start Development Server
```bash
npm run dev
```

**Expected:**
- [ ] Server starts on http://localhost:3000
- [ ] No console errors
- [ ] No TypeScript errors

---

## Phase 5: Integration Testing (Day 3)

### Test Wallet Connection
1. [ ] Open http://localhost:3000 in browser
2. [ ] Freighter wallet extension loaded
3. [ ] Click "Connect Wallet"
4. [ ] Approve connection in Freighter
5. [ ] Account displays in UI

### Test Stream Creation
1. [ ] Fill stream creation form:
   - [ ] Receiver: valid testnet account
   - [ ] Token: SAC token contract ID
   - [ ] Amount: 1000 (test amount)
   - [ ] Duration: 1 hour
2. [ ] Click "Create Stream"
3. [ ] Freighter prompts for signature
4. [ ] Transaction submitted successfully
5. [ ] Stream ID returned
6. [ ] Event log shows stream_created

### Test Stream Query
1. [ ] Enter stream ID from creation
2. [ ] Click "Get Stream Details"
3. [ ] Contract data displayed:
   - [ ] Sender shows correct address
   - [ ] Receiver matches input
   - [ ] Amount displays correctly
   - [ ] Start/end times shown
   - [ ] Withdrawn amount = 0
   - [ ] Paused = false

### Test Stream Withdrawal
1. [ ] Wait for stream to start (or use past time)
2. [ ] Click "Withdraw Available"
3. [ ] Transaction submitted
4. [ ] Funds transferred to receiver
5. [ ] Withdrawn amount updated
6. [ ] Event log shows withdrawal

### Test Split Routing
1. [ ] Configure split routes (50/50 split)
2. [ ] Create stream to first receiver
3. [ ] Verify split routing during withdrawal
4. [ ] Check both recipients received funds

### Test Error Handling
1. [ ] Try withdraw from non-existent stream
   - [ ] Error message displays
   - [ ] No console crashes
2. [ ] Try cancel someone else's stream
   - [ ] Authorization error shown
3. [ ] Try invalid percentages (> 100%)
   - [ ] Validation error shown

---

## Phase 6: Load Testing (Day 3-4)

### Create Multiple Streams
```bash
# Test script to create 10 streams
for i in {1..10}; do
  echo "Creating stream $i..."
  # Call createStream with different parameters
done
```

**Check:**
- [ ] All 10 streams created successfully
- [ ] Stream IDs increment properly
- [ ] No rate limiting issues
- [ ] Contract storage accessible

### Concurrent Withdrawals
```bash
# Simulate multiple concurrent withdrawals
```

**Check:**
- [ ] No transaction conflicts
- [ ] Balances calculated correctly
- [ ] No funds duplicated
- [ ] Transaction fees reasonable

---

## Phase 7: Security Checks (Day 4)

### Authorization Verification
- [ ] [ ] Sender can only cancel their streams
- [ ] [ ] Receiver can only withdraw their streams
- [ ] [ ] Non-auth users rejected
- [ ] [ ] Signature required for all state changes

### Input Validation
- [ ] [ ] Negative amounts rejected
- [ ] [ ] Past times rejected
- [ ] [ ] Invalid addresses rejected
- [ ] [ ] Over-100% splits rejected

### Reentrancy Protection
- [ ] [ ] Withdrawn amount updated before transfer
- [ ] [ ] No double-withdrawal possible
- [ ] [ ] Stream state locked during transfer

### Contract State Integrity
- [ ] [ ] Stream counts accurate
- [ ] [ ] Balances never negative
- [ ] [ ] No funds lost or duplicated
- [ ] [ ] Storage consistent

---

## Phase 8: Performance Benchmarks (Day 4-5)

### Gas Usage Measurements
- [ ] Create stream: < 50,000 stroops
- [ ] Withdraw: < 30,000 stroops
- [ ] Cancel stream: < 25,000 stroops
- [ ] Configure split routes: < 20,000 stroops

### Response Time Measurements
- [ ] Create transaction: < 2 seconds
- [ ] Submit transaction: < 5 seconds
- [ ] Query contract: < 1 second
- [ ] Poll status: < 30 seconds total

### Scalability Assessment
- [ ] 100 concurrent users: no errors
- [ ] 1,000 created streams: fast queries
- [ ] 100 routes per user: performant

---

## Phase 9: Documentation & Cleanup (Day 5)

### Update Documentation
- [ ] [ ] Update API.md with testnet contract ID
- [ ] [ ] Add deployment transaction hash
- [ ] [ ] Document test results
- [ ] [ ] Update DEPLOYMENT.md with actual URLs

### Code Cleanup
- [ ] [ ] Remove TODO comments
- [ ] [ ] Remove console.log debug statements
- [ ] [ ] Check for unused imports
- [ ] [ ] Lint all code

### Repository Readiness
- [ ] [ ] All tests passing
- [ ] [ ] No uncommitted changes
- [ ] [ ] README reflects current status
- [ ] [ ] Dependencies up to date

---

## Go/No-Go Decision Criteria

### Must Have (Blocking)
- ✅ All contract tests pass
- ✅ All frontend tests pass
- ✅ Contract deploys without errors
- ✅ Frontend connects to contract
- ✅ Basic stream creation works
- ✅ Withdrawal functions correctly
- ✅ Split routing routes funds correctly

### Should Have (Non-blocking for testnet)
- [ ] Load testing shows no degradation
- [ ] Error messages are clear
- [ ] Performance within limits
- [ ] All edge cases handled

### Nice to Have (Post-testnet)
- [ ] Analytics/monitoring
- [ ] Advanced UI features
- [ ] Pagination support
- [ ] Advanced queries

---

## Rollback Plan

If deployment fails at any phase:

1. **Phase 1-2 Failures:** Delete and rebuild locally
   - [ ] `cargo clean` && `cargo build --release`
   - [ ] `npm ci && npm run build`

2. **Phase 3 Deployment Failure:** Redeploy contract
   - [ ] Don't need to redeploy if contract code is same
   - [ ] Just update CONTRACT_ID in .env

3. **Phase 5 Integration Failure:** 
   - [ ] Check contract ID in .env
   - [ ] Verify RPC URL
   - [ ] Check Freighter wallet
   - [ ] Review contract events for errors

4. **Phase 6-7 Issues:**
   - [ ] Redeploy fresh contract if code needs changes
   - [ ] Clear browser cache
   - [ ] Reset Freighter wallet if stuck

---

## Success Criteria Checklist

After completing all phases, verify:

- [ ] Contract deployed and functional on testnet
- [ ] Frontend connects and authenticates
- [ ] All 9 contract functions callable
- [ ] Split routing working correctly
- [ ] No unhandled errors in console
- [ ] All tests passing (100%)
- [ ] Documentation updated
- [ ] Performance metrics documented
- [ ] Security checks completed
- [ ] Code quality verified

---

## Post-Deployment

### Monitor
- [ ] Transaction history (Soroban RPC)
- [ ] Contract events (WebSocket subscription)
- [ ] User feedback and bug reports
- [ ] Performance metrics

### Next Steps (Week 2)
- [ ] Formal security audit
- [ ] Testnet stabilization
- [ ] Mainnet preparation
- [ ] Governance setup (if applicable)

---

## Contact & Support

For deployment issues:
1. Check logs: `tail -f logs/deployment.log`
2. Review errors in browser console
3. Check contract events for detailed error messages
4. Consult ARCHITECTURE.md for design decisions
5. Review API.md for contract specifications

---

**Deployment Lead:** [To be assigned]  
**QA Lead:** [To be assigned]  
**Audit Contact:** [To be assigned]
