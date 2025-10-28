# 🔑 How to Get Your FREE Resend API Key

## Step-by-Step Instructions (5 Minutes)

### Step 1: Sign Up at Resend

1. **Open this link**: https://resend.com/signup
2. **Enter your email** (use your Gmail or any email)
3. **Create a password**
4. **Click "Sign Up"**
5. **Check your email** and click the verification link

⏱️ Time: 2 minutes

---

### Step 2: Get Your API Key

1. After logging in, you'll see the **Resend Dashboard**
2. Look for **"API Keys"** in the sidebar (left menu)
3. Click **"API Keys"**
4. Click the **"Create API Key"** button
5. Give it a name: `AppCompatCheck`
6. Click **"Add"** or **"Create"**
7. **COPY THE KEY** that appears (it starts with `re_`)

**Example of what the key looks like:**
```
re_123AbC456DeF789GhI
```

⚠️ **IMPORTANT**: Copy it now! You won't see it again.

⏱️ Time: 2 minutes

---

### Step 3: Add API Key to Your Project

1. **Open your `.env` file** (in the root of your project)
2. **Find this line:**
   ```env
   SMTP_PASSWORD=your_resend_api_key_here
   ```
3. **Replace with your actual key:**
   ```env
   SMTP_PASSWORD=re_123AbC456DeF789GhI
   ```

⏱️ Time: 30 seconds

---

### Step 4: Restart Your Server

In your terminal:

```bash
# Stop the server by pressing: Ctrl+C

# Then restart:
npm run dev
```

⏱️ Time: 30 seconds

---

### Step 5: Test It!

1. Go to: http://localhost:3000/sign-up
2. Create a test account with your **real email**
3. **Check your email inbox** - you should receive a welcome email! 📬

OR

1. Go to: http://localhost:3000/forgot-password
2. Enter your email
3. **Check your email inbox** - you should receive a password reset email! 🔑

⏱️ Time: 1 minute

---

## ✅ Success!

Look for this in your terminal console:

```
Email transporter configured successfully
Email sent successfully: <1234567890@resend.com>
```

If you see that, **emails are working!** 🎉

---

## 🎯 Complete .env Configuration

Your full `.env` should look like this:

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

# Email Configuration
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=resend
SMTP_PASSWORD=re_123AbC456DeF789GhI    ← YOUR REAL KEY HERE!
EMAIL_FROM=AppCompatCheck <noreply@appcompatcheck.com>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 🆘 Troubleshooting

### "I don't see my API key in Resend"

After creating it, it should appear immediately. If not:
1. Refresh the page
2. Look under "API Keys" section
3. Try creating a new one

### "Still getting 535 Authentication failed"

1. **Check you copied the FULL key** (starts with `re_`)
2. **Make sure there are no spaces** before or after the key
3. **Restart the server** (Ctrl+C, then `npm run dev`)
4. **Check the key is valid** in Resend dashboard

### "I lost my API key"

No problem! Just create a new one:
1. Go to Resend dashboard
2. API Keys → Create API Key
3. Delete the old one if needed
4. Use the new key in `.env`

---

## 📸 Visual Guide

### What Resend Dashboard Looks Like:

```
┌─────────────────────────────────────┐
│ 🚀 Resend                           │
├─────────────────────────────────────┤
│ 📊 Dashboard                        │
│ 🔑 API Keys           ← Click here │
│ 📧 Emails                           │
│ 🌐 Domains                          │
│ ⚙️  Settings                        │
└─────────────────────────────────────┘
```

### API Keys Page:

```
┌─────────────────────────────────────┐
│ API Keys                            │
├─────────────────────────────────────┤
│                                     │
│ [+ Create API Key]  ← Click this   │
│                                     │
│ Your API Keys:                      │
│ ┌─────────────────────────────────┐│
│ │ AppCompatCheck                  ││
│ │ re_123AbC456DeF789GhI          ││ ← Copy this!
│ │ Created: Jan 27, 2025           ││
│ └─────────────────────────────────┘│
└─────────────────────────────────────┘
```

---

## ⚡ Quick Checklist

- [ ] Signed up at https://resend.com
- [ ] Verified email
- [ ] Created API key
- [ ] Copied the key (starts with `re_`)
- [ ] Added key to `.env` file
- [ ] Restarted server (`npm run dev`)
- [ ] Tested by signing up or resetting password
- [ ] Received email in inbox! ✅

---

## 🎉 That's It!

Once you complete these steps, you'll receive:
- ✅ Welcome emails when users sign up
- ✅ Password reset emails with links
- ✅ Professional email experience

Total time: **5 minutes** ⏱️

---

**Need help?** Check the console logs for error messages!
