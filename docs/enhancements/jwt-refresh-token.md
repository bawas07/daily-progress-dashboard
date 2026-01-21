# JWT Refresh Token Enhancement

> **Status**: Not Implemented - Planned for future phase

## Overview

This document describes the planned enhancement to implement refresh tokens for improved security.

## Current Implementation

- **Token Type**: Single JWT access token
- **Lifetime**: 7 days
- **Storage**: localStorage (Phase 1)
- **Revocation**: Not implemented

## Proposed Implementation

### Token Architecture

```
┌─────────────────────────────────────────────────────┐
│                   TOKEN FLOW                        │
├─────────────────────────────────────────────────────┤
│                                                     │
│  1. User logs in                                    │
│     → Server returns:                               │
│       • Access Token (15 minutes)                   │
│       • Refresh Token (7 days)                      │
│                                                     │
│  2. API calls use Access Token                      │
│                                                     │
│  3. Access token expires (15 min)                   │
│     → Client automatically:                         │
│       • Sends Refresh Token to /api/auth/refresh    │
│     → Server validates Refresh Token                │
│     → Server returns:                               │
│       • New Access Token                            │
│       • New Refresh Token (rotation)                │
│                                                     │
│  4. User logs out                                   │
│     → Server revokes Refresh Token                  │
│     → Client deletes both tokens                    │
│                                                     │
└─────────────────────────────────────────────────────┘
```

## Database Changes

### New Table: RefreshTokens

```prisma
model RefreshToken {
  id        String   @id @default(cuid())
  token     String   @unique
  userId    String   @map("user_id")
  expiresAt DateTime @map("expires_at")
  createdAt DateTime @default(now()) @map("created_at")
  revokedAt DateTime? @map("revoked_at")
  userAgent String?  @map("user_agent")
  ipAddress String?  @map("ip_address")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@map("refresh_tokens")
}
```

### Migration Required

```bash
bunx prisma migrate add refresh_tokens_table --name "add_refresh_tokens"
```

## API Changes

### New Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/refresh` | Exchange refresh token for new access token |
| POST | `/api/auth/revoke` | Revoke refresh token (logout) |
| GET | `/api/auth/session` | Validate session, return new tokens if needed |

### Modified Endpoints

#### POST /api/auth/login (Modified Response)

```typescript
type LoginResponse = SuccessResponse<{
  accessToken: string;      // NEW: short-lived token
  refreshToken: string;     // NEW: long-lived token  
  expiresIn: number;        // NEW: access token TTL in seconds
  user: User;
  preferences: UserPreferences;
}>;
```

## Backend Implementation Tasks

### Task 2.X: JWT Refresh Token Backend

1. **Create RefreshTokenRepository**
   - Create refresh token in database
   - Validate refresh token
   - Revoke refresh token
   - Clean up expired tokens (cron job)

2. **Create RefreshTokenService**
   - Generate token pair (access + refresh)
   - Validate and rotate tokens
   - Handle revocation

3. **Create Refresh Controller**
   - POST /api/auth/refresh endpoint
   - POST /api/auth/revoke endpoint
   - GET /api/auth/session endpoint

4. **Update Auth Service**
   - Return both tokens on login
   - Update JWT service for short-lived tokens

5. **Add Database Migration**
   - Create RefreshToken table
   - Run migration

## Frontend Implementation Tasks

### Task 10.X: JWT Refresh Token Frontend

1. **Update Auth Store**
   - Store both tokens
   - Implement token refresh logic
   - Handle automatic refresh on 401

2. **Update API Service**
   - Add token refresh interceptor
   - Handle 401 -> refresh -> retry flow

3. **Add Token Rotation Logic**
   - Refresh on token expiry
   - Store new tokens after refresh

4. **Update Logout**
   - Call revoke endpoint
   - Clear both tokens

## Security Considerations

### Token Storage

**Phase 1 (Current)**: localStorage
**Production Recommendation**: HTTP-only cookies

### Refresh Token Rotation

Each refresh generates a new refresh token to prevent reuse of stolen tokens.

### Token Revocation

- User can revoke all sessions (logout everywhere)
- Server can revoke specific tokens
- Expired tokens automatically cleaned up

### Rate Limiting

- Limit refresh attempts per IP
- Detect brute force attacks
- Implement exponential backoff

## Implementation Priority

| Priority | Task | Effort |
|----------|------|--------|
| HIGH | Backend RefreshTokenRepository | 1-2 hours |
| HIGH | Backend RefreshTokenService | 1 hour |
| HIGH | POST /api/auth/refresh endpoint | 1 hour |
| MEDIUM | Frontend token refresh logic | 2 hours |
| MEDIUM | POST /api/auth/revoke endpoint | 1 hour |
| LOW | Session validation endpoint | 1 hour |
| LOW | Token cleanup cron job | 1 hour |

## Rollout Plan

1. **Phase 1**: Backend implementation (Repository, Service, Controller)
2. **Phase 2**: Database migration
3. **Phase 3**: Frontend updates (Store, API Service)
4. **Phase 4**: Testing and validation

## Testing Strategy

### Backend Tests
- Token generation and validation
- Token rotation
- Revocation workflow
- Expiry handling

### Frontend Tests
- Auto-refresh on 401
- Token storage
- Logout flow
- Error handling

## References

- [OWASP Session Management](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [RFC 6819 - OAuth 2.0 Token Revocation](https://tools.ietf.org/html/rfc6819)
- [JWT Best Practices](https://auth0.com/blog/a-look-at-the-latest-draft-for-jwt-bcp/)
