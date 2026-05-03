# Security & Best Practices Guide

## Table of Contents

1. [Authentication & Authorization](#authentication--authorization)
2. [Data Protection](#data-protection)
3. [Rate Limiting](#rate-limiting)
4. [Input Validation](#input-validation)
5. [API Security](#api-security)
6. [Password Security](#password-security)
7. [Logging & Monitoring](#logging--monitoring)
8. [Deployment Security](#deployment-security)
9. [Common Vulnerabilities](#common-vulnerabilities)
10. [Security Checklist](#security-checklist)

---

## Authentication & Authorization

### JWT (JSON Web Tokens)

The API uses JWT for stateless authentication.

**Token Details:**

- **Algorithm**: HS256 (HMAC-SHA256)
- **Expiry**: 7 days
- **Payload**: `{ userId, username }`

**Token Structure:**

```
Header.Payload.Signature

Header:   {"alg": "HS256", "typ": "JWT"}
Payload:  {"userId": "USR-xxxx", "username": "john_doe", "iat": ..., "exp": ...}
Signature: HMACSHA256(base64UrlEncode(header) + "." + base64UrlEncode(payload), secret)
```

### Best Practices

✅ **DO:**

- Store JWT securely (httpOnly cookie or secure storage)
- Include token in `Authorization: Bearer <token>` header
- Refresh token before expiry (implement refresh token flow if needed)
- Rotate JWT_SECRET periodically in production
- Validate token on every protected request

❌ **DON'T:**

- Store JWT in localStorage (XSS vulnerable)
- Send JWT in query parameters
- Use weak secrets (< 32 characters)
- Log JWT tokens
- Hardcode secrets in code

### Implementation

```javascript
// Login - get token
POST /api/auth/login
Response: { token: "eyJhbGc..." }

// Use token in requests
GET /api/auth/me
Headers: Authorization: Bearer eyJhbGc...

// Token expires after 7 days
// Get new token by logging in again
```

### Role-Based Access Control

**Roles:**

- **admin** - Group creator, can manage members and expenses
- **member** - Regular group member, can add expenses

```javascript
// Check role in controllers
if (String(group.createdBy) !== String(req.user.userId)) {
  throw new Error("Only group admin can perform this action");
}
```

---

## Data Protection

### Password Security

**Hashing:**

- Algorithm: bcryptjs
- Salt rounds: 12
- One-way function (irreversible)

```javascript
// Registration
const hashedPassword = await bcrypt.hash(password, 12);

// Login verification
const isValid = await bcrypt.compare(inputPassword, hashedPassword);
```

**Password Requirements:**

- Minimum 6 characters
- No additional complexity rules (allow user choice)

**Never:**

- Store plain text passwords
- Log passwords
- Send passwords in responses
- Use weak hash functions (MD5, SHA1)

### Sensitive Data Handling

**Never exposed in responses:**

- ✅ `password` - excluded from all responses
- ✅ `__v` - MongoDB version field excluded
- ✅ `_id` - internal MongoDB ID excluded

**Always sanitized:**

- Email addresses (lowercase, trimmed)
- Usernames (lowercase, trimmed)
- String inputs (trimmed)
- URLs (validated)

---

## Rate Limiting

### Limits by Endpoint

| Endpoint         | Limit        | Window     |
| ---------------- | ------------ | ---------- |
| `/auth/login`    | 5 requests   | 15 minutes |
| `/auth/register` | 5 requests   | 15 minutes |
| `/payments/*`    | 10 requests  | 15 minutes |
| All other APIs   | 100 requests | 15 minutes |

### Bypass in Development

Rate limiting is automatically disabled when:

```env
NODE_ENV=development
```

### Implementation

```javascript
// middleware/rateLimiter.js
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests max
  skip: (req) => process.env.NODE_ENV === "development",
  handler: (req, res) => {
    res.status(429).json({
      success: false,
      message: "Too many requests, please try again later",
      errorCode: "RATE_LIMIT_EXCEEDED",
    });
  },
});
```

### Adjust Limits

Edit `middleware/rateLimiter.js`:

```javascript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // Change time window
  max: 5, // Change request limit
});
```

---

## Input Validation

### Joi Schema Validation

All request bodies are validated against Joi schemas.

**Example:**

```javascript
register: Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
  name: Joi.string().max(100).required(),
  username: Joi.string().alphanum().min(3).max(30).required(),
});
```

**Validation Rules:**

- Email must be valid format
- Password minimum 6 characters
- Username: alphanumeric only, 3-30 characters
- Amount must be positive number
- Split type must be 'equal', 'exact', or 'percentage'

### Input Sanitization

**Applied to all requests:**

- Trim whitespace from strings
- Lowercase email addresses
- Remove unknown fields
- Convert types correctly

### Error Responses

```json
{
  "success": false,
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "email",
      "message": "\"email\" must be a valid email"
    },
    {
      "field": "password",
      "message": "\"password\" must be at least 6 characters"
    }
  ]
}
```

---

## API Security

### CORS (Cross-Origin Resource Sharing)

```javascript
// app.js
app.use(
  cors({
    origin: process.env.CLIENT_URL || "*",
  }),
);
```

**Configuration:**

- Only allow requests from `CLIENT_URL`
- Prevents unauthorized cross-site requests
- Methods: GET, POST, PUT, PATCH, DELETE

**Set in .env:**

```env
CLIENT_URL=https://yourdomain.com
```

### Helmet Security Headers

```javascript
// Adds security headers:
// - Content-Security-Policy
// - X-Frame-Options
// - X-Content-Type-Options
// - X-XSS-Protection
// - Strict-Transport-Security
// - etc.
```

### HTTPS in Production

**Required for production:**

```env
NODE_ENV=production
```

**Use reverse proxy with SSL:**

- Nginx with Let's Encrypt
- AWS CloudFront
- Cloudflare
- Railway, Heroku, etc.

### Error Exposure

**Development:**

```json
{
  "success": false,
  "message": "Database connection failed",
  "stack": "Error: connect ECONNREFUSED ...\n    at ..."
}
```

**Production:**

```json
{
  "success": false,
  "message": "Database connection failed",
  "errorCode": "INTERNAL_ERROR"
}
```

Stack traces are hidden in production automatically.

---

## Password Security

### Strength Requirements

Current requirements:

- Minimum 6 characters
- No complexity rules

**Recommended for users:**

- Mix of uppercase and lowercase
- Include numbers and symbols
- Avoid common patterns (123456, password, etc.)
- Don't reuse passwords

### Password Reset Flow

_(To be implemented if needed)_

Suggested flow:

1. User requests password reset
2. Verify email address
3. Send reset link with token
4. Token expires in 1 hour
5. User sets new password
6. Old sessions invalidated

---

## Logging & Monitoring

### What Gets Logged

**HTTP Requests (Morgan):**

```
GET /api/users/search 200 1234 - 45ms
POST /api/expenses 201 5678 - 123ms
DELETE /api/groups/:id 204 - - 89ms
```

**Errors (Winston):**

```
[2024-03-27 14:30:45] ERROR: Database connection failed: ECONNREFUSED
[2024-03-27 14:30:50] WARN: Rate limit exceeded for IP: 192.168.1.1
```

### What's NOT Logged

✅ Passwords (never logged)
✅ JWT tokens (never logged)
✅ Email addresses (if sensitive)
✅ Credit card data (never stored/logged)

### Accessing Logs

```bash
# View recent errors
tail -f logs/error.log

# Search for specific errors
grep "database" logs/error.log

# View HTTP requests
tail -f logs/combined.log | grep "GET"

# Count specific errors
grep -c "VALIDATION_ERROR" logs/combined.log
```

### Log Rotation

Logs automatically rotate:

- Max file size: 5MB
- Max files: 5
- Old logs retained for audit trail

---

## Deployment Security

### Environment Variables

**Never hardcode secrets:**

```javascript
// ❌ DO NOT DO THIS
const secret = "my-super-secret-key";

// ✅ DO THIS
const secret = process.env.JWT_SECRET;
```

**Required environment variables:**

```env
JWT_SECRET=<generate-secure-random-string>
MONGODB_URI=<database-connection-string>
RAZORPAY_KEY_ID=<production-key>
RAZORPAY_KEY_SECRET=<production-secret>
NODE_ENV=production
```

### Deployment Checklist

- [ ] All environment variables set
- [ ] JWT_SECRET changed (not default)
- [ ] Database backups configured
- [ ] HTTPS/SSL enabled
- [ ] Rate limiting enabled
- [ ] Security headers (Helmet) enabled
- [ ] CORS restricted to your domain
- [ ] Logging configured and monitored
- [ ] MongoDB authentication enabled
- [ ] Firewall rules configured
- [ ] Regular security updates scheduled
- [ ] Error monitoring set up (Sentry, etc.)

### Database Security

**MongoDB Atlas:**

- Enable IP whitelist
- Use strong passwords
- Enable two-factor authentication
- Regular backups enabled
- Encryption at rest enabled

**Local MongoDB:**

- Enable authentication
- Use firewall
- Regular backups
- Monitor connections

### API Key Security

**Razorpay:**

- Use Test Keys in development
- Use Live Keys in production
- Rotate keys periodically
- Monitor API usage

**Cloudinary:**

- Protect API secret
- Use unsigned URLs for public content
- Monitor upload quota

---

## Common Vulnerabilities

### 1. SQL/NoSQL Injection

**Vulnerability:**

```javascript
// ❌ NOT SAFE
const user = await User.findOne({
  username: req.body.username,
});
```

**Protection:**

```javascript
// ✅ SAFE - Uses Mongoose protection
const user = await User.findOne({
  username: String(req.body.username).trim(),
});
// ✅ Uses validation schemas
const { value } = userSchema.validate(req.body);
```

### 2. Cross-Site Scripting (XSS)

**Vulnerability:**

```javascript
// ❌ NOT SAFE - stores unsanitized user input
const expense = await Expense.create({
  title: req.body.title, // Could contain <script> tags
});
```

**Protection:**

```javascript
// ✅ SAFE - Input is validated and sanitized
const { value } = expenseSchema.validate(req.body);
const expense = await Expense.create(value);
```

### 3. Cross-Site Request Forgery (CSRF)

**Protection:**

- JWT tokens (stateless, tied to request)
- CORS restrictions
- SameSite cookie attribute (if using cookies)

### 4. Sensitive Data Exposure

**Protection:**

- HTTPS only in production
- Passwords hashed with bcryptjs
- JWT tokens used instead of session IDs
- Sensitive fields excluded from responses
- Log files secured with proper permissions

### 5. Broken Authentication

**Protection:**

- JWT signature validation
- Rate limiting on auth endpoints
- Password requirements
- Token expiration
- No hardcoded credentials

### 6. Insecure Direct Object References (IDOR)

**Vulnerability:**

```javascript
// ❌ NOT SAFE - no authorization check
const expense = await Expense.findById(req.params.expenseId);
```

**Protection:**

```javascript
// ✅ SAFE - verify user belongs to group
const expense = await Expense.findById(req.params.expenseId);
const group = await Group.findById(expense.groupId);
if (!group.members.includes(req.user.userId)) {
  throw new Error("Not authorized");
}
```

---

## Security Checklist

### Development

- [ ] Use `.env` for secrets
- [ ] Run `npm audit` regularly
- [ ] Review code for vulnerabilities
- [ ] Test authentication flows
- [ ] Test rate limiting
- [ ] Verify input validation

### Pre-Deployment

- [ ] All tests passing
- [ ] No console.log statements
- [ ] All dependencies updated
- [ ] Security headers enabled
- [ ] CORS properly configured
- [ ] Error messages don't leak info
- [ ] Rate limiting configured
- [ ] Logging configured

### Post-Deployment

- [ ] Monitor logs for errors
- [ ] Check rate limiting stats
- [ ] Verify HTTPS working
- [ ] Test all endpoints
- [ ] Monitor disk space (logs)
- [ ] Set up alerts for errors
- [ ] Regular backups confirmed
- [ ] Security headers verified

---

## Security Best Practices Summary

✅ **DO:**

- Use HTTPS in production
- Validate all inputs
- Hash passwords with bcryptjs
- Use JWT for authentication
- Limit request rates
- Log errors securely
- Rotate secrets regularly
- Keep dependencies updated
- Monitor for suspicious activity
- Plan disaster recovery

❌ **DON'T:**

- Commit `.env` files
- Hardcode secrets
- Log passwords or tokens
- Trust client validation alone
- Ignore security updates
- Use weak JWT secrets
- Store plain text passwords
- Expose error details to users
- Disable HTTPS
- Ignore suspicious requests

---

## Additional Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [Express.js Security](https://expressjs.com/en/advanced/best-practice-security.html)
- [MongoDB Security](https://docs.mongodb.com/manual/security/)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8949)

---

## Support

For security concerns or vulnerabilities, please report privately to the security team.

**Last Updated:** March 2024
**Status:** ✅ Actively Maintained
