# Quick Start: Email Setup for Authentication

## 🚀 Get Email Working in 5 Minutes

### Step 1: Choose Your Email Service

For testing and development, we recommend **Resend** (free tier: 3,000 emails/month).

### Step 2: Sign Up for Resend

1. Go to [https://resend.com](https://resend.com)
2. Click "Get Started" or "Sign Up"
3. Create your account (free, no credit card required)

### Step 3: Get Your API Key

1. Once logged in, go to **API Keys** in the dashboard
2. Click **"Create API Key"**
3. Give it a name (e.g., "AppCompatCheck Development")
4. Click **"Create"**
5. **Copy the API key** (it starts with `re_`)
   - ⚠️ Important: Copy it now! You won't be able to see it again

### Step 4: Update Your `.env` File

Open your `.env` file and add these lines (if not already present):

```env
# Email Configuration
SMTP_HOST=smtp.resend.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=resend
SMTP_PASSWORD=re_your_api_key_paste_here
EMAIL_FROM=AppCompatCheck <noreply@yourdomain.com>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

**Replace**:
- `re_your_api_key_paste_here` with your actual Resend API key
- `noreply@yourdomain.com` with any email address (for testing, it can be anything)

### Step 5: Restart Your Development Server

```bash
# Stop the server (Ctrl+C if running)
npm run dev
```

### Step 6: Test It!

#### Test Sign-Up Email

1. Go to [http://localhost:3000/sign-up](http://localhost:3000/sign-up)
2. Enter a test email address
3. Create an account
4. Check your email inbox for the welcome email!

#### Test Password Reset Email

1. Go to [http://localhost:3000/forgot-password](http://localhost:3000/forgot-password)
2. Enter your email address
3. Click "Send Reset Link"
4. Check your email inbox for the password reset email!

---

## ✅ Success Checklist

- [ ] Signed up for Resend
- [ ] Got API key (starts with `re_`)
- [ ] Added API key to `.env` file
- [ ] Restarted development server
- [ ] Tested sign-up (received welcome email)
- [ ] Tested password reset (received reset email)

---

## 🔍 Troubleshooting

### "Email transporter not configured"

**Solution**: Make sure all SMTP environment variables are set in your `.env` file and restart the server.

### Not Receiving Emails

**Check 1**: Look at the server console logs. Reset links are also logged there for development:
```
Password reset token for user@example.com: abc123...
Reset link: http://localhost:3000/reset-password?token=abc123...
```

**Check 2**: Check your spam/junk folder

**Check 3**: Verify your API key is correct in `.env`

**Check 4**: Make sure you've added a domain in Resend (for production)

### Using Gmail Instead

If you prefer Gmail for testing:

1. Enable 2-Step Verification in your Google Account
2. Generate an App Password at [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Update `.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your.email@gmail.com
   SMTP_PASSWORD=your_16_character_app_password
   EMAIL_FROM=AppCompatCheck <your.email@gmail.com>
   ```

⚠️ **Note**: Gmail has strict rate limits (500 emails/day) and is not recommended for production.

---

## 📧 Email Features

### Welcome Email
- **Sent when**: User signs up successfully
- **Contains**: Welcome message and link to dashboard
- **Template**: Beautiful HTML email with your branding

### Password Reset Email
- **Sent when**: User requests password reset
- **Contains**: Secure one-time reset link
- **Expires**: After 1 hour for security
- **Template**: Professional HTML email

---

## 🎓 Advanced Configuration

For more advanced setup options, including:
- Custom domain configuration
- Other email services (Mailtrap, Ethereal, SendGrid)
- Email templates customization
- Production deployment tips
- DNS configuration (SPF, DKIM, DMARC)

See the complete guides:
- [EMAIL_SETUP.md](./EMAIL_SETUP.md) - Comprehensive email setup guide
- [AUTHENTICATION.md](./AUTHENTICATION.md) - Authentication system documentation

---

## 🆘 Need Help?

1. **Check the Console**: Server logs show email-related errors and reset links
2. **Read Full Docs**: [EMAIL_SETUP.md](./EMAIL_SETUP.md) has detailed troubleshooting
3. **GitHub Issues**: Open an issue if you're stuck
4. **Resend Support**: [Resend documentation](https://resend.com/docs)

---

## 🎉 You're All Set!

Your application now sends:
- ✅ Welcome emails when users sign up
- ✅ Password reset emails with secure links
- ✅ Professional HTML email templates

**Next Steps**:
- Customize email templates in `lib/email.ts`
- Add your custom domain to Resend (for production)
- Test with real users!

---

**Last Updated**: 2025-01-27
