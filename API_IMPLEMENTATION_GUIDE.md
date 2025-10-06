# Travner Frontend API Implementation Guide

## Overview

This guide covers the implementation of the Travner frontend services based on the comprehensive API reference document. The implementation includes:

- ✅ **Complete API Service** (`travner-api-v2.service.ts`)
- ✅ **Real-time Chat Service** (`chat-realtime-v2.service.ts`)
- ✅ **Updated Chat Models** (`chat.models.ts`)
- ✅ **WebSocket Configuration** (Environment & Proxy)
- ✅ **Authentication Updates** for WebSocket support

## Key Updates Made

### 1. Complete API Service (`travner-api-v2.service.ts`)

**New comprehensive service implementing all API endpoints:**

```typescript
// All endpoints from the API reference are implemented:
- Authentication & Users (12 methods)
- Posts & Content (11 methods)
- Comments (6 methods)
- Real-time Chat (8 methods)
- Marketplace (11 methods)
- Media Management (4 methods)
- Admin APIs (14 methods)
```

**Key Features:**

- ✅ Public endpoints (no auth required)
- ✅ Authenticated endpoints (automatic auth headers)
- ✅ Proper query parameter handling
- ✅ Type-safe responses with `ApiResponse<T>`
- ✅ Error handling and HTTP status codes
- ✅ File upload support for media

### 2. Real-time Chat Service (`chat-realtime-v2.service.ts`)

**WebSocket-based real-time chat implementation:**

```typescript
// Features implemented:
- WebSocket connection management
- Real-time message sending/receiving
- Typing indicators with auto-timeout
- Conversation subscription management
- Automatic reconnection
- Connection status monitoring
```

**Usage Example:**

```typescript
// Inject the service
constructor(private chatService: ChatRealtimeService) {}

// Subscribe to real-time messages
this.chatService.messages$.subscribe(message => {
  console.log('New message:', message);
});

// Send a message
this.chatService.sendMessage({
  conversationId: 'conv123',
  content: 'Hello!',
  kind: 'TEXT'
});

// Send typing indicator
this.chatService.sendTypingIndicator('conv123', true);
```

### 3. Updated Chat Models (`chat.models.ts`)

**Models aligned with API specification:**

```typescript
// Key changes:
- Direct conversations only (no group chats for MVP)
- Message kinds: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM'
- WebSocket message types
- Attachment support
- Read receipts
- Pagination support
```

### 4. Environment Configuration Updates

**WebSocket URLs properly configured:**

```typescript
// Development: ws://localhost:8080/ws
// Production: wss://travner-web-backend-production.up.railway.app/ws
```

### 5. Authentication Service Updates

**Added WebSocket credential support:**

```typescript
// Temporary storage for WebSocket auth
sessionStorage.setItem("current_username", username);
sessionStorage.setItem("current_password", password);
```

## Migration Guide

### Step 1: Replace Services

```bash
# Backup existing services
cp src/app/services/travner-api.service.ts src/app/services/travner-api-old.service.ts
cp src/app/services/chat-realtime.service.ts src/app/services/chat-realtime-old.service.ts

# Use the new services
# - travner-api-v2.service.ts
# - chat-realtime-v2.service.ts
```

### Step 2: Update Component Imports

```typescript
// Old import
import { TravnerApiService } from "./services/travner-api.service";

// New import
import { TravnerApiService } from "./services/travner-api-v2.service";
```

### Step 3: Update Chat Components

```typescript
// Update chat component to use new models
import { ChatConversation, ChatMessage, ChatMessageCreate } from "../models/chat.models";

// Use new service methods
this.chatService.getConversations({ page: 0, size: 20 });
this.chatService.createDirectConversation([otherUsername]);
```

## API Usage Examples

### Authentication Flow

```typescript
// Register new user
this.apiService
  .registerUser({
    userName: "johndoe",
    password: "password123",
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
  })
  .subscribe((response) => {
    if (response.success) {
      console.log("User created:", response.data);
    }
  });

// Check username availability
this.apiService.checkUsernameAvailability("johndoe").subscribe((response) => {
  console.log("Available:", response.data?.available);
});
```

### Posts Management

```typescript
// Get all posts with pagination
this.apiService
  .getAllPosts({
    page: 0,
    size: 10,
    sortBy: "createdAt",
    direction: "desc",
  })
  .subscribe((posts) => {
    console.log("Posts:", posts.data);
    console.log("Pagination:", posts.pagination);
  });

// Create new post
this.apiService
  .createPost({
    title: "Amazing Trip to Tokyo",
    content: "Tokyo was incredible!",
    location: "Tokyo, Japan",
    tags: ["travel", "japan", "tokyo"],
    published: true,
  })
  .subscribe((response) => {
    console.log("Post created:", response.data);
  });

// Search posts
this.apiService.searchPosts("tokyo", { page: 0, size: 10 }).subscribe((results) => {
  console.log("Search results:", results.data);
});
```

### Marketplace Operations

```typescript
// Browse products
this.apiService
  .getProducts({
    page: 0,
    size: 10,
    q: "hiking",
    category: "gear",
    active: true,
  })
  .subscribe((products) => {
    console.log("Products:", products.data);
  });

// Add to cart
this.apiService
  .addToCart({
    productId: "prod123",
    quantity: 2,
  })
  .subscribe((cart) => {
    console.log("Updated cart:", cart.data);
  });

// Checkout
this.apiService
  .checkout({
    fullName: "John Doe",
    email: "john@example.com",
    phone: "+1234567890",
    addressLine1: "123 Main St",
    city: "Dhaka",
    country: "Bangladesh",
  })
  .subscribe((order) => {
    console.log("Order created:", order.data);
  });
```

### Real-time Chat

```typescript
// Connect to chat (automatic when authenticated)
this.chatService.connected$.subscribe((connected) => {
  console.log("Chat connected:", connected);
});

// Load conversations
this.chatService.loadConversations().subscribe((response) => {
  console.log("Conversations:", response.data);
});

// Create direct conversation
this.chatService.createDirectConversation("otheruser").subscribe((conversation) => {
  console.log("Conversation created:", conversation.data);
});

// Listen for real-time messages
this.chatService.messages$.subscribe((message) => {
  console.log("New message received:", message);
  // Update UI with new message
});

// Listen for typing indicators
this.chatService.typing$.subscribe((typing) => {
  console.log(`${typing.userId} is typing in ${typing.conversationId}`);
});

// Send message via WebSocket
this.chatService.sendMessage({
  conversationId: "conv123",
  content: "Hello there!",
  kind: "TEXT",
});

// Mark messages as read
this.chatService.markAsRead("conv123", "lastMessageId").subscribe((response) => {
  console.log("Marked as read");
});
```

### Media Management

```typescript
// Upload media to post
const file = /* File object */;
this.apiService.uploadPostMedia('postId', file)
  .subscribe(response => {
    console.log('Media uploaded:', response.data);
  });

// Get post media
this.apiService.getPostMedia('postId')
  .subscribe(media => {
    console.log('Post media:', media.data);
  });
```

### Admin Operations

```typescript
// Admin: Get all users
this.apiService.adminGetUsers().subscribe((users) => {
  console.log("All users:", users.data);
});

// Admin: Create product
this.apiService
  .adminCreateProduct({
    title: "Hiking Backpack",
    description: "65L lightweight pack",
    price: 129.99,
    currency: "BDT",
    stock: 50,
    category: "gear",
    active: true,
  })
  .subscribe((product) => {
    console.log("Product created:", product.data);
  });

// Admin: Manage orders
this.apiService.adminMarkOrderPaid("orderId", "Payment confirmed").subscribe((response) => {
  console.log("Order marked as paid");
});
```

## Error Handling

All services use the consistent `ApiResponse<T>` format:

```typescript
this.apiService.someMethod().subscribe({
  next: (response) => {
    if (response.success) {
      // Handle success
      console.log("Data:", response.data);
    } else {
      // Handle API error
      console.error("API Error:", response.message);
    }
  },
  error: (httpError) => {
    // Handle HTTP error (network, 500, etc.)
    console.error("HTTP Error:", httpError);
  },
});
```

## WebSocket Connection Management

The chat service automatically manages WebSocket connections:

```typescript
// Connection is established when user authenticates
// Connection is closed when user logs out
// Automatic reconnection on connection loss
// Proper cleanup on service destruction
```

## Production Considerations

### Security Notes

1. **WebSocket Authentication**: Current implementation uses Basic Auth stored in sessionStorage. Consider JWT tokens for production.

2. **Credential Storage**: Temporary credentials are stored for WebSocket. Implement proper token refresh mechanism.

3. **CORS Configuration**: Ensure backend allows WebSocket connections from your domain.

### Performance Optimizations

1. **Pagination**: All list endpoints support pagination
2. **Lazy Loading**: Load conversations and messages on demand
3. **Connection Pooling**: WebSocket connections are reused
4. **Auto-cleanup**: Services properly clean up resources

## Testing the Implementation

### 1. Authentication

```bash
# Test user registration and login
# Verify WebSocket connection after login
```

### 2. Real-time Features

```bash
# Open two browser windows
# Login as different users
# Test real-time messaging
# Verify typing indicators
```

### 3. Marketplace

```bash
# Test product browsing
# Test cart operations
# Test order creation
```

## Next Steps

1. **Component Updates**: Update existing components to use new services
2. **Error Handling**: Implement comprehensive error handling in components
3. **Loading States**: Add loading indicators for async operations
4. **Caching**: Implement appropriate caching strategies
5. **Optimization**: Add performance optimizations as needed

## API Reference Summary

✅ **66 total endpoints implemented**

- 12 Authentication & User endpoints
- 11 Posts & Content endpoints
- 6 Comment endpoints
- 8 Real-time Chat endpoints
- 11 Marketplace endpoints
- 4 Media Management endpoints
- 14 Admin endpoints

All endpoints follow the exact API specification provided in your reference document.
