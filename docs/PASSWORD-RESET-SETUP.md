# Password Reset Setup Guide

## ✅ What's Been Added:

1. **Forgot Password Page** - `/forgot-password`
2. **Reset Password Page** - `/reset-password`
3. **Server Actions** - `resetPassword()` and `updatePassword()`
4. **"Forgot password?" Link** - Added to login page

---

## 🔧 Setup Required:

### Step 1: Verify Environment Variable

Make sure your `.env.local` has:
```bash
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Step 2: Configure Supabase Password Reset Email

1. Go to Supabase Dashboard
2. Navigate to: **Authentication** → **Email Templates**
3. Find **"Change Email Address"** or **"Reset Password"** template
4. Verify the template includes `{{ .ConfirmationURL }}` or similar
5. The default template should work fine!

---

## 🧪 How to Test:

### Test Flow:

1. **Go to login page**: http://localhost:3000/login
2. **Click "Forgot password?"**
3. **Enter your email**: Enter a registered email address
4. **Click "Send Reset Link"**
5. **Check your email inbox**: Look for password reset email
6. **Click the reset link**: Opens `/reset-password` page
7. **Enter new password**: Type new password twice
8. **Click "Update Password"**: Redirects to dashboard
9. **Sign out and test**: Try logging in with new password

---

## 📧 Email Template (Optional Customization):

In Supabase → Authentication → Email Templates → Reset Password:

```html
<h2>Reset Your Password</h2>
<p>Hi there,</p>
<p>You requested to reset your password for Cortex.</p>
<p>Click the link below to set a new password:</p>
<p><a href="{{ .ConfirmationURL }}">Reset Password</a></p>
<p>If you didn't request this, you can safely ignore this email.</p>
<p>This link expires in 1 hour.</p>
```

---

## 🔒 Security Features:

- ✅ Reset links expire after 1 hour
- ✅ Password must be 6+ characters
- ✅ Password confirmation required
- ✅ One-time use links (can't reuse)
- ✅ Email verification required

---

## 📝 Error Messages:

- "Passwords do not match" - Confirm password doesn't match
- "Password must be at least 6 characters" - Too short
- "Password reset link sent!" - Success message

---

## 🎯 User Flow:

```
Login Page
    ↓ (Click "Forgot password?")
Forgot Password Page
    ↓ (Enter email, submit)
Email Sent (Check inbox)
    ↓ (Click reset link in email)
Reset Password Page
    ↓ (Enter new password twice)
Dashboard (Logged in)
```

