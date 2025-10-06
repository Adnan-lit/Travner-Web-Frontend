# Travner API Reference

Complete API documentation for frontend implementation.

## Base Configuration

**Base URL**: `http://localhost:8080`  
**Authentication**: HTTP Basic Auth for all protected endpoints  
**Content-Type**: `application/json` for request bodies

```
Authorization: Basic <base64(username:password)>
```

### User Roles

- **USER**: Standard user (manage own content)
- **ADMIN**: Administrative access (manage all content)

## Response Format

All endpoints return consistent JSON:

```json
{
  "success": true,
  "message": "Operation description",
  "data": {
    /* response data */
  },
  "pagination": {
    /* for paginated responses */
  }
}
```

### Pagination Structure

```json
{
  "pagination": {
    "page": 0,
    "size": 10,
    "totalElements": 150,
    "totalPages": 15,
    "first": true,
    "last": false
  }
}
```

## Error Handling

### HTTP Status Codes

- `200` Success
- `400` Bad Request (validation errors)
- `401` Unauthorized (auth required)
- `403` Forbidden (insufficient permissions)
- `404` Not Found
- `409` Conflict (stock conflicts, duplicates)
- `422` Unprocessable Entity (business rule violations)

### Error Response

```json
{
  "success": false,
  "message": "Detailed error description",
  "data": null
}
```

---

## 🔐 Authentication & Users

### Public Registration

#### Register New User

```http
POST /public/create-user
```

```json
{
  "userName": "johndoe",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com"
}
```

#### Check Username Availability

```http
GET /public/check-username/{username}
```

#### Password Reset

```http
POST /public/forgot-password
```

```json
{
  "username": "johndoe"
}
```

```http
POST /public/reset-password
```

```json
{
  "token": "reset-token-here",
  "newPassword": "newpassword123"
}
```

### User Profile Management

**🔒 Authentication Required**

#### Get Current User

```http
GET /user
```

#### Get/Update Profile

```http
GET /user/profile
PUT /user/profile
PATCH /user/profile  # partial update
```

**Profile Structure:**

```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "bio": "Travel enthusiast exploring the world",
  "location": "New York, USA"
}
```

#### Change Password

```http
PUT /user/password
```

```json
{
  "currentPassword": "oldpass",
  "newPassword": "newpass"
}
```

#### Get Public Profile

```http
GET /user/public/{username}
```

---

## 📝 Posts & Content

### Public Post Access

#### Browse All Posts

```http
GET /posts?page=0&size=10&sortBy=createdAt&direction=desc
```

**Query Parameters:**

- `page` - Page number (default: 0)
- `size` - Page size (default: 10)
- `sortBy` - Sort field (default: createdAt)
- `direction` - asc/desc (default: desc)

#### Get Specific Post

```http
GET /posts/{postId}
```

#### Get Posts by User

```http
GET /posts/user/{username}?page=0&size=10
```

#### Search Posts

```http
GET /posts/search?query=paris&page=0&size=10
```

#### Filter Posts

```http
GET /posts/location?location=Paris&page=0&size=10
GET /posts/tags?tags=travel,europe&page=0&size=10
```

### Post Management

**🔒 Authentication Required**

#### Create Post

```http
POST /posts
```

```json
{
  "title": "Amazing Trip to Tokyo",
  "content": "Tokyo was incredible! Here's my experience...",
  "location": "Tokyo, Japan",
  "tags": ["travel", "japan", "tokyo", "culture"],
  "published": true
}
```

#### Update/Delete Post

```http
PUT /posts/{postId}
DELETE /posts/{postId}
```

#### Post Interactions

```http
POST /posts/{postId}/upvote
POST /posts/{postId}/downvote
```

---

## 💬 Comments

### View Comments

```http
GET /posts/{postId}/comments?page=0&size=10
```

### Manage Comments

**🔒 Authentication Required**

#### Create Comment

```http
POST /posts/{postId}/comments
```

```json
{
  "content": "Great post! I love Tokyo too.",
  "parentCommentId": null // for replies
}
```

#### Update/Delete Comment

```http
PUT /posts/{postId}/comments/{commentId}
DELETE /posts/{postId}/comments/{commentId}
```

#### Comment Interactions

```http
POST /posts/{postId}/comments/{commentId}/upvote
POST /posts/{postId}/comments/{commentId}/downvote
```

---

## 💬 Real-time Chat

**🔒 Authentication Required**

### Conversations (Direct Messages Only)

#### List Conversations

```http
GET /api/chat/conversations?page=0&size=20
```

#### Create/Get Direct Conversation

```http
POST /api/chat/conversations
```

```json
{
  "type": "DIRECT",
  "memberIds": ["otherUsername"]
}
```

#### Get Conversation with User

```http
GET /api/chat/conversations/direct/{otherUserId}
```

### Messages

#### Send Message

```http
POST /api/chat/messages
```

```json
{
  "conversationId": "64f2e...abc1",
  "content": "Hello there!",
  "kind": "TEXT",
  "replyToMessageId": "msg456", // optional
  "attachments": [
    {
      "mediaId": "media123",
      "caption": "Photo caption"
    }
  ]
}
```

**Message Types:** TEXT, IMAGE, FILE, SYSTEM

#### Get Messages

```http
GET /api/chat/conversations/{conversationId}/messages?page=0&size=50
```

#### Edit/Delete Message

```http
PUT /api/chat/messages/{messageId}
DELETE /api/chat/messages/{messageId}
```

#### Mark as Read

```http
POST /api/chat/messages/read
```

```json
{
  "conversationId": "conv123",
  "lastReadMessageId": "msg456"
}
```

#### Get Unread Count

```http
GET /api/chat/conversations/{conversationId}/unread-count
```

---

## 🛒 Marketplace

### Product Browsing (Public)

#### Browse Products

```http
GET /market/products?page=0&size=10&q=search&category=gear&active=true
```

**Query Parameters:**

- `q` - Search in title/description
- `category` - Filter by category
- `active` - true/false (default: true)

#### Get Product Details

```http
GET /market/products/{productId}
```

### Shopping Cart

**🔒 Authentication Required (USER)**

#### Get Cart

```http
GET /market/cart
```

#### Manage Cart Items

```http
POST /market/cart/items
```

```json
{
  "productId": "...",
  "quantity": 2
}
```

```http
PUT /market/cart/items/{lineId}
```

```json
{
  "quantity": 5 // 0 removes item
}
```

```http
DELETE /market/cart/items/{lineId}
DELETE /market/cart  // clear cart
```

**Cart Response:**

```json
{
  "success": true,
  "data": {
    "id": "cart123",
    "items": [
      {
        "lineId": "line123",
        "productId": "prod123",
        "titleSnapshot": "Hiking Backpack",
        "unitPrice": 129.99,
        "quantity": 2
      }
    ],
    "currency": "BDT",
    "subtotal": 259.98
  }
}
```

### Orders

**🔒 Authentication Required (USER)**

#### Checkout

```http
POST /market/orders/checkout
```

```json
{
  "customerInfo": {
    "fullName": "Jane Doe",
    "email": "jane@example.com",
    "phone": "+1234567",
    "addressLine1": "123 Main St",
    "city": "Dhaka",
    "country": "Bangladesh"
  }
}
```

#### Get User Orders

```http
GET /market/orders?page=0&size=10
GET /market/orders/{orderId}
```

#### Cancel Order (PLACED only)

```http
DELETE /market/orders/{orderId}
```

**Order States:** PLACED → PAID → FULFILLED

---

## 📁 Media Management

**🔒 Authentication Required**

#### Upload Media to Post

```http
POST /posts/{postId}/media/upload
```

**Content-Type:** `multipart/form-data`  
**Form Field:** `file`  
**Supported:** JPEG, PNG, GIF, MP4, AVI (max 20MB)

#### Get Post Media

```http
GET /posts/{postId}/media
GET /posts/{postId}/media/{mediaId}  // download file
```

#### Delete Media

```http
DELETE /posts/{postId}/media/{mediaId}
```

---

## 🔧 Admin APIs

**🔒 Authentication Required (ADMIN)**

### User Management

#### List/Manage Users

```http
GET /admin/users
GET /admin/users/{username}
DELETE /admin/users/{username}
```

#### Update User Roles

```http
PUT /admin/users/{username}/roles
```

```json
{
  "roles": ["USER", "ADMIN"]
}
```

#### Reset User Password

```http
PUT /admin/users/{username}/password
```

```json
{
  "password": "newpassword123"
}
```

#### Create Admin User

```http
POST /admin/users
```

```json
{
  "userName": "newadmin",
  "password": "adminpass123",
  "firstName": "Admin",
  "lastName": "User",
  "email": "admin@example.com"
}
```

### Marketplace Administration

#### Product Management

```http
GET /admin/market/products?page=0&size=10&q=&category=&active=
POST /admin/market/products
PUT /admin/market/products/{productId}
DELETE /admin/market/products/{productId}
```

**Product Structure:**

```json
{
  "title": "Hiking Backpack",
  "description": "65L lightweight pack",
  "price": 129.99,
  "currency": "BDT",
  "stock": 50,
  "imageUrls": ["https://example.com/img.jpg"],
  "category": "gear",
  "active": true
}
```

#### Order Management

```http
GET /admin/market/orders?page=0&size=10&buyerId=&status=
```

#### Order Lifecycle

```http
PUT /admin/market/orders/{orderId}/mark-paid
```

```json
{
  "paymentNote": "Bank transfer received" // optional
}
```

```http
PUT /admin/market/orders/{orderId}/fulfill
```

```json
{
  "adminNotes": "Shipped via courier"
}
```

```http
PUT /admin/market/orders/{orderId}/cancel
```

```json
{
  "adminNotes": "Customer requested cancellation"
}
```

#### System Statistics

```http
GET /admin/stats
```

---

## 🌐 WebSocket (Real-time Chat)

### Connection

```
ws://localhost:8080/ws
```

Authentication via Basic Auth during handshake.

### Message Types

#### Send Message

```json
{
  "type": "SEND_MESSAGE",
  "conversationId": "conv123",
  "content": "Hello!",
  "kind": "TEXT"
}
```

#### Typing Indicator

```json
{
  "type": "TYPING",
  "conversationId": "conv123",
  "isTyping": true
}
```

### Subscription Endpoints

- `/topic/conversation/{conversationId}` - Conversation messages
- `/user/queue/notifications` - Personal notifications

---

## 📋 Implementation Examples

### Authentication Setup

```javascript
// Base64 encode credentials
const credentials = btoa("username:password");
const headers = {
  Authorization: `Basic ${credentials}`,
  "Content-Type": "application/json",
};
```

### Complete User Registration Flow

```javascript
// 1. Check username availability
const checkResponse = await fetch("/public/check-username/johndoe");

// 2. Register user
const registerResponse = await fetch("/public/create-user", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    userName: "johndoe",
    password: "password123",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
  }),
});
```

### Marketplace Shopping Flow

```javascript
// 1. Browse products
const products = await fetch("/market/products?page=0&size=10");

// 2. Add to cart
await fetch("/market/cart/items", {
  method: "POST",
  headers: authHeaders,
  body: JSON.stringify({
    productId: "prod123",
    quantity: 2,
  }),
});

// 3. Checkout
await fetch("/market/orders/checkout", {
  method: "POST",
  headers: authHeaders,
  body: JSON.stringify({
    customerInfo: {
      fullName: "John Doe",
      email: "john@example.com",
      phone: "+1234567890",
      addressLine1: "123 Main St",
      city: "Dhaka",
      country: "Bangladesh",
    },
  }),
});
```

---

## 📝 Notes for Frontend Implementation

### Important Constraints

- **IDs**: All MongoDB ObjectIds are 24-character hex strings
- **Currency**: Marketplace uses BDT only (display formatting on frontend)
- **Cart**: Max 10 quantity per line item
- **File Upload**: Max 20MB per file
- **Pagination**: Default page size 10, max 100

### Rate Limits

- Chat messages: 60 per minute per user
- File uploads: 20MB max file size

### Error Handling Best Practices

- Always check `success` field in response
- Display `message` field for user feedback
- Handle 401/403 with auth flow redirect
- Show loading states for async operations

### Real-time Features

- Use WebSocket for chat functionality
- Implement typing indicators with 2-second debounce
- Subscribe to conversation-specific topics

---

**API Version**: Current  
**Last Updated**: October 2025  
**Support**: See project repository for issues and updates