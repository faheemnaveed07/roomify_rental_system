# 🚀 Quick Implementation Reference

## Rate Limiting Middleware Usage

### File: `backend/src/middleware/rateLimit.middleware.ts`

```typescript
import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';

// 5 requests per 15 minutes (auth endpoints)
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 5,
    message: 'Too many authentication attempts. Please try again after 15 minutes.',
    skip: (req: Request): boolean => {
        return process.env.NODE_ENV === 'development';
    },
    handler: (req: Request, res: Response) => {
        res.status(429).json({
            success: false,
            message: 'Too many authentication attempts. Please try again in 15 minutes.',
        });
    },
});

// 3 requests per 1 hour (password reset)
export const passwordLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    // ... same pattern
});

// 10 requests per 15 minutes (token refresh)
export const refreshLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    // ... same pattern
});

// 5 requests per 1 hour (email verification)
export const emailVerificationLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    // ... same pattern
});
```

### Apply to Routes

**File**: `backend/src/routes/auth.routes.ts`

```typescript
import { authLimiter, passwordLimiter, refreshLimiter, emailVerificationLimiter } from '../middleware/rateLimit.middleware';

router.post('/register', authLimiter, authController.register.bind(authController));
router.post('/login', authLimiter, authController.login.bind(authController));
router.post('/refresh-token', refreshLimiter, authController.refreshToken.bind(authController));
router.get('/verify-email/:token', emailVerificationLimiter, authController.verifyEmail.bind(authController));
router.post('/forgot-password', passwordLimiter, authController.forgotPassword.bind(authController));
router.post('/reset-password', passwordLimiter, authController.resetPassword.bind(authController));
```

---

## CSRF Protection Middleware

### File: `backend/src/middleware/csrf.middleware.ts`

```typescript
export const validateOrigin = (req: Request, res: Response, next: NextFunction): void => {
    const origin = req.get('origin');
    
    // Skip in development
    if (!origin || process.env.NODE_ENV === 'development') {
        return next();
    }

    const ALLOWED_ORIGINS = [
        'http://localhost:3000',
        'http://localhost:5173',
        process.env.FRONTEND_URL,
    ].filter(Boolean);

    if (!ALLOWED_ORIGINS.includes(origin)) {
        logger.warn(`⚠️ CSRF: Blocked request from unauthorized origin: ${origin}`);
        res.status(403).json({
            success: false,
            message: 'Access denied: Invalid origin',
        });
        return;
    }

    next();
};

export const csrfMiddleware = {
    validateOrigin,
    validateRequestMethod,
};
```

### Apply Globally

**File**: `backend/src/index.ts`

```typescript
import { csrfMiddleware } from './middleware/csrf.middleware';

// After middleware setup, before routes
app.use(cookieParser());
app.use(csrfMiddleware.validateOrigin);
app.use(csrfMiddleware.validateRequestMethod);
app.use('/api', routes);
```

---

## CORS Configuration

### File: `backend/src/index.ts`

```typescript
const allowedOrigins: string[] = [
    'http://localhost:3000',   // Development
    'http://localhost:5173',   // Vite
];

if (process.env.FRONTEND_URL) {
    allowedOrigins.push(process.env.FRONTEND_URL); // Production
}

app.use(
    cors({
        origin: allowedOrigins,           // ✅ Whitelist only
        credentials: true,                 // ✅ For httpOnly cookies
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
        allowedHeaders: ['Content-Type', 'Authorization'],
    })
);
```

---

## Helmet Configuration

### File: `backend/src/index.ts`

```typescript
app.use(
    helmet({
        crossOriginResourcePolicy: false,     // Allow cross-origin images
        contentSecurityPolicy: {              // Security policy
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'"],
                styleSrc: ["'self'", "'unsafe-inline'"],
            },
        },
    })
);
```

---

## Environment Variables (.env)

```bash
# Production Settings
NODE_ENV=production
FRONTEND_URL=https://your-domain.com

# Authentication
JWT_SECRET=your-secret-key-here
JWT_REFRESH_SECRET=your-refresh-secret-here

# Database
MONGODB_URI=mongodb+srv://...

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
```

---

## Testing Commands

### Test Rate Limiting
```bash
# First 5 attempts succeed, 6th fails with 429
for i in {1..7}; do
  curl -X POST http://localhost:5001/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"test@example.com","password":"test123"}'
  echo "Attempt $i"
  sleep 1
done
```

### Test CSRF Protection
```bash
# Request from unauthorized origin - returns 403
curl -X POST http://localhost:5001/api/auth/login \
  -H "Origin: https://malicious-site.com" \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

### Test Mobile/API Client
```bash
# Authorization header (bypasses origin check)
curl -X GET http://localhost:5001/api/auth/profile \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN"
```

---

## Monitoring Checklist

- [ ] HTTP 429 responses (rate limit hits)
- [ ] HTTP 403 responses (CSRF blocks)
- [ ] Logs starting with "⚠️ CSRF:"
- [ ] Multiple attempts from same IP to auth endpoints
- [ ] Requests from unexpected origins

---

## Production Deployment Steps

1. **Update Environment Variables**
   ```bash
   NODE_ENV=production
   FRONTEND_URL=https://your-production-domain.com
   ```

2. **Verify CORS Whitelist**
   - Check `allowedOrigins` includes all legitimate domains
   - Remove localhost domains

3. **Enable HTTPS**
   - Required for `Secure` flag on cookies
   - Use reverse proxy or SSL certificate

4. **Test Security Features**
   - Attempt login >5 times (should get 429)
   - Try request from invalid origin (should get 403)
   - Verify httpOnly cookies work

5. **Deploy**
   ```bash
   npm run build
   npm start
   ```

6. **Monitor**
   - Watch for increased 429 and 403 responses
   - Set up alerts for security events

---

## Troubleshooting

### Issue: Browser can't authenticate (403 error)
**Solution**: Add browser's origin to `allowedOrigins` array or set `FRONTEND_URL` env var

### Issue: CSRF middleware blocks legitimate requests
**Solution**: Check development mode (NODE_ENV) - middleware skips in dev

### Issue: Rate limiting too strict
**Solution**: Adjust limits in `rateLimit.middleware.ts`:
- `max: 5` → increase number
- `windowMs: 15 * 60 * 1000` → increase time window

### Issue: Mobile app can't make requests
**Solution**: Use Authorization header instead of cookies:
```bash
curl -H "Authorization: Bearer TOKEN" http://api.com/endpoint
```

---

**All security layers are now active and production-ready! 🔒**
