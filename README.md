# Expense Splitter - Full Stack Application

**Production-Ready | Enterprise-Grade | Fully Secured | Real-time Updates**

A comprehensive full-stack web application for splitting and managing expenses within groups. Built with modern technologies, robust security practices, and real-time functionality.

---

## 📋 Project Overview

Expense Splitter is a complete solution for managing shared expenses among friends and groups. It provides an intuitive interface for creating groups, adding expenses with multiple split types, tracking balances, and settling payments.

### Key Highlights

✅ **Full-Stack Architecture** - Node.js/Express backend + React/Vite frontend  
✅ **Real-time Features** - Socket.io integration for live updates  
✅ **Payment Integration** - Razorpay for secure payment processing  
✅ **Enterprise Security** - JWT auth, rate limiting, input validation, Helmet.js  
✅ **Modern UI/UX** - React with Redux state management, Tailwind CSS styling  
✅ **Production Ready** - Error handling, logging, monitoring, deployment guides

---

## 🏗️ Architecture Overview

```
Expense Splitter
├── expense-splitter-backend/
│   ├── controllers/       # 9 request handlers
│   ├── models/            # 5 MongoDB schemas
│   ├── routes/            # API endpoints
│   ├── middleware/        # Auth, validation, rate limiting
│   ├── services/          # Business logic
│   ├── utils/             # Helpers (payment, storage, validation)
│   └── config/            # Configuration
│
└── expense-splitter-frontend/
    ├── src/
    │   ├── pages/         # Auth, Dashboard, Group, Profile, Settings
    │   ├── features/      # Redux slices (auth, user, group, etc.)
    │   ├── components/    # Reusable UI components
    │   ├── api/           # Axios configuration
    │   ├── utils/         # Helpers
    │   ├── routes/        # Route protection
    │   └── context/       # Theme context
    └── config files       # Vite, Tailwind, ESLint
```

---

## 🚀 Quick Start

### Prerequisites

- **Node.js** v18+
- **MongoDB** v5+ (local or MongoDB Atlas)
- **npm** or **yarn**

### Backend Setup

```bash
cd expense-splitter-backend

# Install dependencies
npm install

# Create and configure .env file
cp .env.example .env
# Edit .env with your credentials

# Start development server
npm run dev

# Or start production server
npm start
```

**Backend runs on:** `http://localhost:5000`

### Frontend Setup

```bash
cd expense-splitter-frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm build
```

**Frontend runs on:** `http://localhost:5173`

### Required Environment Variables (Backend)

```env
# Server Configuration
NODE_ENV=production
PORT=5000

# Database
MONGODB_URI=mongodb://localhost:27017/expense-splitter

# JWT Authentication
JWT_SECRET=your-super-secret-jwt-key

# Payment Gateway (Razorpay)
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret

# Frontend URL (CORS)
CLIENT_URL=http://localhost:3000

# File Storage (Cloudinary)
CLOUDINARY_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-cloudinary-key
CLOUDINARY_API_SECRET=your-cloudinary-secret
```

---

## 🎯 Core Features

### 1. Authentication & User Management

- **User Registration & Login** - Secure JWT-based authentication
- **Profile Management** - Update user information and profile pictures
- **Friend Management** - Add/remove friends for quick group creation
- **User Search** - Find users by username

### 2. Group Management

- **Create Groups** - Easy group creation with initial members
- **Add Members** - Invite users to existing groups
- **Role Management** - Admin and member roles with permissions
- **Join Requests** - Users can request to join groups
- **Leave Groups** - Remove yourself from groups

### 3. Expense Tracking

- **Add Expenses** - Record shared expenses with date, description, amount
- **Three Split Types**:
  - **Equal Split** - Divide equally among all participants
  - **Exact Amount** - Specify exact amount for each participant
  - **Percentage Split** - Divide based on percentage allocation
- **Edit & Delete** - Modify or remove expenses
- **Expense History** - View all group expenses with details

### 4. Balance & Settlement

- **Real-time Balances** - Calculate who owes whom in each group
- **Settlement Tracking** - Track payment settlements and status
- **Payment Integration** - Integrate with Razorpay for online payments
- **Settlement History** - Complete audit trail of all settlements

### 5. Notifications & Activity

- **Real-time Notifications** - Instant updates via WebSocket
- **Activity Logging** - Complete audit trail of group activities
- **Notification Preferences** - Control notification settings
- **Read Status** - Mark notifications as read

### 6. Dashboard & Analytics

- **Dashboard Overview** - Quick summary of groups and balances
- **Group Details** - Comprehensive view of group members and expenses
- **Balance Summary** - Visual representation of who owes whom

---

## 🛡️ Security Features

### Authentication & Authorization

- **JWT-based Authentication** - Secure token-based auth with 7-day expiry
- **Password Hashing** - Bcryptjs with 12 salt rounds
- **Role-Based Access Control** - Admin and member roles
- **Protected Routes** - Frontend and backend route protection

### Rate Limiting

- **Auth Endpoints** - 5 requests per 15 minutes
- **Payment Endpoints** - 10 requests per 15 minutes
- **General Endpoints** - 100 requests per 15 minutes
- **Development Mode** - Rate limiting disabled for easier testing

### Input Validation & Sanitization

- **Joi Schema Validation** - All request bodies validated
- **String Trimming** - Removes whitespace from inputs
- **Email Validation** - RFC 5322 compliance
- **Password Requirements** - Minimum 6 characters
- **Injection Prevention** - Protection against common attacks

### Security Headers

- **Helmet.js** - Secure HTTP headers
- **CORS Configuration** - Whitelist trusted domains
- **HTTPS Ready** - Full production-grade security

### Logging & Monitoring

- **Morgan HTTP Logging** - Request/response tracking
- **Winston Error Logging** - Persistent error logs
- **No Sensitive Data** - Passwords and tokens excluded from logs
- **Automatic Log Rotation** - 5MB per file, max 5 files

---

## 📡 API Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    "userId": "USR-xxxx",
    "username": "john_doe",
    "email": "john@example.com"
  },
  "message": "Operation completed successfully"
}
```

### Error Response

```json
{
  "success": false,
  "message": "Invalid email or password",
  "errorCode": "INVALID_CREDENTIALS"
}
```

### Validation Error Response

```json
{
  "success": false,
  "message": "Validation failed",
  "errorCode": "VALIDATION_ERROR",
  "errors": [
    {
      "field": "email",
      "message": "must be a valid email"
    }
  ]
}
```

---

## 💾 Database Models

### User

- User authentication, profiles, friend lists
- Fields: userId, username, email, password, profilePicture, friends

### Group

- Expense groups with member management
- Fields: groupId, name, description, members, admin, createdAt

### Expense

- Expense records with participants and split information
- Fields: expenseId, amount, description, groupId, paidBy, participants, splitType, createdAt

### Settlement

- Payment settlements with status tracking
- Fields: settlementId, from, to, amount, status, paymentMethod, groupId

### Notification

- User notifications with read status
- Fields: notificationId, userId, message, read, createdAt

### ActivityLog

- Audit trail of group activities
- Fields: activityId, groupId, userId, action, description, timestamp

---

## 📚 Main API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

### Users

- `GET /api/users/search?q=username` - Search users
- `GET /api/users/:username` - Get user profile
- `PATCH /api/users/profile` - Update profile
- `POST /api/users/friends` - Add friend
- `DELETE /api/users/friends/:username` - Remove friend

### Groups

- `POST /api/groups` - Create new group
- `GET /api/groups` - List user's groups
- `GET /api/groups/:id` - Get group details
- `PUT /api/groups/:id` - Update group
- `DELETE /api/groups/:id` - Delete group
- `POST /api/groups/:id/members` - Add member
- `DELETE /api/groups/:id/members/:username` - Remove member

### Expenses

- `POST /api/expenses` - Add expense to group
- `GET /api/expenses?groupId=id` - List expenses
- `PUT /api/expenses/:id` - Edit expense
- `DELETE /api/expenses/:id` - Delete expense

### Balances

- `GET /api/balances?groupId=id` - Get group balances
- `GET /api/balances/summary` - Get all balances summary

### Payments & Settlements

- `POST /api/payments/initiate` - Initiate payment
- `POST /api/payments/verify` - Verify payment
- `GET /api/settlements?groupId=id` - List settlements

### Notifications

- `GET /api/notifications` - Get user notifications
- `PUT /api/notifications/:id` - Mark as read
- `DELETE /api/notifications/:id` - Delete notification

### Activity

- `GET /api/activity?groupId=id` - Get activity log

---

## 🛠️ Technology Stack

### Backend

- **Runtime**: Node.js v18+
- **Framework**: Express.js
- **Database**: MongoDB + Mongoose ODM
- **Authentication**: JWT (jsonwebtoken)
- **Password Hashing**: bcryptjs
- **API Validation**: Joi
- **Payment Gateway**: Razorpay
- **File Storage**: Cloudinary
- **Real-time**: Socket.io
- **Logging**: Morgan, Winston
- **Security**: Helmet, Express Rate Limit, CORS
- **Dev Tools**: Nodemon

### Frontend

- **Library**: React 19
- **Build Tool**: Vite
- **State Management**: Redux Toolkit + Redux Persist
- **HTTP Client**: Axios
- **Styling**: Tailwind CSS + Autoprefixer
- **Routing**: React Router v7
- **Notifications**: React Hot Toast
- **Linting**: ESLint

---

## 📦 Project Structure Details

### Backend Controllers

1. **authController** - Registration, login, authentication logic
2. **userController** - User profiles, friends management, search
3. **groupController** - Group creation, member management
4. **expenseController** - Expense CRUD operations
5. **balanceController** - Balance calculations and summaries
6. **paymentController** - Payment processing and settlement
7. **notificationController** - Notification management
8. **activityController** - Activity logging and retrieval
9. **healthController** - Health check endpoint

### Frontend Pages

1. **Auth** - Login/Register pages with form validation
2. **Home** - Landing page for unauthenticated users
3. **Dashboard** - Main dashboard showing all groups and summary
4. **Group** - Group details page with expenses and members
5. **Profile** - User profile management page
6. **Settings** - App settings and preferences

### Frontend Features (Redux Slices)

1. **auth** - Authentication state and user session
2. **user** - User profile and friends data
3. **group** - Group information and management
4. **expense** - Expense data and operations
5. **balance** - Balance calculations and display
6. **notification** - Notification state and management

---

## 🚢 Deployment

### Backend Deployment

- Compatible with Heroku, Railway, AWS, Azure
- Environment variables should be set on deployment platform
- MongoDB connection string pointing to cloud database
- Requires Node.js v18+ runtime

### Frontend Deployment

- Can be deployed to Vercel, Netlify, GitHub Pages, or any static host
- Build command: `npm run build`
- Build output in `dist/` directory
- API_URL must point to deployed backend

---

## 📝 Development Scripts

### Backend

```bash
npm run dev      # Development server with auto-reload
npm start        # Production server
```

### Frontend

```bash
npm run dev      # Development server with HMR
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

---

## 🔍 Monitoring & Logs

- **Application Logs**: `logs/` directory in backend
- **Error Tracking**: Winston logger with file persistence
- **Request Logging**: Morgan HTTP logger
- **Log Rotation**: Automatic rotation at 5MB per file (5 file max)

---

## 📖 Additional Documentation

For detailed information, refer to:

- **Backend Docs**: `expense-splitter-backend/docs/`
- **API Endpoints**: `expense-splitter-backend/docs/ALL_ENDPOINTS.md`
- **Security Guide**: `expense-splitter-backend/docs/SECURITY.md`
- **Deployment Guide**: `expense-splitter-backend/docs/DEPLOYMENT.md`
- **Production Checklist**: `expense-splitter-backend/docs/PRODUCTION_CHECKLIST.md`

---

## 🤝 Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Open a Pull Request

---

## 📄 License

This project is private and proprietary.

---

## 📞 Support

For issues, questions, or suggestions, please reach out to the development team.

---

**Last Updated**: April 2026  
**Status**: Production Ready ✅
