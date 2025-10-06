# 404 Error Troubleshooting Guide

## Problem

Getting 404 error: `"API endpoint not found. The server returned 404 for: http://localhost:4200/user"`

## Root Cause Analysis

The error shows the request is going to `http://localhost:4200/user` instead of `http://localhost:8080/user`. This indicates a proxy configuration issue.

## Possible Causes

### 1. Angular Dev Server Not Using Proxy

**Most Likely Cause**: The Angular development server is not running with the proxy configuration.

**Solution**: Ensure you're starting the app with:

```bash
npm start
# OR
ng serve --proxy-config proxy.conf.json
```

**Check**: The `package.json` should have:

```json
{
  "scripts": {
    "start": "ng serve --proxy-config proxy.conf.json"
  }
}
```

### 2. Proxy Configuration Issues

**Check**: `proxy.conf.json` should contain:

```json
{
  "/user": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug"
  }
}
```

### 3. Backend Server Not Running

**Check**: Ensure the backend server is running on `http://localhost:8080`

```bash
# Test backend directly
curl -X GET http://localhost:8080/user \
  -H "Authorization: Basic <base64(username:password)>"
```

## Debugging Steps

### Step 1: Check Current Configuration

Open browser console and look for debug logs from the signin process:

```
🔧 Signin Debug Info:
  - API_BASE_URL: (empty string for proxy)
  - Full endpoint: /user
  - Window location: http://localhost:4200
  - Expected proxy: /user should proxy to http://localhost:8080/user
```

### Step 2: Verify Environment Detection

Check console for environment detection logs:

```
🔧 Environment Detection:
  - Hostname: localhost
  - Port: 4200
  - Origin: http://localhost:4200
🔧 Development environment with Angular dev server - using proxy
  - Expecting proxy: /user → http://localhost:8080/user
  - Make sure to start with: npm start (includes --proxy-config)
```

### Step 3: Test Proxy Configuration

1. Stop the Angular dev server
2. Restart with proxy:
   ```bash
   npm start
   # OR
   ng serve --proxy-config proxy.conf.json
   ```
3. Check browser network tab - requests to `/user` should be proxied

### Step 4: Verify Backend is Running

```bash
# Test backend directly
curl http://localhost:8080/user
# Should return 401 (because no auth) not 404
```

## Solutions

### Solution 1: Restart with Proper Proxy (Recommended)

```bash
# Stop current dev server
# Then restart with proxy
npm start
```

### Solution 2: Temporary Direct Backend Access

If proxy isn't working, temporarily modify environment config:

```typescript
// In environment.config.ts - temporary fix
static getApiBaseUrl(): string {
  const hostname = window.location.hostname;

  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    // Temporary: use backend directly instead of proxy
    return 'http://localhost:8080';
  }
  // ... rest of config
}
```

### Solution 3: Check for Port Conflicts

- Ensure backend is on port 8080: `netstat -an | grep 8080`
- Ensure frontend is on port 4200: `netstat -an | grep 4200`
- No other services using these ports

### Solution 4: Alternative Proxy Configuration

Try alternative proxy config in `proxy.conf.json`:

```json
{
  "/user": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true,
    "logLevel": "debug",
    "bypass": function (req, res, proxyOptions) {
      console.log('Proxying:', req.url, 'to', proxyOptions.target + req.url);
    }
  }
}
```

## Verification

### Expected Behavior After Fix:

1. **Browser Console**: Shows environment detection and proxy usage
2. **Network Tab**: Shows requests to `/user` (not `http://localhost:4200/user`)
3. **Backend Logs**: Shows incoming requests on port 8080
4. **Authentication**: Works without 404 errors

### Test Command:

```typescript
// In browser console (after signin component loads)
// This should show the debug information
authService.signin("testuser", "password").subscribe(
  (user) => console.log("Success:", user),
  (error) => console.error("Error:", error)
);
```

## Quick Fix Commands

```bash
# 1. Ensure backend is running
# Start your Spring Boot backend on port 8080

# 2. Stop Angular dev server (Ctrl+C)

# 3. Start Angular with proxy
npm start

# 4. Test in browser
# Navigate to http://localhost:4200
# Try signing in - should now work
```

## Prevention

### Always Use Proxy in Development:

- Use `npm start` instead of `ng serve`
- Add proxy validation to startup scripts
- Document proxy requirements for team

### Environment-Specific Configuration:

- Keep proxy config for development
- Use direct URLs for production
- Add environment detection logging

The 404 error should be resolved once the Angular dev server is properly started with the proxy configuration.
