# Email Setup Guide

## Overview

AppCompatCheck uses SMTP to send emails for authentication events:
- Welcome email after user registration
- Password reset email when requested
- Other transactional notifications

## Email Service Options

### Option 1: Resend (Recommended for Production)

[Resend](https://resend.com) is a modern email API designed for developers.

#### Why Resend?
- ✅ Free tier: 100 emails/day, 3,000/month
- ✅ Simple setup with SMTP
- ✅ Great deliverability
- ✅ Easy to use dashboard
- ✅ Custom domain support

#### Setup Steps

1. **Sign up for Resend**
   - Go to [https://resend.com](https://resend.com)
   - Create a free account

2. **Get Your API Key**
   - Navigate to API Keys in the dashboard
   - Click "Create API Key"
   - Copy the API key (it starts with `re_`)

3. **Update `.env` file**
   ```env
   SMTP_HOST=smtp.resend.com
   SMTP_PORT=465
   SMTP_SECURE=true
   SMTP_USER=resend
   SMTP_PASSWORD=re_your_api_key_here
   EMAIL_FROM=AppCompatCheck <noreply@yourdomain.com>
   NEXT_PUBLIC_APP_URL=https://yourdomain.com
   ```

4. **Verify Domain (Optional but Recommended)**
   - Add your domain in Resend dashboard
   - Add DNS records (SPF, DKIM, DMARC)
   - Verify domain to improve deliverability

### Option 2: Gmail SMTP (Development Only)

⚠️ **Warning**: Gmail SMTP has strict rate limits and is not recommended for production.

#### Setup Steps

1. **Enable 2-Step Verification**
   - Go to Google Account settings
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to [App Passwords](https://myaccount.google.com/apppasswords)
   - Select "Mail" and your device
   - Generate password

3. **Update `.env` file**
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=your.email@gmail.com
   SMTP_PASSWORD=your_16_character_app_password
   EMAIL_FROM=AppCompatCheck <your.email@gmail.com>
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### Option 3: Mailtrap (Development/Testing)

[Mailtrap](https://mailtrap.io) captures emails for testing without sending them to real recipients.

#### Setup Steps

1. **Sign up for Mailtrap**
   - Go to [https://mailtrap.io](https://mailtrap.io)
   - Create a free account

2. **Get SMTP Credentials**
   - Create an inbox
   - Copy SMTP credentials

3. **Update `.env` file**
   ```env
   SMTP_HOST=sandbox.smtp.mailtrap.io
   SMTP_PORT=2525
   SMTP_SECURE=false
   SMTP_USER=your_mailtrap_username
   SMTP_PASSWORD=your_mailtrap_password
   EMAIL_FROM=AppCompatCheck <test@example.com>
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

### Option 4: Ethereal Email (Quick Testing)

[Ethereal Email](https://ethereal.email) creates temporary inboxes for testing.

#### Setup Steps

1. **Generate Credentials**
   - Go to [https://ethereal.email/create](https://ethereal.email/create)
   - Copy the generated credentials

2. **Update `.env` file**
   ```env
   SMTP_HOST=smtp.ethereal.email
   SMTP_PORT=587
   SMTP_SECURE=false
   SMTP_USER=generated_username@ethereal.email
   SMTP_PASSWORD=generated_password
   EMAIL_FROM=AppCompatCheck <test@ethereal.email>
   NEXT_PUBLIC_APP_URL=http://localhost:3000
   ```

3. **View Sent Emails**
   - Ethereal provides a unique URL to view all sent emails
   - Check the Ethereal dashboard for your messages

---

## Configuration Reference

### Environment Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `SMTP_HOST` | SMTP server hostname | `smtp.resend.com` |
| `SMTP_PORT` | SMTP server port | `465` or `587` |
| `SMTP_SECURE` | Use TLS/SSL | `true` for 465, `false` for 587 |
| `SMTP_USER` | SMTP username | `resend` or your email |
| `SMTP_PASSWORD` | SMTP password/API key | Your API key or password |
| `EMAIL_FROM` | Sender email address | `AppCompatCheck <noreply@domain.com>` |
| `NEXT_PUBLIC_APP_URL` | Application base URL | `http://localhost:3000` |

### SMTP Port Reference

- **Port 465**: SMTPS (SMTP over SSL/TLS) - Use `SMTP_SECURE=true`
- **Port 587**: SMTP with STARTTLS - Use `SMTP_SECURE=false`
- **Port 25**: Plain SMTP (usually blocked by ISPs)
- **Port 2525**: Alternative SMTP port (used by Mailtrap)

---

## Testing Email Configuration

### Method 1: Sign Up Test

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Navigate to `/sign-up`

3. Create a new account with a test email

4. Check your email inbox or testing platform for the welcome email

### Method 2: Password Reset Test

1. Navigate to `/forgot-password`

2. Enter your email address

3. Check your inbox for the password reset email

4. Click the reset link and set a new password

### Method 3: Console Logs (Development)

During development, reset links are also logged to the console:

```
Password reset token for user@example.com: abc123...
Reset link: http://localhost:3000/reset-password?token=abc123...
```

You can copy this link directly from the console and test the password reset flow.

---

## Email Templates

### Welcome Email

**Trigger**: User signs up successfully

**Content**:
- Welcome message
- Link to dashboard
- Getting started tips

**Template**: `lib/email.ts` → `welcome` template

### Password Reset Email

**Trigger**: User requests password reset

**Content**:
- Reset password instructions
- One-time reset link (expires in 1 hour)
- Security notice

**Template**: `lib/email.ts` → `password-reset` template

---

## Troubleshooting

### Email Not Sending

**Check 1: SMTP Configuration**
```bash
# Verify environment variables are set
cat .env | grep SMTP
cat .env | grep EMAIL
```

**Check 2: Server Logs**
```bash
# Look for email-related errors
npm run dev
# Check console output for errors
```

**Check 3: Firewall/Network**
- Ensure SMTP ports (465, 587) are not blocked
- Check if your hosting provider allows SMTP

### Email Going to Spam

**Solution 1: Use Custom Domain**
- Verify your domain with your email provider
- Add SPF, DKIM, and DMARC DNS records

**Solution 2: Improve Email Content**
- Avoid spam trigger words
- Use proper HTML structure
- Include unsubscribe link (for marketing emails)

**Solution 3: Use Reputable Email Service**
- Resend, SendGrid, AWS SES have good deliverability
- Shared IP addresses may have poor reputation

### Authentication Errors

**Error**: `Invalid login: 535 Authentication failed`

**Solutions**:
- Double-check SMTP username and password
- For Gmail, ensure you're using an App Password, not your account password
- For Resend, ensure API key starts with `re_`
- Verify 2FA/App Password is enabled if required

### Connection Timeout

**Error**: `connect ETIMEDOUT`

**Solutions**:
- Check if SMTP port is correct (465 or 587)
- Verify firewall is not blocking SMTP
- Try alternative port (587 instead of 465)
- Check if VPN/proxy is interfering

---

## Production Checklist

Before deploying to production:

- [ ] Sign up for production email service (Resend recommended)
- [ ] Get API key/credentials
- [ ] Add and verify custom domain
- [ ] Configure DNS records (SPF, DKIM, DMARC)
- [ ] Update `.env` with production credentials
- [ ] Set `NEXT_PUBLIC_APP_URL` to production URL
- [ ] Test email sending in production environment
- [ ] Set up email monitoring/alerts
- [ ] Configure bounce handling
- [ ] Set up email analytics (optional)

---

## Security Best Practices

1. **Never Commit Credentials**
   - Keep `.env` in `.gitignore`
   - Use environment variables in production

2. **Use API Keys When Possible**
   - Prefer API keys over passwords
   - Rotate keys regularly

3. **Enable Rate Limiting**
   - Prevent email spam/abuse
   - Monitor unusual sending patterns

4. **Implement Email Verification**
   - Verify email addresses on sign-up
   - Send confirmation links

5. **Use Secure Connection**
   - Always use TLS/SSL (SMTP_SECURE=true for port 465)
   - Don't use plain SMTP (port 25)

---

## Advanced Configuration

### Custom Email Templates

Email templates are defined in `lib/email.ts`. To customize:

1. **Edit Existing Template**
   ```typescript
   // lib/email.ts
   const emailTemplates = {
     welcome: {
       subject: 'Welcome to AppCompatCheck!',
       html: (data) => `
         <!-- Your custom HTML -->
       `,
     },
   }
   ```

2. **Add New Template**
   ```typescript
   // Add to EmailTemplate type
   type EmailTemplate = 
     | 'verification'
     | 'password-reset'
     | 'welcome'
     | 'your-new-template'
   
   // Add template configuration
   const emailTemplates = {
     'your-new-template': {
       subject: 'Your Subject',
       html: (data) => `<!-- HTML -->`,
     },
   }
   
   // Create sender function
   export async function sendYourEmail(
     email: string,
     data: any
   ): Promise<boolean> {
     return sendTemplatedEmail(email, 'your-new-template', data)
   }
   ```

### Email Queue (Advanced)

For high-volume email sending, consider implementing a queue:

```typescript
// Using Bull or BullMQ with Redis
import Queue from 'bull'

const emailQueue = new Queue('emails', {
  redis: {
    host: process.env.REDIS_HOST,
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
})

emailQueue.process(async (job) => {
  const { to, template, data } = job.data
  await sendTemplatedEmail(to, template, data)
})

// Add jobs
emailQueue.add({ to: 'user@example.com', template: 'welcome', data })
```

---

## Support & Resources

### Resend Resources
- [Resend Documentation](https://resend.com/docs)
- [Resend API Reference](https://resend.com/docs/api-reference)
- [Resend SMTP Guide](https://resend.com/docs/send-with-smtp)

### Email Best Practices
- [Email Deliverability Guide](https://www.sparkpost.com/resources/email-deliverability/)
- [SPF, DKIM, DMARC Explained](https://www.cloudflare.com/learning/email-security/dmarc-dkim-spf/)

### Debugging Tools
- [MXToolbox](https://mxtoolbox.com/) - Email DNS checker
- [Mail Tester](https://www.mail-tester.com/) - Email spam score checker

---

## FAQ

**Q: Do I need a custom domain for email?**  
A: No, but it's highly recommended for production. Free email services (Gmail, Yahoo) have strict rate limits and may flag automated emails as spam.

**Q: How many emails can I send per day?**  
A: Depends on your provider:
- Resend (free): 3,000/month
- Gmail: ~500/day (not recommended)
- SendGrid (free): 100/day
- AWS SES: Pay-as-you-go

**Q: Are emails sent synchronously or asynchronously?**  
A: In our implementation, emails are sent asynchronously (fire-and-forget) to avoid blocking user actions. Errors are logged but don't prevent sign-up or password reset from completing.

**Q: Can I see email content before sending?**  
A: Yes! Use Mailtrap or Ethereal Email to preview emails without sending them to real recipients.

**Q: What if email sending fails?**  
A: The application will continue to work. Email failures are logged but don't block authentication. Users can still sign up, log in, and reset passwords. The reset link is also logged to the console in development.

---

**Last Updated**: 2025-01-27  
**Version**: 1.0.0
