# Travner API Service

This directory contains enhanced services for the Travner application that follow the official API documentation.

## Services Overview

### 1. Centralized Authentication Service
**File**: `centralized-auth.service.ts`
- Replaces the original AuthService with improved security
- Uses encrypted storage for credentials
- Provides all authentication-related functionality from the API docs

### 2. Comprehensive Travner API Service
**File**: `travner-api.service.ts`
- Implements ALL endpoints from the Travner API documentation
- Provides type-safe access to all backend functionality
- Includes proper error handling and pagination support

### 3. Utility Services
**Files**: 
- `api-response-handler.ts` - Standardized response parsing
- `pagination-handler.ts` - Pagination parameter handling
- `error-handler.ts` - Standardized error handling
- `secure-storage.ts` - Secure credential storage

## Usage Examples

### Authentication
```typescript
// Sign in
this.authService.signin(username, password).subscribe(user => {
  console.log('User signed in:', user);
});

// Sign up
this.authService.signup({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john@example.com',
  password: 'password123'
}).subscribe(response => {
  console.log('User created:', response);
});
```

### Using the Comprehensive API Service
```typescript
// Get posts with pagination
this.travnerApiService.getPosts(0, 10).subscribe(response => {
  if (response.success) {
    console.log('Posts:', response.data);
    console.log('Pagination:', response.pagination);
  }
});

// Create a post
this.travnerApiService.createPost({
  title: 'My Travel Experience',
  content: 'This is my amazing travel experience...',
  location: 'Paris, France'
}).subscribe(response => {
  if (response.success) {
    console.log('Post created:', response.data);
  }
});
```

## Security Improvements

1. **Encrypted Credential Storage**: Credentials are now stored encrypted using `SecureStorage`
2. **Standardized Error Handling**: All API errors are handled consistently
3. **Type Safety**: Full TypeScript support for all API responses

## API Coverage

The `travner-api.service.ts` implements all endpoints from the official documentation:

- ✅ Authentication APIs
- ✅ User Management APIs
- ✅ Post Management APIs
- ✅ Comment APIs
- ✅ Marketplace APIs
- ✅ Admin APIs

Each method follows the exact specification from the API documentation, including:
- Correct HTTP methods
- Proper URL paths
- Required headers
- Request/response formats
- Error handling