# API Authentication Migration Guide for Frontend

## Overview

We've migrated our API authentication from API key-based authentication to HttpOnly cookie-based authentication. This document explains what frontend developers need to know about these changes.

## What Has Changed

1. **Authentication Flow**:
   - Previously: API keys were sent in the `x-user-key` header for authenticated requests
   - Now: Authentication uses HTTP-only cookies set during login

2. **Compatibility Mode**:
   - All endpoints still accept the API key for backward compatibility
   - New features will eventually require cookie authentication

3. **Security Benefits**:
   - HttpOnly cookies cannot be accessed by JavaScript, protecting against XSS attacks
   - Cookies are automatically sent with every request to our domain
   - Session-based approach with automatic expiration

## Frontend Implementation Changes

### Login Flow

1. When a user logs in via Privy, the backend now sets an HttpOnly cookie automatically
2. The frontend doesn't need to store or manage API keys for authenticated requests

### API Requests

1. **For Authenticated Endpoints**:
   - Simply make the request without adding any authorization headers
   - The HttpOnly cookie will be sent automatically by the browser

2. **Handle 401 Responses**:
   - If a request returns a 401 Unauthorized, redirect to the login page
   - The session may have expired or the user may not be logged in

### API Endpoints

✅ **All API endpoints have been migrated to the new authentication system.**

The migration is now complete! All endpoints now use the new authentication middleware which supports both cookie-based authentication and API keys for backward compatibility.

### Testing Authentication

You can test if your authentication is working by hitting the `/test-auth` endpoint:

```javascript
// Simple check if user is authenticated
fetch('/test-auth', {
  method: 'GET',
  credentials: 'include', // Important! This tells fetch to send cookies
})
.then(response => response.json())
.then(data => {
  if (data.authenticated) {
    console.log('User is authenticated with ID:', data.userId);
  } else {
    console.log('User is not authenticated');
  }
});
```

## Important Implementation Details

1. **The `credentials: 'include'` Setting**:
   - All fetch/axios requests must include `credentials: 'include'` or equivalent
   - This ensures cookies are sent with cross-origin requests if needed

```javascript
// Example fetch with credentials
fetch('/some-endpoint', {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify(data),
});

// Example axios configuration
axios.defaults.withCredentials = true;
```

2. **CORS Considerations**:
   - If your frontend is on a different domain than the API, you may need to ensure CORS is properly configured
   - The backend has been updated to handle CORS with credentials

3. **Logout Handling**:
   - To log a user out, call the logout endpoint which will clear the authentication cookie
   - After logout, redirect the user to the login page

```javascript
// Example logout
fetch('/logout', {
  method: 'POST',
  credentials: 'include',
})
.then(() => {
  // Redirect to login page or update UI
  window.location.href = '/login';
});
```

## Migration Timeline & Plan

1. ✅ **Current Phase (Completed): Dual Authentication Support**
   - All endpoints now support both cookie authentication and API key authentication
   - Frontend can continue using existing API key authentication or migrate to cookie-based authentication

2. **Next Phase (Future): Cookie-Only Authentication**
   - API key support will eventually be deprecated
   - New features will only be accessible via cookie authentication
   - Frontend teams should plan to migrate to cookie-based authentication in the coming months

## Questions and Support

If you encounter any issues with the new authentication system, please contact the backend team for assistance. 