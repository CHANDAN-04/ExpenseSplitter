# Complete API Endpoints Documentation

## Base URL

```
http://localhost:5000/api
```

---

## Table of Contents

1. [Authentication](#authentication)
2. [Users](#users)
3. [Groups](#groups)
4. [Expenses](#expenses)
5. [Balances](#balances)
6. [Payments](#payments)
7. [Activity](#activity)
8. [Notifications](#notifications)

---

## Authentication

### 1. Register User

**Endpoint:** `POST /auth/register`  
**Authentication:** No  
**Description:** Create a new user account

**Request Body:**

```json
{
  "name": "string (required, max 100 chars)",
  "email": "string (required, valid email format)",
  "password": "string (required, min 6 chars, max 128 chars)",
  "username": "string (required, alphanumeric, 3-30 chars)"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "userId": "string",
    "username": "string",
    "email": "string",
    "name": "string"
  },
  "message": "User registered successfully"
}
```

---

### 2. Login User

**Endpoint:** `POST /auth/login`  
**Authentication:** No  
**Description:** Authenticate user and receive tokens

**Request Body:**

```json
{
  "email": "string (required, valid email format)",
  "password": "string (required)"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "userId": "string",
      "username": "string",
      "email": "string",
      "name": "string"
    },
    "accessToken": "string (JWT)",
    "refreshToken": "string (JWT)"
  },
  "message": "Login successful"
}
```

---

### 3. Refresh Token

**Endpoint:** `POST /auth/refresh`  
**Authentication:** No  
**Description:** Get a new access token using refresh token

**Request Body:**

```json
{
  "refreshToken": "string (required)"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "accessToken": "string (JWT)"
  },
  "message": "Token refreshed successfully"
}
```

---

### 4. Logout User

**Endpoint:** `POST /auth/logout`  
**Authentication:** Bearer Token (Required)  
**Description:** Logout user and invalidate tokens

**Request Body:** `{}`

**Response (200):**

```json
{
  "success": true,
  "message": "Logout successful"
}
```

---

### 5. Get Current User Profile

**Endpoint:** `GET /auth/me`  
**Authentication:** Bearer Token (Required)  
**Description:** Get logged-in user's profile

**Query Parameters:** None

**Response (200):**

```json
{
  "success": true,
  "data": {
    "user": {
      "userId": "string",
      "username": "string",
      "email": "string",
      "name": "string"
    }
  },
  "message": "User profile retrieved"
}
```

---

## Users

### 1. Search Users

**Endpoint:** `GET /users/search`  
**Authentication:** Bearer Token (Required)  
**Description:** Search users by name or username

**Query Parameters:**

```
q: string (search query, required, max 25 results)
```

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "userId": "string",
      "username": "string",
      "name": "string",
      "email": "string"
    }
  ],
  "message": "Users found"
}
```

---

### 2. Get User Profile

**Endpoint:** `GET /users/:username`  
**Authentication:** No  
**Description:** Get public profile of a user by username

**Path Parameters:**

```
username: string (required)
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "userId": "string",
    "username": "string",
    "name": "string",
    "email": "string"
  },
  "message": "User profile retrieved"
}
```

---

### 3. Update User Profile

**Endpoint:** `PUT /users/profile`  
**Authentication:** Bearer Token (Required)  
**Description:** Update current user's profile

**Request Body:**

```json
{
  "name": "string (optional, max 100 chars)",
  "username": "string (optional, alphanumeric, 3-30 chars)"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "userId": "string",
    "username": "string",
    "name": "string",
    "email": "string"
  },
  "message": "Profile updated successfully"
}
```

---

### 4. Send Friend Request

**Endpoint:** `POST /users/friend-request/send`  
**Authentication:** Bearer Token (Required)  
**Description:** Send friend request to another user

**Request Body:**

```json
{
  "username": "string (required)"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "requestId": "string",
    "senderId": "string",
    "recipientId": "string",
    "status": "pending",
    "createdAt": "2024-04-01T10:00:00Z"
  },
  "message": "Friend request sent successfully"
}
```

---

### 5. Accept Friend Request

**Endpoint:** `POST /users/friend-request/accept`  
**Authentication:** Bearer Token (Required)  
**Description:** Accept an incoming friend request

**Request Body:**

```json
{
  "requestId": "string (required)"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "requestId": "string",
    "status": "accepted"
  },
  "message": "Friend request accepted"
}
```

---

### 6. Reject Friend Request

**Endpoint:** `POST /users/friend-request/reject`  
**Authentication:** Bearer Token (Required)  
**Description:** Reject an incoming friend request

**Request Body:**

```json
{
  "requestId": "string (required)"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Friend request rejected"
}
```

---

### 7. Get Pending Friend Requests

**Endpoint:** `GET /users/friend-request/pending`  
**Authentication:** Bearer Token (Required)  
**Description:** Get all pending friend requests (received)

**Query Parameters:** None

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "requestId": "string",
      "senderId": "string",
      "senderUsername": "string",
      "status": "pending",
      "createdAt": "2024-04-01T10:00:00Z"
    }
  ],
  "message": "Pending requests retrieved"
}
```

---

### 8. Get Sent Friend Requests

**Endpoint:** `GET /users/friend-request/sent`  
**Authentication:** Bearer Token (Required)  
**Description:** Get all sent friend requests

**Query Parameters:** None

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "requestId": "string",
      "recipientId": "string",
      "recipientUsername": "string",
      "status": "pending",
      "createdAt": "2024-04-01T10:00:00Z"
    }
  ],
  "message": "Sent requests retrieved"
}
```

---

### 9. Get Received Friend Requests

**Endpoint:** `GET /users/friend-request/received`  
**Authentication:** Bearer Token (Required)  
**Description:** Get all received friend requests

**Query Parameters:** None

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "requestId": "string",
      "senderId": "string",
      "senderUsername": "string",
      "status": "pending",
      "createdAt": "2024-04-01T10:00:00Z"
    }
  ],
  "message": "Received requests retrieved"
}
```

---

### 10. Get Friends List

**Endpoint:** `GET /users/friends/list`  
**Authentication:** Bearer Token (Required)  
**Description:** Get all friends of current user

**Query Parameters:** None

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "userId": "string",
      "username": "string",
      "name": "string",
      "email": "string"
    }
  ],
  "message": "Friends list retrieved"
}
```

---

### 11. Remove Friend

**Endpoint:** `DELETE /users/remove-friend/:username`  
**Authentication:** Bearer Token (Required)  
**Description:** Remove a friend

**Path Parameters:**

```
username: string (required)
```

**Response (200):**

```json
{
  "success": true,
  "message": "Friend removed successfully"
}
```

---

## Groups

### 1. Create Group

**Endpoint:** `POST /groups/`  
**Authentication:** Bearer Token (Required)  
**Description:** Create a new group

**Request Body:**

```json
{
  "name": "string (required, max 100 chars)",
  "members": ["string (optional, array of userIds)"]
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "groupId": "string",
    "name": "string",
    "members": ["string"],
    "createdBy": "string",
    "createdAt": "2024-04-01T10:00:00Z"
  },
  "message": "Group created successfully"
}
```

---

### 2. Get User's Groups

**Endpoint:** `GET /groups/`  
**Authentication:** Bearer Token (Required)  
**Description:** Get all groups of current user

**Query Parameters:** None

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "groupId": "string",
      "name": "string",
      "members": ["string"],
      "createdBy": "string",
      "createdAt": "2024-04-01T10:00:00Z"
    }
  ],
  "message": "Groups retrieved successfully"
}
```

---

### 3. Get Single Group

**Endpoint:** `GET /groups/:groupId`  
**Authentication:** Bearer Token (Required)  
**Description:** Get details of a specific group

**Path Parameters:**

```
groupId: string (required)
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "groupId": "string",
    "name": "string",
    "members": ["string"],
    "createdBy": "string",
    "createdAt": "2024-04-01T10:00:00Z"
  },
  "message": "Group retrieved successfully"
}
```

---

### 4. Delete Group

**Endpoint:** `DELETE /groups/:groupId`  
**Authentication:** Bearer Token (Required)  
**Description:** Delete a group (admin only)

**Path Parameters:**

```
groupId: string (required)
```

**Response (200):**

```json
{
  "success": true,
  "message": "Group deleted successfully"
}
```

---

### 5. Leave Group

**Endpoint:** `DELETE /groups/:groupId/leave`  
**Authentication:** Bearer Token (Required)  
**Description:** Leave a group

**Path Parameters:**

```
groupId: string (required)
```

**Response (200):**

```json
{
  "success": true,
  "message": "Left group successfully"
}
```

---

### 6. Add Member to Group

**Endpoint:** `PATCH /groups/:id/members`  
**Authentication:** Bearer Token (Required)  
**Description:** Add a member to group (admin only)

**Path Parameters:**

```
id: string (groupId, required)
```

**Request Body:**

```json
{
  "userId": "string (required)"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "groupId": "string",
    "members": ["string"]
  },
  "message": "Member added successfully"
}
```

---

### 7. Remove Member from Group

**Endpoint:** `DELETE /groups/:groupId/members/:userId`  
**Authentication:** Bearer Token (Required)  
**Description:** Remove a member from group (admin only)

**Path Parameters:**

```
groupId: string (required)
userId: string (required)
```

**Response (200):**

```json
{
  "success": true,
  "message": "Member removed successfully"
}
```

---

### 8. Send Group Join Request

**Endpoint:** `POST /groups/join-request/send`  
**Authentication:** Bearer Token (Required)  
**Description:** Request to join a group

**Request Body:**

```json
{
  "groupId": "string (required)"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "requestId": "string",
    "groupId": "string",
    "userId": "string",
    "status": "pending",
    "createdAt": "2024-04-01T10:00:00Z"
  },
  "message": "Join request sent successfully"
}
```

---

### 9. Get Pending Group Join Requests

**Endpoint:** `GET /groups/join-request/pending/:groupId`  
**Authentication:** Bearer Token (Required)  
**Description:** Get pending join requests for a group (admin only)

**Path Parameters:**

```
groupId: string (required)
```

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "requestId": "string",
      "userId": "string",
      "username": "string",
      "status": "pending",
      "createdAt": "2024-04-01T10:00:00Z"
    }
  ],
  "message": "Pending join requests retrieved"
}
```

---

### 10. Get User's Group Join Requests

**Endpoint:** `GET /groups/join-request/user`  
**Authentication:** Bearer Token (Required)  
**Description:** Get all join requests sent by current user

**Query Parameters:** None

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "requestId": "string",
      "groupId": "string",
      "groupName": "string",
      "status": "pending",
      "createdAt": "2024-04-01T10:00:00Z"
    }
  ],
  "message": "User join requests retrieved"
}
```

---

### 11. Accept Group Join Request

**Endpoint:** `POST /groups/join-request/accept`  
**Authentication:** Bearer Token (Required)  
**Description:** Accept a user's join request (admin only)

**Request Body:**

```json
{
  "requestId": "string (required)"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Join request accepted"
}
```

---

### 12. Reject Group Join Request

**Endpoint:** `POST /groups/join-request/reject`  
**Authentication:** Bearer Token (Required)  
**Description:** Reject a user's join request (admin only)

**Request Body:**

```json
{
  "requestId": "string (required)"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Join request rejected"
}
```

---

### 13. Cancel Group Join Request

**Endpoint:** `POST /groups/join-request/cancel`  
**Authentication:** Bearer Token (Required)  
**Description:** Cancel your own join request

**Request Body:**

```json
{
  "requestId": "string (required)"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Join request cancelled"
}
```

---

## Expenses

### 1. Create Expense

**Endpoint:** `POST /expenses/`  
**Authentication:** Bearer Token (Required)  
**Description:** Create a new expense

**Request Body:**

```json
{
  "title": "string (required, max 200 chars)",
  "amount": "number (required, positive)",
  "groupId": "string (required)",
  "paidBy": "string (required, userId)",
  "participants": [
    {
      "userId": "string (required)",
      "share": "number (required, positive)"
    }
  ],
  "splitType": "string (optional, valid values: 'equal', 'exact', 'percentage', default: 'equal')",
  "category": "string (optional, max 50 chars)"
}
```

**File Upload:** Optional bill image (multipart/form-data)

**Response (201):**

```json
{
  "success": true,
  "data": {
    "expenseId": "string",
    "title": "string",
    "amount": "number",
    "groupId": "string",
    "paidBy": "string",
    "participants": [
      {
        "userId": "string",
        "share": "number"
      }
    ],
    "splitType": "string",
    "category": "string",
    "billImageUrl": "string (optional)",
    "createdAt": "2024-04-01T10:00:00Z"
  },
  "message": "Expense created successfully"
}
```

---

### 2. Get Expenses by Group

**Endpoint:** `GET /expenses/group/:groupId`  
**Authentication:** Bearer Token (Required)  
**Description:** Get all expenses in a group

**Path Parameters:**

```
groupId: string (required)
```

**Query Parameters:**

```
category: string (optional, filter by category)
fromDate: string (optional, ISO date format)
toDate: string (optional, ISO date format)
limit: number (optional, default: 100)
skip: number (optional, default: 0, for pagination)
```

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "expenseId": "string",
      "title": "string",
      "amount": "number",
      "groupId": "string",
      "paidBy": "string",
      "participants": [
        {
          "userId": "string",
          "share": "number"
        }
      ],
      "splitType": "string",
      "category": "string",
      "billImageUrl": "string",
      "createdAt": "2024-04-01T10:00:00Z"
    }
  ],
  "message": "Expenses retrieved successfully"
}
```

---

### 3. Get Single Expense

**Endpoint:** `GET /expenses/:expenseId`  
**Authentication:** Bearer Token (Required)  
**Description:** Get details of a specific expense

**Path Parameters:**

```
expenseId: string (required)
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "expenseId": "string",
    "title": "string",
    "amount": "number",
    "groupId": "string",
    "paidBy": "string",
    "participants": [
      {
        "userId": "string",
        "share": "number"
      }
    ],
    "splitType": "string",
    "category": "string",
    "billImageUrl": "string",
    "createdAt": "2024-04-01T10:00:00Z"
  },
  "message": "Expense retrieved successfully"
}
```

---

### 4. Calculate Expense Split

**Endpoint:** `POST /expenses/split/calculate`  
**Authentication:** Bearer Token (Required)  
**Description:** Calculate how an expense should be split

**Request Body:**

```json
{
  "amount": "number (required, positive)",
  "splitType": "string (required, valid values: 'equal', 'exact', 'percentage')",
  "participants": [
    {
      "userId": "string (required)",
      "share": "number (required)"
    }
  ]
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "participants": [
      {
        "userId": "string",
        "share": "number",
        "percentage": "number"
      }
    ],
    "totalAmount": "number"
  },
  "message": "Split calculated successfully"
}
```

---

### 5. Get Expense Distribution Report

**Endpoint:** `GET /expenses/report/distribution/:groupId`  
**Authentication:** Bearer Token (Required)  
**Description:** Get expense distribution report for a group

**Path Parameters:**

```
groupId: string (required)
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "groupId": "string",
    "totalExpenses": "number",
    "expenseCount": "number",
    "distribution": [
      {
        "userId": "string",
        "username": "string",
        "totalSpent": "number",
        "totalOwed": "number",
        "netBalance": "number"
      }
    ]
  },
  "message": "Distribution report retrieved"
}
```

---

### 6. Get Expense Settlement Plan

**Endpoint:** `GET /expenses/report/settlement/:groupId`  
**Authentication:** Bearer Token (Required)  
**Description:** Get settlement plan for a group

**Path Parameters:**

```
groupId: string (required)
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "groupId": "string",
    "settlements": [
      {
        "from": "string (userId)",
        "to": "string (userId)",
        "amount": "number"
      }
    ]
  },
  "message": "Settlement plan retrieved"
}
```

---

### 7. Update Expense

**Endpoint:** `PUT /expenses/:expenseId`  
**Authentication:** Bearer Token (Required)  
**Description:** Update an existing expense

**Path Parameters:**

```
expenseId: string (required)
```

**Request Body:**

```json
{
  "title": "string (optional, max 200 chars)",
  "amount": "number (optional, positive)",
  "paidBy": "string (optional, userId)",
  "participants": [
    {
      "userId": "string (optional)",
      "share": "number (optional)"
    }
  ],
  "splitType": "string (optional)",
  "category": "string (optional)"
}
```

**File Upload:** Optional bill image (multipart/form-data)

**Response (200):**

```json
{
  "success": true,
  "data": {
    "expenseId": "string",
    "title": "string",
    "amount": "number",
    "groupId": "string",
    "paidBy": "string",
    "participants": [
      {
        "userId": "string",
        "share": "number"
      }
    ],
    "splitType": "string",
    "category": "string",
    "billImageUrl": "string",
    "updatedAt": "2024-04-01T10:00:00Z"
  },
  "message": "Expense updated successfully"
}
```

---

### 8. Delete Expense

**Endpoint:** `DELETE /expenses/:expenseId`  
**Authentication:** Bearer Token (Required)  
**Description:** Delete an expense

**Path Parameters:**

```
expenseId: string (required)
```

**Response (200):**

```json
{
  "success": true,
  "message": "Expense deleted successfully"
}
```

---

## Balances

### 1. Get Group Balances

**Endpoint:** `GET /balances/:groupId`  
**Authentication:** Bearer Token (Required)  
**Description:** Get all balances in a group

**Path Parameters:**

```
groupId: string (required)
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "groupId": "string",
    "balances": [
      {
        "userId": "string",
        "userEmail": "string",
        "owes": "number",
        "owed": "number",
        "netBalance": "number"
      }
    ],
    "transactions": [
      {
        "from": "string (userId)",
        "to": "string (userId)",
        "amount": "number"
      }
    ]
  },
  "message": "Group balances calculated"
}
```

---

### 2. Get User Balances Summary

**Endpoint:** `GET /balances/user/summary`  
**Authentication:** Bearer Token (Required)  
**Description:** Get total balance summary for current user across all groups

**Query Parameters:** None

**Response (200):**

```json
{
  "success": true,
  "data": {
    "userId": "string",
    "totalOwed": "number",
    "totalToReceive": "number",
    "netBalance": "number"
  },
  "message": "User balances calculated"
}
```

---

### 3. Get Balance Between Two Users

**Endpoint:** `GET /balances/between/users`  
**Authentication:** Bearer Token (Required)  
**Description:** Get balance between two specific users in a group

**Query Parameters:**

```
groupId: string (required)
userId1: string (required)
userId2: string (required)
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "groupId": "string",
    "userId1": "string",
    "userId2": "string",
    "user1OwedByUser2": "number",
    "user2OwedByUser1": "number",
    "netBalance": "number"
  },
  "message": "Balance between users calculated"
}
```

---

### 4. Settle Balance

**Endpoint:** `POST /balances/settle`  
**Authentication:** Bearer Token (Required)  
**Description:** Mark a balance as settled between two users

**Request Body:**

```json
{
  "groupId": "string (required)",
  "toUserId": "string (required)",
  "amount": "number (required, positive)"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "settlementId": "string",
    "groupId": "string",
    "from": "string",
    "to": "string",
    "amount": "number",
    "status": "settled",
    "createdAt": "2024-04-01T10:00:00Z"
  },
  "message": "Balance settled successfully"
}
```

---

### 5. Get Group Settlements

**Endpoint:** `GET /balances/:groupId/settlements`  
**Authentication:** Bearer Token (Required)  
**Description:** Get all settlements in a group

**Path Parameters:**

```
groupId: string (required)
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "groupId": "string",
    "settlements": [
      {
        "settlementId": "string",
        "from": "string (userId)",
        "to": "string (userId)",
        "amount": "number",
        "status": "settled",
        "createdAt": "2024-04-01T10:00:00Z"
      }
    ]
  },
  "message": "Group settlements retrieved"
}
```

---

### 6. Clear Group Balance

**Endpoint:** `POST /balances/:groupId/clear`  
**Authentication:** Bearer Token (Required)  
**Description:** Clear all balances in a group (admin only)

**Path Parameters:**

```
groupId: string (required)
```

**Request Body:** `{}`

**Response (200):**

```json
{
  "success": true,
  "message": "Group balance cleared successfully"
}
```

---

## Payments

### 1. Create Payment Order

**Endpoint:** `POST /payments/order`  
**Authentication:** Bearer Token (Required)  
**Description:** Create a Razorpay payment order for settlement

**Request Body:**

```json
{
  "groupId": "string (required)",
  "fromUser": "string (required, userId of payer)",
  "toUser": "string (required, userId of payee)",
  "amount": "number (required, positive, in decimal)",
  "currency": "string (optional, default: 'INR')"
}
```

**Response (201):**

```json
{
  "success": true,
  "data": {
    "orderId": "string (Razorpay order ID)",
    "amount": "number",
    "currency": "string",
    "key": "string (Razorpay public key)",
    "description": "string"
  },
  "message": "Order created successfully"
}
```

---

### 2. Verify Payment

**Endpoint:** `POST /payments/verify`  
**Authentication:** Bearer Token (Required)  
**Description:** Verify completed payment and update settlement

**Request Body:**

```json
{
  "orderId": "string (required, Razorpay order ID)",
  "paymentId": "string (required, Razorpay payment ID)",
  "signature": "string (required, Razorpay signature)"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "message": "Payment verified successfully",
    "settlementId": "string",
    "groupId": "string",
    "status": "paid"
  },
  "message": "Payment verified successfully"
}
```

---

## Activity

### 1. Get Group Activities

**Endpoint:** `GET /activity/:groupId`  
**Authentication:** Bearer Token (Required)  
**Description:** Get activity log for a group

**Path Parameters:**

```
groupId: string (required)
```

**Query Parameters:**

```
limit: number (optional, default: 50)
skip: number (optional, default: 0, for pagination)
```

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "activityId": "string",
      "groupId": "string",
      "userId": "string",
      "username": "string",
      "action": "string (expense_added, expense_updated, expense_deleted, etc)",
      "description": "string",
      "metadata": {},
      "createdAt": "2024-04-01T10:00:00Z"
    }
  ],
  "message": "Activities retrieved successfully"
}
```

---

## Notifications

### 1. Get User Notifications

**Endpoint:** `GET /notifications/`  
**Authentication:** Bearer Token (Required)  
**Description:** Get all notifications for current user

**Query Parameters:**

```
isRead: boolean (optional, filter by read status)
limit: number (optional, default: 50)
skip: number (optional, default: 0)
```

**Response (200):**

```json
{
  "success": true,
  "data": [
    {
      "notificationId": "string",
      "userId": "string",
      "title": "string",
      "message": "string",
      "type": "string (expense_added, payment_received, etc)",
      "isRead": "boolean",
      "relatedData": {},
      "createdAt": "2024-04-01T10:00:00Z"
    }
  ],
  "message": "Notifications retrieved successfully"
}
```

---

### 2. Mark Notification as Read

**Endpoint:** `PUT /notifications/:notificationId/read`  
**Authentication:** Bearer Token (Required)  
**Description:** Mark a notification as read

**Path Parameters:**

```
notificationId: string (required)
```

**Request Body:** `{}`

**Response (200):**

```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

### 3. Mark All Notifications as Read

**Endpoint:** `PUT /notifications/mark-all-read`  
**Authentication:** Bearer Token (Required)  
**Description:** Mark all notifications as read

**Request Body:** `{}`

**Response (200):**

```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

### 4. Delete Notification

**Endpoint:** `DELETE /notifications/:notificationId`  
**Authentication:** Bearer Token (Required)  
**Description:** Delete a notification

**Path Parameters:**

```
notificationId: string (required)
```

**Response (200):**

```json
{
  "success": true,
  "message": "Notification deleted successfully"
}
```

---

## Error Responses

All endpoints may return error responses with the following format:

**400 - Bad Request:**

```json
{
  "success": false,
  "message": "Error message",
  "errorCode": "ERROR_CODE",
  "errors": [
    {
      "field": "fieldName",
      "message": "Validation error message"
    }
  ]
}
```

**401 - Unauthorized:**

```json
{
  "success": false,
  "message": "Authentication required or invalid token"
}
```

**403 - Forbidden:**

```json
{
  "success": false,
  "message": "Not authorized to perform this action"
}
```

**404 - Not Found:**

```json
{
  "success": false,
  "message": "Resource not found"
}
```

**409 - Conflict:**

```json
{
  "success": false,
  "message": "Resource already exists or conflict detected"
}
```

**500 - Internal Server Error:**

```json
{
  "success": false,
  "message": "Internal server error"
}
```

---

## Authentication

Most endpoints require Bearer token authentication in the `Authorization` header:

```
Authorization: Bearer <accessToken>
```

Tokens are obtained during login and should be stored securely on the client side.

---

## Rate Limiting

API endpoints are protected with rate limiting:

- Default: 100 requests per 15 minutes per IP
- Auth endpoints: 5 requests per 15 minutes per IP

---

## Pagination

Endpoints that return lists support pagination through query parameters:

- `limit`: Number of items per page (default: 50, max: 100)
- `skip`: Number of items to skip (default: 0)

**Example:** `/api/expenses/group/GROUP_ID?limit=25&skip=0`

---

## WebSocket Events

The application uses WebSocket for real-time updates:

**Connection:** Connect to `ws://localhost:5000`

**Emitted Events:**

- `expense:created` - When new expense is added
- `expense:updated` - When expense is modified
- `expense:deleted` - When expense is deleted
- `balances:updated` - When balances change
- `settlement:updated` - When settlement changes
- `settlement:paid` - When payment is completed
- `group:created` - When new group is created
- `group:updated` - When group is modified
- `notification:new` - When new notification arrives
