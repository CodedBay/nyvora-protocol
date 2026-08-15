# Known Issues and Limitations

**Version:** 0.1.0 (Pre-Release)  
**Updated:** August 2026

This document lists known issues, limitations, and areas requiring attention before production use.

---

## Before Testnet

### None Known
All identified issues have been addressed or documented below.

---

## Testnet Phase

### Required Before Mainnet

1. **Security Audit**
   - Status: NOT COMPLETED
   - Impact: HIGH
   - Action: Formal security audit required before mainnet deployment
   - Recommended: Engage professional audit firm

2. **Load Testing**
   - Status: NOT COMPLETED
   - Impact: MEDIUM
   - Current: No performance testing under load
   - Need: Stress test with multiple concurrent users/streams

3. **Rate Limiting**
   - Status: NOT IMPLEMENTED
   - Impact: MEDIUM
   - Current: No rate limiting on contract calls
   - Need: Implement rate limiting before production

---

## Design Limitations

### 1. Circular Route Detection
- **Scope**: Single-level bidirectional only
- **Impact**: LOW
- **Description**: Detects direct circular dependencies (A → B → A)
- **Does Not Detect**: Multi-level cycles (A → B → C → A)
- **Workaround**: Manual validation of complex routing chains
- **Future**: Consider graph traversal for deep cycle detection

### 2. Split Routes
- **Limit**: 10 routes maximum per receiver
- **Impact**: LOW
- **Reason**: Fixed array implementation
- **Workaround**: Create multiple receivers if more routes needed
- **Future**: Could use dynamic Vec if Soroban supports

### 3. Stream Querying
- **Limitation**: No pagination support
- **Impact**: LOW (at current scale)
- **Current**: `get_stream_count()` returns only count
- **Future**: Add `get_streams(offset, limit)` for pagination

### 4. Time Precision
- **Precision**: Second-level (Unix timestamps)
- **Impact**: LOW
- **Note**: Sub-second precision not supported
- **Use Case**: Acceptable for typical streaming scenarios

---

## Performance Notes

### Not Yet Optimized
- No caching in frontend
- No transaction batching
- No parallel stream processing
- Single-threaded contract execution

### Gas Costs (Testnet)
- Create stream: ~50,000 stroops (estimate)
- Withdraw: ~30,000 stroops (estimate)
- These are preliminary and may change

### Scalability
- No load testing completed
- Unknown maximum concurrent streams
- Unknown maximum routing depth
- Performance under 1000+ streams: untested

---

## Frontend Limitations

### Browser Support
- Requires Freighter wallet extension
- Tested on: Chrome, Firefox (on desktop)
- Mobile: Not tested

### Environment Configuration
- Requires manual .env setup
- No automatic network detection
- Must manually switch networks in Freighter

### UI/UX
- Basic interface, not polished
- No visual feedback during transactions
- Limited error messages
- No transaction history view

---

## Testing Status

### Contract Tests
- ✅ 7 test cases implemented
- ✅ Basic coverage of core functions
- 🟡 No fuzzing or property-based testing
- 🟡 Limited edge case coverage

### Frontend Tests
- ✅ 11 test cases written
- ✅ Mock testing setup
- 🟡 No end-to-end testing
- 🟡 No real network testing

### Integration Tests
- 🟡 Limited cross-component testing
- 🟡 No testnet integration testing
- 🟡 No mainnet testing

---

## Documentation

### Complete
- ✅ Basic API reference
- ✅ Architecture overview
- ✅ Split routing explanation

### Needs Improvement
- 🟡 Troubleshooting guide
- 🟡 Common error solutions
- 🟡 Example use cases
- 🟡 Performance tuning guide

---

## Security Considerations

### Verified
- ✅ Authorization checks implemented
- ✅ Input validation present
- ✅ Overflow protection via i128
- ✅ Circular dependency detection

### Not Verified
- 🟡 Professional audit not completed
- 🟡 No formal threat model
- 🟡 No penetration testing
- 🟡 No formal vulnerability disclosure

### Recommendations
1. Do not use on mainnet until audited
2. Start with small amounts on testnet
3. Monitor all transactions carefully
4. Report security issues responsibly

---

## Browser/Environment

### Known Compatible
- Node.js 18+
- Rust 1.75+
- Next.js 14.2+
- Soroban SDK 11.0+

### Not Tested
- Node.js 17 or earlier
- Rust 1.70 or earlier
- Other Next.js versions
- Windows without WSL2

---

## Rollout Plan

### Phase 1: Internal Testing (Now)
- [ ] Deploy to local testnet
- [ ] Basic functionality verification
- [ ] Team review and testing

### Phase 2: Testnet (When ready)
- [ ] Deploy to public testnet
- [ ] Longer-term stability testing
- [ ] Community testing and feedback
- [ ] Load testing

### Phase 3: Mainnet (If audit passes)
- [ ] Professional security audit
- [ ] Audit remediation
- [ ] Final verification
- [ ] Mainnet deployment

---

## Feedback and Reporting

### Bug Reports
- Use GitHub Issues
- Include steps to reproduce
- Attach error logs/screenshots

### Security Issues
- DO NOT open public GitHub issues
- Email: security@nyvora.protocol
- GPG key available upon request

### Feature Requests
- Use GitHub Discussions
- Include use case
- Include proposed solution (if any)

---

## Version History

### 0.1.0 (Current)
- Initial pre-release
- Core streaming functionality
- Basic split routing
- Frontend integration layer

### Future Versions
- TBD based on audit results and community feedback

---

## Contact

For questions or issues not covered here:
1. Check documentation (docs/ folder)
2. Search GitHub Issues
3. Open new GitHub Issue
4. Contact team

---

**Note**: This is pre-release software. Use at your own risk and only after careful review.
