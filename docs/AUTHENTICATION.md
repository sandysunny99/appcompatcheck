# Authentication System Documentation

## Overview

AppCompatCheck implements a comprehensive authentication system with the following features:
- User registration (sign-up) with email and password
- User login (sign-in) with session management
- Password confirmation during registration
- Forgot password functionality
- Secure password reset via time-limited tokens
- Activity logging for security audits
- Redis-based token storage for scalability

## Table of Contents

1. [Sign-Up Flow](#sign-up-flow)
2. [Sign-In Flow](#sign-in-flow)
3. [Forgot Password Flow](#forgot-password-flow)
4. [Reset Password Flow](#reset-password-flow)
5. [Session Management](#session-management)
6. [Security Features](#security-features)
7. [API Reference](#api-reference)

---

## Sign-Up Flow

### User Registration Process

1. User navigates to `/sign-up`
2. User enters:
   - Email address
   - Password (minimum 8 characters)
   - Password confirmation (must match password)
3. System validates:
   - Email format is valid
   - Password meets minimum length requirements
   - Password and confirmation match
   - Email is not already registered
4. System creates user account:
   - Hashes password using bcrypt
   - Stores user in database
   - Logs registration activity
   - Creates session
5. User is redirected to homepage (authenticated)

### Sign-Up Validation Rules

- **Email**: Must be valid email format
- **Password**: Minimum 8 characters
- **Password Confirmation**: Must match password exactly
- **Unique Email**: Email must not already exist in system

### Sign-Up Form Fields

```typescript
{
  email: string;          // Email address
  password: string;       // Password (min 8 chars)
  confirmPassword: string; // Password confirmation
}
```

### Error Messages

- `"An account with this email already exists. Please sign in instead."` - Email already registered
- `"Passwords do not match"` - Password and confirmation don't match
- `"Failed to create user. Please try again."` - Database error
- `"An unexpected error occurred. Please try again."` - Unexpected server error

---

## Sign-In Flow

### User Login Process

1. User navigates to `/sign-in`
2. User enters:
   - Email address
   - Password
3. System validates:
   - Email format is valid
   - Password meets minimum length requirements
4. System authenticates:
   - Looks up user by email
   - Compares password hash
   - Verifies account is active
5. On success:
   - Creates session
   - Logs sign-in activity
   - Redirects to homepage
6. On failure:
   - Returns error message
   - User remains on sign-in page

### Sign-In Form Fields

```typescript
{
  email: string;    // Email address
  password: string; // Password
}
```

### Error Messages

- `"Invalid email or password. Please try again."` - Authentication failed

### Forgot Password Link

The sign-in page includes a "Forgot password?" link that directs users to `/forgot-password`.

---

## Forgot Password Flow

### Password Reset Request Process

1. User clicks "Forgot password?" on sign-in page
2. User navigates to `/forgot-password`
3. User enters their email address
4. System processes request:
   - Looks up user by email
   - Generates secure random token (32 bytes hex)
   - Stores token in Redis with 1-hour expiry
   - Maps token to user ID
5. System response:
   - Returns success message regardless of email existence (prevents email enumeration)
   - Logs reset token to console (for development)
   - In production: Send email with reset link

### Security Features

- **Email Enumeration Protection**: Same message shown whether email exists or not
- **Token Expiry**: Tokens automatically expire after 1 hour
- **Secure Random Tokens**: 32-byte cryptographically secure random tokens
- **Redis Storage**: Tokens stored in Redis, not database (better security and performance)

### Reset Link Format

```
https://your-domain.com/reset-password?token={RESET_TOKEN}
```

### Console Output (Development Only)

```
Password reset token for user@example.com: abc123def456...
Reset link: http://localhost:3000/reset-password?token=abc123def456...
```

---

## Reset Password Flow

### Password Reset Process

1. User clicks reset link from email
2. User navigates to `/reset-password?token={TOKEN}`
3. System validates token:
   - Checks if token exists in Redis
   - Verifies token hasn't expired (1 hour)
   - Retrieves associated user ID
4. User enters:
   - New password (minimum 8 characters)
   - Password confirmation (must match)
5. System processes reset:
   - Validates password requirements
   - Hashes new password
   - Updates user's password in database
   - Deletes token from Redis
   - Logs password change activity
6. User sees success message with sign-in link

### Reset Password Form Fields

```typescript
{
  token: string;            // Reset token from URL
  password: string;         // New password (min 8 chars)
  confirmPassword: string;  // Password confirmation
}
```

### Error Messages

- `"Invalid or expired reset token."` - Token not found or expired
- `"Passwords do not match"` - Password and confirmation don't match
- `"User not found."` - Associated user doesn't exist
- `"An error occurred. Please try again."` - Server error

### Success Flow

After successful password reset:
1. User sees success message
2. Token is deleted from Redis
3. Activity is logged
4. User can click "Go to Sign In" button

---

## Session Management

### Session Storage

- Sessions stored in secure HTTP-only cookies
- Redis used for session data
- Session includes user ID and basic profile info

### Session Security

- **HTTP-Only Cookies**: Prevents XSS attacks
- **Secure Flag**: Ensures HTTPS transmission in production
- **Same-Site**: Prevents CSRF attacks
- **Redis Storage**: Centralized session management

### Session Expiry

Sessions remain active until:
- User explicitly signs out
- Session expires (configurable)
- Server invalidates session

### Sign-Out Process

1. User clicks "Log out" in user menu
2. System:
   - Logs sign-out activity
   - Deletes session cookie
   - Redirects to sign-in page

---

## Security Features

### Password Security

- **Bcrypt Hashing**: Passwords hashed with bcrypt (salt rounds: 10)
- **No Plain Text Storage**: Passwords never stored in plain text
- **Minimum Length**: 8 character minimum
- **Validation**: Password confirmation prevents typos

### Token Security

- **Cryptographically Secure**: Tokens generated with `crypto.randomBytes()`
- **Time-Limited**: 1-hour expiration for reset tokens
- **Single Use**: Tokens deleted after successful use
- **Redis Storage**: Tokens stored in memory, not database

### Activity Logging

All authentication events are logged:
- User sign-up
- User sign-in
- Password resets
- Account updates
- Sign-outs

Log entries include:
- User ID
- Action type
- Timestamp
- IP address (when available)
- User agent (when available)

### Error Messages

- Generic error messages prevent information leakage
- Email enumeration protection on forgot password
- Consistent messaging for security

---

## API Reference

### Sign-Up Action

```typescript
signUp(data: {
  email: string;
  password: string;
  confirmPassword: string;
}): Promise<ActionState>
```

**Returns:**
- Success: Redirects to `/`
- Error: Returns error message

---

### Sign-In Action

```typescript
signIn(data: {
  email: string;
  password: string;
}): Promise<ActionState>
```

**Returns:**
- Success: Redirects to `/`
- Error: Returns error message

---

### Forgot Password Action

```typescript
forgotPassword(data: {
  email: string;
}): Promise<ActionState>
```

**Returns:**
- Always returns success message (email enumeration protection)

---

### Reset Password Action

```typescript
resetPassword(data: {
  token: string;
  password: string;
  confirmPassword: string;
}): Promise<ActionState>
```

**Returns:**
- Success: Returns success message
- Error: Returns error message

---

### Sign-Out Action

```typescript
signOut(): Promise<void>
```

**Side Effects:**
- Logs activity
- Deletes session cookie
- Does not redirect (handled by client)

---

## Routes

| Route | Purpose | Auth Required |
|-------|---------|---------------|
| `/sign-up` | User registration | No |
| `/sign-in` | User login | No |
| `/forgot-password` | Request password reset | No |
| `/reset-password` | Reset password with token | No |
| `/` | Homepage | No (but changes based on auth) |
| `/dashboard` | User dashboard | Yes |
| `/reports` | Reports page | Yes |
| `/upload` | File upload | Yes |
| `/settings` | User settings | Yes |

---

## Environment Variables

The authentication system requires the following environment variables:

### Database & Redis
- `DATABASE_URL`: PostgreSQL connection (already configured)
- `REDIS_URL`: Redis connection (already configured)

### Email Configuration (Required for Email Notifications)
- `SMTP_HOST`: SMTP server hostname (e.g., `smtp.resend.com`)
- `SMTP_PORT`: SMTP server port (`465` for SSL, `587` for STARTTLS)
- `SMTP_SECURE`: Use SSL/TLS (`true` for port 465, `false` for port 587)
- `SMTP_USER`: SMTP username or API user
- `SMTP_PASSWORD`: SMTP password or API key
- `EMAIL_FROM`: Sender email address (e.g., `AppCompatCheck <noreply@yourdomain.com>`)
- `NEXT_PUBLIC_APP_URL`: Application base URL (e.g., `http://localhost:3000` or `https://yourdomain.com`)

### Email Setup Instructions

For detailed email configuration instructions, see [EMAIL_SETUP.md](./EMAIL_SETUP.md).

**Quick Start (Development)**:

1. Sign up for free email service (Resend recommended)
2. Get your API key
3. Add to `.env`:
   ```env
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=resend
   SMTP_PASSWORD=your_api_key_here
   EMAIL_FROM=AppCompatCheck <noreply@yourdomain.com>
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```
4. Restart development server

**Note**: Emails sent during authentication are non-blocking. If email fails to send, the authentication process will still complete successfully, and errors will be logged to the console.

---

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  organization_id INTEGER,
  is_active BOOLEAN NOT NULL DEFAULT true,
  last_login_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  deleted_at TIMESTAMP
);
```

### Activity Logs Table

```sql
CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER,
  organization_id INTEGER,
  action VARCHAR NOT NULL,
  entity_type VARCHAR,
  entity_id INTEGER,
  description TEXT,
  ip_address VARCHAR,
  user_agent TEXT,
  metadata JSONB,
  timestamp TIMESTAMP NOT NULL DEFAULT NOW()
);
```

---

## Redis Keys

### Password Reset Tokens

**Key Format:** `password_reset:{TOKEN}`  
**Value:** User ID (string)  
**TTL:** 3600 seconds (1 hour)

Example:
```
Key: password_reset:abc123def456...
Value: "42"
TTL: 3600
```

---

## Testing

### Manual Testing Checklist

**Sign-Up:**
- [ ] Sign up with new email succeeds
- [ ] Sign up with existing email fails
- [ ] Password mismatch shows error
- [ ] Short password shows error
- [ ] Invalid email format shows error
- [ ] Successful sign-up creates session
- [ ] Activity is logged

**Sign-In:**
- [ ] Sign in with correct credentials succeeds
- [ ] Sign in with wrong password fails
- [ ] Sign in with non-existent email fails
- [ ] Successful sign-in creates session
- [ ] Activity is logged

**Forgot Password:**
- [ ] Valid email shows success message
- [ ] Invalid email shows same message (security)
- [ ] Token is created in Redis
- [ ] Token appears in console logs (dev)

**Reset Password:**
- [ ] Valid token loads reset form
- [ ] Invalid/expired token shows error
- [ ] Password mismatch shows error
- [ ] Successful reset updates password
- [ ] Token is deleted after use
- [ ] Can sign in with new password

**Session:**
- [ ] Header shows user menu when logged in
- [ ] Header shows login/signup when logged out
- [ ] Sign out clears session
- [ ] Protected routes require authentication

---

## Troubleshooting

### Common Issues

**"Column does not exist" error:**
- Restart development server to clear Drizzle cache
- Verify schema matches database structure

**Reset email not sent:**
- Email sending not implemented in development
- Check console logs for reset link
- In production, configure email service

**Token expired too quickly:**
- Adjust Redis TTL in `forgotPassword` action
- Default is 3600 seconds (1 hour)

**Session not persisting:**
- Check Redis connection
- Verify cookie settings
- Check browser privacy settings

---

## Future Enhancements

### Implemented Features ✅

1. **Welcome Emails**
   - Welcome email sent after successful registration
   - Professional HTML email templates

2. **Password Reset Emails**
   - Reset link sent to user's email
   - Token-based secure reset flow

### Planned Features

1. **Email Verification**
   - Verify email addresses on sign-up
   - Send verification tokens via email
   - Mark accounts as verified

2. **Two-Factor Authentication (2FA)**
   - TOTP-based 2FA
   - Backup codes
   - SMS authentication

3. **Social Login**
   - OAuth integration (Google, GitHub, etc.)
   - Account linking

4. **Email Service Integration**
   - Configure email provider (SendGrid, AWS SES, etc.)
   - Email templates
   - Transactional emails

5. **Rate Limiting**
   - Prevent brute force attacks
   - Limit password reset requests
   - Implement CAPTCHA for repeated failures

6. **Account Management**
   - Email change with verification
   - Account deletion
   - Data export

---

## Security Best Practices

1. **Always use HTTPS in production**
2. **Keep dependencies updated**
3. **Monitor activity logs for suspicious behavior**
4. **Implement rate limiting**
5. **Use strong password policies**
6. **Regular security audits**
7. **Configure email alerts for critical actions**
8. **Backup Redis data**
9. **Rotate secrets regularly**
10. **Test authentication flows regularly**

---

## Support

For issues or questions:
- Check console logs for detailed error messages
- Review activity logs for security events
- Verify Redis and PostgreSQL connections
- Ensure environment variables are set correctly

---

**Last Updated:** 2025-01-27  
**Version:** 1.0.0  
**Maintainer:** AppCompatCheck Team
