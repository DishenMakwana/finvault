# Review Layer: Security Review — Project Brain v2

## Security Checklist
- [ ] Authentication: Token is cryptographically signed and verified
- [ ] Session Revocation: Database session existence is checked on protected requests
- [ ] Password Hashing: Uses bcryptjs with salt rounds
- [ ] Authorization: Queries scope data by `userId` to prevent IDOR
- [ ] Data Sanitization: Numeric values strictly validated to prevent NaN or negative balances
- [ ] Soft Deletion: Soft-deleted records are filtered out of cash sums
