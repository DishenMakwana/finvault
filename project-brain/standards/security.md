# Standards: Security — Project Brain v2

## Security Rules
- Passwords must be hashed using `bcryptjs` with a work factor of at least 10 salt rounds.
- JWT tokens signed with a high-entropy secret (`process.env.JWT_SECRET`) and strictly validated on every server action / route.
- Sessions stored in the database and verified against revocation lists.
- SQL injection prevented through Prisma parameterized queries.
- XSS prevention through React auto-escaping.
- Sensitive credentials never committed to repository.
