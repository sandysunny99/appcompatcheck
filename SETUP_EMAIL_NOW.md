# 📧 Set Up Email in 5 Minutes

## Why No Emails?

Your `.env` file has placeholder credentials:
```env
SMTP_PASSWORD=your_resend_api_key_here  # ← This is not a real API key!
```

You need to replace this with a **real API key** from an email service.

---

## ⚡ Quick Setup with Resend (FREE)

### Step 1: Sign Up (1 minute)

1. Go to: **https://resend.com/signup**
2. Sign up with your email (free account, no credit card)
3. Verify your email

### Step 2: Get API Key (1 minute)

1. After logging in, go to **API Keys** tab
2. Click **"Create API Key"**
3. Name it: `AppCompatCheck`
4. Click **"Add"**
5. **Copy the key** (starts with `re_`)
   
   Example: `re_123abc456def789ghi`

### Step 3: Update .env File (1 minute)

1. Open your `.env` file
2. Find this line:
   ```env
   SMTP_PASSWORD=your_resend_api_key_here
   ```
3. Replace with your actual key:
   ```env
   SMTP_PASSWORD=re_123abc456def789ghi
   ```

### Step 4: Restart Server (1 minute)

```bash
# Stop the server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 5: Test It! (1 minute)

1. Go to `/forgot-password`
2. Enter your email
3. **Check your inbox!** 📬

---

## 🎯 Complete .env Configuration

Your `.env` file should look like this:

```env
# Database (already configured)
POSTGRES_URL=postgresql://postgres:OuVGhVpr@127.0.0.1:5432/appcompatcheck
DATABASE_URL=postgresql://postgres:OuVGhVpr@127.0.0.1:5432/appcompatcheck
BASE_URL=http://localhost:3000
AUTH_SECRET=78a1f071ea7909313a5d157e953c87f314a748ca3641ab67403a49ee79f4885f

# Redis (already configured)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_PASSWORD=NwMPEmkj

# Email Configuration (NEEDS YOUR API KEY!)
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=resend
SMTP_PASSWORD=re_YOUR_ACTUAL_API_KEY_HERE    ← Replace this!
EMAIL_FROM=AppCompatCheck <noreply@appcompatcheck.com>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## ✅ How to Verify It's Working

After restarting the server, look for this in the console:

### ✅ GOOD (Email Working):
```
Email transporter configured successfully
Email sent successfully: <message-id>
```

### ❌ BAD (Email Not Configured):
```
Failed to send email: Authentication failed
```

---

## 🔥 Current Status

**Right now**: 
- ✅ Authentication works perfectly
- ✅ Password reset generates links
- ✅ Links are in console (you can copy them)
- ❌ No emails sent (need API key)

**After setup**:
- ✅ Everything above PLUS
- ✅ Welcome emails on sign-up
- ✅ Password reset emails to inbox

---

## 🆘 Alternative: Use Console Links

**Don't want to set up email yet?** No problem!

1. Request password reset
2. Check the **terminal console**
3. Look for lines like:
   ```
   Reset link: http://localhost:3000/reset-password?token=abc123...
   ```
4. **Copy that link** and paste in browser
5. Reset your password!

**This works perfectly** - email is just for convenience!

---

## 💡 Why Resend?

- ✅ **Free**: 3,000 emails/month
- ✅ **Easy**: Just one API key
- ✅ **Fast**: Setup in 5 minutes
- ✅ **Reliable**: Great deliverability
- ✅ **No credit card**: Free forever

---

## 📱 Alternative Services

If you don't want Resend:

### Gmail (Quick but Limited)
1. Enable 2-step verification
2. Generate app password
3. Use in `.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your.email@gmail.com
   SMTP_PASSWORD=your_app_password
   ```

⚠️ **Limit**: 500 emails/day only

### Mailtrap (Testing Only)
Perfect for testing - emails don't actually send, but you can see them in Mailtrap dashboard.

1. Sign up at https://mailtrap.io
2. Get credentials
3. Update `.env`

See full guide: `docs/EMAIL_SETUP.md`

---

## 🎯 Summary

**To receive emails**:
1. Sign up at https://resend.com (free, 2 minutes)
2. Get API key
3. Put in `.env` file
4. Restart server
5. Done! 🎉

**To use without email**:
- Just use the console links (already working!)

---

**Need Help?** Check:
- `docs/QUICK_START_EMAIL.md` - Detailed guide
- `docs/EMAIL_SETUP.md` - Full documentation
- Console logs - Always shows reset links!
