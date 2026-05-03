# Expense Splitter Backend - Complete API Endpoints

## Base URL

```
http://localhost:5000/api
```

## Authentication

All endpoints (except /auth/register, /auth/login) require:

```
Authorization: Bearer <jwt_token>
```

---

## 🔐 Authentication Endpoints

### Register User

```
POST /auth/register
Content-Type: application/json

Request Body:
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "password123",
  "username": "johndoe"
}

Response (201):
{
  "message": "User registered successfully",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "userId": "USR_ABC123XYZ",
    "username": "johndoe",
    "name": "John Doe",
    "email": "john@example.com",
    "friends": [],
    "createdAt": "2024-01-15T10:30:00Z",
    "updatedAt": "2024-01-15T10:30:00Z"
  }
}
```

### Login User

```
POST /auth/login
Content-Type: application/json

Request Body:
{
  "email": "john@example.com",
  "password": "password123"
}

Response (200):
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": { ...user_object }
}
```

### Get Current User

```
GET /auth/me
Authorization: Bearer <token>

Response (200):
{
  "user": { ...user_object }
}
```

---

## 👤 User Endpoints

### Search Users

```
GET /users/search?q=john
Authorization: Bearer <token>

Query Params:
- q (required): Search query (name or username)

Response (200):
[
  {
    "userId": "USR_ABC123XYZ",
    "username": "johndoe",
    "name": "John Doe",
    "email": "john@example.com",
    "friends": [],
    "createdAt": "...",
    "updatedAt": "..."
  }
]
```

### Get User Profile

```
GET /users/:username
Authorization: Bearer <token>

Response (200):
{
  "userId": "USR_ABC123XYZ",
  "username": "johndoe",
  "name": "John Doe",
  "email": "john@example.com",
  "friends": ["USR_DEF456UVW"],
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Update Profile

```
PUT /users/profile
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "name": "John Updated",
  "username": "newusername"  // Optional
}

Response (200):
{
  "message": "Profile updated successfully",
  "user": { ...updated_user }
}
```

### Add Friend

```
POST /users/add-friend
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "username": "janedoe"
}

Response (200):
{
  "message": "Friend added successfully",
  "user": { ...user_with_updated_friends }
}
```

### Remove Friend

```
DELETE /users/remove-friend/:username
Authorization: Bearer <token>

Response (200):
{
  "message": "Friend removed successfully",
  "user": { ...user_with_updated_friends }
}
```

---

## 👥 Group Endpoints

### Create Group

```
POST /groups
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "name": "Weekend Trip",
  "members": ["USR_DEF456UVW", "USR_GHI789RST"]  // Optional
}

Response (201):
{
  "groupId": "GRP_weekendtrip_ABC123",
  "name": "Weekend Trip",
  "members": ["USR_ABC123XYZ", "USR_DEF456UVW", "USR_GHI789RST"],
  "createdBy": "USR_ABC123XYZ",
  "joinRequests": [],
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Get User Groups

```
GET /groups
Authorization: Bearer <token>

Response (200):
[
  { ...group_object },
  { ...group_object }
]
```

### Get Single Group

```
GET /groups/:groupId
Authorization: Bearer <token>

Response (200):
{
  "groupId": "GRP_weekendtrip_ABC123",
  ...group_object
}
```

### Add Member to Group

```
PATCH /groups/:groupId/members
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "userId": "USR_JKL012DEF"
}

Response (200):
{
  ...updated_group_object
}
```

### Remove Member from Group

```
DELETE /groups/:groupId/members/:userId
Authorization: Bearer <token>

Response (200):
{
  "message": "Member removed successfully",
  "group": { ...updated_group }
}
```

### Leave Group

```
DELETE /groups/:groupId/leave
Authorization: Bearer <token>

Response (200):
{
  "message": "Left group successfully",
  "groupId": "GRP_weekendtrip_ABC123"
}
```

### Delete Group

```
DELETE /groups/:groupId
Authorization: Bearer <token>

Response (200):
{
  "message": "Group deleted successfully"
}
```

### Request to Join Group

```
POST /groups/:groupId/request
Authorization: Bearer <token>

Response (200):
{
  "message": "Join request submitted",
  "groupId": "GRP_weekendtrip_ABC123",
  "userId": "USR_JKL012DEF"
}
```

### Cancel Join Request

```
DELETE /groups/:groupId/request
Authorization: Bearer <token>

Response (200):
{
  "message": "Join request cancelled"
}
```

### Approve Join Request

```
POST /groups/:groupId/approve
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "userId": "USR_JKL012DEF"
}

Response (200):
{
  "message": "Join request approved",
  "group": { ...updated_group }
}
```

### Reject Join Request

```
POST /groups/:groupId/reject
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "userId": "USR_JKL012DEF"
}

Response (200):
{
  "message": "Join request rejected",
  "group": { ...updated_group }
}
```

---

## 💰 Expense Endpoints

### Create Expense

```
POST /expenses
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data:
- title: "Dinner" (required)
- amount: 1200 (required, number)
- paidBy: "USR_ABC123XYZ" (required)
- groupId: "GRP_weekendtrip_ABC123" (required)
- category: "Food" (optional)
- splitType: "equal" | "exact" | "percentage" (required)
- participants: JSON array (required):
  [
    { "userId": "USR_ABC123XYZ", "share": 400 },
    { "userId": "USR_DEF456UVW", "share": 800 }
  ]
- billImage: <file> (optional)

Response (201):
{
  "expenseId": "EXP_ABC123XYZ",
  "title": "Dinner",
  "amount": 1200,
  "paidBy": "USR_ABC123XYZ",
  "participants": [
    { "userId": "USR_ABC123XYZ", "share": 400, "paid": false },
    { "userId": "USR_DEF456UVW", "share": 800, "paid": false }
  ],
  "groupId": "GRP_weekendtrip_ABC123",
  "category": "Food",
  "billImageUrl": "https://cloudinary.com/...",
  "splitType": "equal",
  "createdAt": "...",
  "updatedAt": "..."
}
```

### Get Expenses by Group

```
GET /expenses/group/:groupId?category=Food&fromDate=2024-01-01&toDate=2024-12-31&limit=50&skip=0
Authorization: Bearer <token>

Query Params:
- category: Filter by category (optional)
- fromDate: ISO date string (optional)
- toDate: ISO date string (optional)
- limit: Results per page (default: 100)
- skip: Pagination offset (default: 0)

Response (200):
{
  "expenses": [ ...expense_objects ],
  "pagination": {
    "total": 50,
    "limit": 50,
    "skip": 0
  }
}
```

### Get Single Expense

```
GET /expenses/:expenseId
Authorization: Bearer <token>

Response (200):
{
  ...expense_object
}
```

### Update Expense

```
PUT /expenses/:expenseId
Authorization: Bearer <token>
Content-Type: multipart/form-data

Form Data: (same as create, all optional)

Response (200):
{
  ...updated_expense_object
}
```

### Delete Expense

```
DELETE /expenses/:expenseId
Authorization: Bearer <token>

Response (200):
{
  "message": "Expense deleted successfully"
}
```

---

## 💳 Payment Endpoints

### Create Settlement Order (Razorpay)

```
POST /payments/order
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "groupId": "GRP_weekendtrip_ABC123",
  "fromUser": "USR_DEF456UVW",
  "toUser": "USR_ABC123XYZ",
  "amount": 600,
  "currency": "INR"
}

Response (201):
{
  "settlementId": "SET_ABC123XYZ",
  "orderId": "order_1234567890abcdef",
  "amount": 60000,  // In paise (60000 paise = ₹600)
  "currency": "INR",
  "key": "rzp_live_1234567890abcdef"
}
```

### Verify Payment

```
POST /payments/verify
Authorization: Bearer <token>
Content-Type: application/json

Request Body:
{
  "razorpay_order_id": "order_1234567890abcdef",
  "razorpay_payment_id": "pay_1234567890abcdef",
  "razorpay_signature": "abcdef1234567890"
}

Response (200):
{
  "message": "Payment verified successfully",
  "settlementId": "SET_ABC123XYZ",
  "groupId": "GRP_weekendtrip_ABC123",
  "status": "paid"
}
```

---

## 📊 Balance Endpoints

### Get Group Balances

```
GET /balances/:groupId
Authorization: Bearer <token>

Response (200):
{
  "groupId": "GRP_weekendtrip_ABC123",
  "balances": [
    { "userId": "USR_ABC123XYZ", "net": 600 },
    { "userId": "USR_DEF456UVW", "net": -600 }
  ],
  "transactions": [
    {
      "fromUser": "USR_DEF456UVW",
      "toUser": "USR_ABC123XYZ",
      "amount": 600
    }
  ],
  "owes": {
    "USR_DEF456UVW": [
      { "toUser": "USR_ABC123XYZ", "amount": 600 }
    ]
  }
}
```

### Get User Balance Summary

```
GET /balances/user/summary
Authorization: Bearer <token>

Response (200):
{
  "userId": "USR_ABC123XYZ",
  "totalOwed": 1500.50,
  "totalToReceive": 2300.75,
  "netBalance": 800.25
}
```

---

## 🔔 Notification Endpoints

### Get User Notifications

```
GET /notifications?limit=50&skip=0
Authorization: Bearer <token>

Query Params:
- limit: Results per page (default: 50)
- skip: Pagination offset (default: 0)

Response (200):
{
  "notifications": [
    {
      "notificationId": "NOT_ABC123XYZ",
      "userId": "USR_ABC123XYZ",
      "type": "expense_added",
      "title": "New Expense",
      "message": "John added a new expense",
      "relatedData": {
        "groupId": "GRP_weekendtrip_ABC123",
        "expenseId": "EXP_DEF456UVW"
      },
      "read": false,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "unreadCount": 5,
  "pagination": {
    "limit": 50,
    "skip": 0
  }
}
```

### Mark Notification as Read

```
PUT /notifications/:notificationId/read
Authorization: Bearer <token>

Response (200):
{
  "message": "Notification marked as read",
  "notification": { ...notification_object }
}
```

### Mark All Notifications as Read

```
PUT /notifications/mark-all-read
Authorization: Bearer <token>

Response (200):
{
  "message": "All notifications marked as read"
}
```

### Delete Notification

```
DELETE /notifications/:notificationId
Authorization: Bearer <token>

Response (200):
{
  "message": "Notification deleted successfully"
}
```

---

## 📋 Activity Log Endpoints

### Get Group Activity Log

```
GET /activities/:groupId?limit=50&skip=0
Authorization: Bearer <token>

Query Params:
- limit: Results per page (default: 50)
- skip: Pagination offset (default: 0)

Response (200):
{
  "activities": [
    {
      "activityId": "ACT_ABC123XYZ",
      "groupId": "GRP_weekendtrip_ABC123",
      "userId": "USR_ABC123XYZ",
      "type": "expense_added",
      "description": "John Doe added expense: Dinner",
      "relatedData": {
        "expenseId": "EXP_DEF456UVW",
        "amount": 1200
      },
      "createdAt": "...",
      "updatedAt": "..."
    }
  ],
  "groupId": "GRP_weekendtrip_ABC123",
  "pagination": {
    "limit": 50,
    "skip": 0
  }
}
```

---

## ❤️ Health Check

### Health Status

```
GET /health

Response (200):
{
  "status": "ok",
  "message": "Expense Splitter backend is running"
}
```

---

## 📝 Notes

### Split Types

- **equal**: Amount divided equally among all participants
- **exact**: Each participant pays exact specified share (sum must equal total)
- **percentage**: Each participant pays percentage of total (sum must equal 100)

### Error Responses

```
400 Bad Request: Invalid input or validation error
401 Unauthorized: Missing or invalid token
403 Forbidden: Not authorized for this action
404 Not Found: Resource not found
409 Conflict: Resource already exists or duplicate request
```

### Rate Limiting

Not currently implemented. Recommended for production.

---

**API Version:** 1.0.0  
**Last Updated:** March 27, 2026
