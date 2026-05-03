# Setup & Installation Guide

## Prerequisites

- **Node.js** v18.0.0 or higher
  ```bash
  node --version  # Should be v18+
  ```
- **npm** v9.0.0 or higher
  ```bash
  npm --version  # Should be v9+
  ```
- **MongoDB** v5.0 or higher (local or cloud)
  ```bash
  mongod --version  # If running locally
  ```
- **Git** for version control

---

## Step 1: Clone the Repository

```bash
git clone https://github.com/your-username/expense-splitter-backend.git
cd expense-splitter-backend
```

---

## Step 2: Install Dependencies

```bash
npm install
```

This will install all required packages listed in `package.json`:

```
✓ express - Web framework
✓ mongoose - MongoDB connection
✓ jsonwebtoken - JWT auth
✓ bcryptjs - Password hashing
✓ helmet - Security headers
✓ joi - Input validation
✓ express-rate-limit - Rate limiting
✓ socket.io - Real-time events
✓ multer - File uploads
✓ cloudinary - Image hosting
✓ morgan - HTTP logging
✓ winston - Error logging
✓ razorpay - Payment processing
✓ cors - Cross-origin requests
✓ dotenv - Environment variables
```

### Verify Installation

```bash
npm list  # Shows all installed packages
```

---

## Step 3: Environment Configuration

### Create `.env` File

```bash
# Copy the example (if it exists)
cp .env.example .env

# Or create new file
touch .env
```

### Configure Environment Variables

Edit `.env` with the following required values:

```env
# ==================
# SERVER CONFIG
# ==================
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# ==================
# DATABASE
# ==================
MONGODB_URI=mongodb://localhost:27017/expense-splitter

# For MongoDB Atlas (cloud):
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/expense-splitter

# ==================
# AUTHENTICATION
# ==================
JWT_SECRET=your-super-secret-jwt-key-min-32-chars-random
JWT_EXPIRES_IN=7d

# ==================
# PAYMENT GATEWAY
# ==================
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxx
RAZORPAY_KEY_SECRET=your-razorpay-secret-key

# ==================
# IMAGE HOSTING
# ==================
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# ==================
# LOGGING (Optional)
# ==================
LOG_LEVEL=info
LOG_DIR=./logs
```

### Generate JWT Secret

```bash
# Generate a secure JWT secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output to `JWT_SECRET` in `.env`

---

## Step 4: Setup MongoDB

### Option A: Local MongoDB

```bash
# Install MongoDB (if not already installed)
# macOS:
brew install mongodb-community

# Ubuntu:
sudo apt-get install -y mongodb

# Windows: Download from https://www.mongodb.com/try/download/community

# Start MongoDB service
mongod

# Verify connection
mongo
> show databases
```

### Option B: MongoDB Atlas (Cloud)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create account and create a cluster
3. Get connection string: `mongodb+srv://user:pass@cluster.mongodb.net/dbname`
4. Add to `.env`:
   ```env
   MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/expense-splitter
   ```

### Create Database & Collections

```bash
# The first time you run the app, MongoDB will automatically:
# - Create the database (expense-splitter)
# - Create collections (users, groups, expenses, etc.)
# - Create indexes from Mongoose schemas
```

---

## Step 5: Setup Razorpay (Payment Gateway)

1. Create account at [Razorpay Dashboard](https://dashboard.razorpay.com)
2. Navigate to Settings → API Keys
3. Copy **Key ID** and **Key Secret**
4. Add to `.env`:
   ```env
   RAZORPAY_KEY_ID=rzp_test_xxxxxx
   RAZORPAY_KEY_SECRET=your_secret_key
   ```

---

## Step 6: Setup Cloudinary (Image Hosting)

1. Create account at [Cloudinary](https://cloudinary.com)
2. Go to Dashboard → Settings → API Keys
3. Copy credentials:
   - Cloud Name
   - API Key
   - API Secret
4. Add to `.env`:
   ```env
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

---

## Step 7: Validate Setup

### Check Environment Variables

```bash
# Verify all required env vars are set
node -e "
const required = ['JWT_SECRET', 'MONGODB_URI', 'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'];
const missing = required.filter(v => !process.env[v]);
if (missing.length) {
  console.error('❌ Missing:', missing.join(', '));
} else {
  console.log('✓ All required env vars configured');
}
"
```

### Test Database Connection

```bash
node -e "
require('dotenv').config();
const mongoose = require('mongoose');
mongoose.connect(process.env.MONGODB_URI).then(() => {
  console.log('✓ Database connected');
  process.exit(0);
}).catch(err => {
  console.error('❌ Database error:', err.message);
  process.exit(1);
});
"
```

---

## Step 8: Start Development Server

```bash
# Start with automatic reload on file changes
npm run dev

# Or start production server
npm start
```

### Expected Output

```
✓ All required environment variables are set
✓ Server running on port 5000
✓ Environment: development
```

### Health Check

```bash
# In another terminal, test the server
curl http://localhost:5000/api/health

# Expected response:
# {"status":"ok","message":"Expense Splitter backend is running"}
```

---

## Step 9: Test API Endpoints

### Register User

```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepass123",
    "name": "John Doe",
    "username": "johndoe"
  }'

# Expected Response:
# {
#   "success": true,
#   "data": {
#     "token": "eyJhbGc...",
#     "user": {
#       "userId": "USR-xxxx",
#       "username": "johndoe",
#       "email": "user@example.com",
#       "name": "John Doe"
#     }
#   },
#   "message": "User registered successfully"
# }
```

### Login User

```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepass123"
  }'
```

### Get Current User (Protected)

```bash
# Replace TOKEN with the JWT token from login response
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Step 10: Development Best Practices

### Using Postman for API Testing

1. Download [Postman](https://www.postman.com/downloads/)
2. Import collection (if available) or create requests
3. Set up environment variables in Postman:
   - `base_url`: http://localhost:5000
   - `token`: Your JWT token from login
4. Use `{{base_url}}/api/auth/me` in requests
5. Add `Authorization: Bearer {{token}}` header

### VS Code Extensions (Recommended)

```json
{
  "extensions": [
    "ms-vscode.rest-client", // REST API testing
    "mongodb.mongodb-vscode", // MongoDB browser
    "esbenp.prettier-vscode", // Code formatting
    "dbaeumer.vscode-eslint", // Linting
    "user-agents.walrus-comment" // Better comments
  ]
}
```

### Enable File Watcher

If hot reload doesn't work, increase file watcher limit:

```bash
# macOS/Linux
echo fs.inotify.max_user_watches=524288 | sudo tee -a /etc/sysctl.conf

# Windows (increase in system settings)
```

---

## Troubleshooting

### Issue: `Module not found` errors

**Solution:**

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

### Issue: `MONGODB_URI` not read

**Solution:**

```bash
# Verify .env file is in root directory
ls -la .env

# Ensure .env is NOT in .gitignore (only for dev)
cat .gitignore
```

### Issue: `Port 5000 already in use`

**Solution:**

```bash
# Find process using port 5000
lsof -i :5000

# Kill the process
kill -9 <PID>

# Or use a different port
PORT=5001 npm run dev
```

### Issue: `JWT verification failed`

**Solution:**

```bash
# Generate new JWT token via login
# Then use the new token in requests
curl -X GET http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <NEW_TOKEN>"
```

### Issue: Rate limiting blocks requests

**Solution:**

```bash
# In development mode, rate limiting is disabled
NODE_ENV=development npm run dev

# Or modify middleware/rateLimiter.js to increase limits
```

---

## Next Steps

1. ✅ Server is running
2. ✅ Database is connected
3. ✅ API is responding
4. **Next**: Read [API_ENDPOINTS.md](./API_ENDPOINTS.md) for endpoint documentation
5. **Next**: Read [SECURITY.md](./SECURITY.md) for security information
6. **Next**: Create your frontend application

---

## Directory Structure

```
expense-splitter-backend/
├── config/              # Configuration files
│   ├── db.js           # Database connection
│   └── validateEnv.js  # Env validation
├── controllers/         # Request handlers (9)
│   ├── authController.js
│   ├── userController.js
│   ├── groupController.js
│   ├── expenseController.js
│   ├── balanceController.js
│   ├── paymentController.js
│   ├── notificationController.js
│   ├── activityController.js
│   └── healthController.js
├── middleware/          # Express middleware (5)
│   ├── authMiddleware.js
│   ├── errorHandler.js
│   ├── rateLimiter.js
│   ├── validation.js
│   └── upload.js
├── models/              # Mongoose schemas (5)
│   ├── User.js
│   ├── Group.js
│   ├── Expense.js
│   ├── Settlement.js
│   ├── Notification.js
│   └── ActivityLog.js
├── routes/              # API routes (9)
├── services/            # Business logic (7)
│   ├── authService.js (if needed)
│   ├── balanceService.js
│   ├── expenseService.js
│   ├── paymentService.js
│   ├── notificationService.js
│   ├── activityService.js
│   └── socket.js
├── utils/               # Utilities
│   ├── logger.js       # Winston logger
│   ├── validators.js   # Validation helpers
│   ├── formatters.js   # Response formatters
│   ├── cloudinary.js   # Image uploads
│   ├── razorpay.js     # Payment handling
│   └── publicId.js     # ID generators
├── logs/                # Log files
│   ├── error.log
│   └── combined.log
├── .env                 # Environment variables (create this)
├── .gitignore          # Git ignore file
├── package.json        # Dependencies
├── server.js           # Server entry point
├── app.js              # Express app setup
└── README.md           # This file
```

---

## Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [MongoDB Documentation](https://docs.mongodb.com/)
- [JWT Introduction](https://jwt.io/introduction)
- [Socket.io Documentation](https://socket.io/docs/)
- [Razorpay API Reference](https://razorpay.com/docs/api/)
- [Cloudinary Documentation](https://cloudinary.com/documentation)

---

**Setup Complete! Your backend is ready for development.** 🚀
