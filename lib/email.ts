import nodemailer from 'nodemailer'
import { generateId } from '@/lib/utils'

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.ethereal.email',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASSWORD,
  },
}

// Create reusable transporter
let transporter: nodemailer.Transporter | null = null

try {
  transporter = nodemailer.createTransport(emailConfig)
} catch (error) {
  console.error('Failed to create email transporter:', error)
}

/**
 * Email template types
 */
type EmailTemplate = 
  | 'verification'
  | 'password-reset'
  | 'welcome'

/**
 * Email template data interface
 */
interface EmailTemplateData {
  [key: string]: any
}

/**
 * Email templates
 */
const emailTemplates: Record<EmailTemplate, { subject: string; html: (data: any) => string }> = {
  verification: {
    subject: 'Verify Your Email Address - AppCompatCheck',
    html: (data: { verificationUrl: string; firstName: string }) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verify Your Email</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #0ea5e9; margin: 0;">AppCompatCheck</h1>
              <p style="color: #666; margin: 10px 0 0 0;">Enterprise Compatibility Analysis Platform</p>
            </div>
            
            <h2 style="color: #333; margin-bottom: 20px;">Welcome, ${data.firstName}!</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
              Thank you for signing up for AppCompatCheck. To complete your registration and start using our platform, please verify your email address by clicking the button below.
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${data.verificationUrl}" 
                 style="display: inline-block; background-color: #0ea5e9; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Verify Email Address
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              If the button doesn't work, you can also copy and paste this link into your browser:
            </p>
            
            <p style="color: #0ea5e9; word-break: break-all; margin-bottom: 30px;">
              ${data.verificationUrl}
            </p>
            
            <div style="border-top: 1px solid #eee; padding-top: 30px; margin-top: 40px;">
              <p style="color: #999; font-size: 14px; line-height: 1.6;">
                This verification link will expire in 24 hours. If you didn't create an account with AppCompatCheck, you can safely ignore this email.
              </p>
              
              <p style="color: #999; font-size: 14px; margin-top: 20px;">
                Best regards,<br>
                The AppCompatCheck Team
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  },
  
  'password-reset': {
    subject: 'Reset Your Password - AppCompatCheck',
    html: (data: { resetUrl: string; firstName: string }) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Reset Your Password</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #0ea5e9; margin: 0;">AppCompatCheck</h1>
              <p style="color: #666; margin: 10px 0 0 0;">Enterprise Compatibility Analysis Platform</p>
            </div>
            
            <h2 style="color: #333; margin-bottom: 20px;">Reset Your Password</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
              Hi ${data.firstName}, we received a request to reset your password for your AppCompatCheck account. Click the button below to create a new password.
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${data.resetUrl}" 
                 style="display: inline-block; background-color: #0ea5e9; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Reset Password
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 20px;">
              If the button doesn't work, you can also copy and paste this link into your browser:
            </p>
            
            <p style="color: #0ea5e9; word-break: break-all; margin-bottom: 30px;">
              ${data.resetUrl}
            </p>
            
            <div style="border-top: 1px solid #eee; padding-top: 30px; margin-top: 40px;">
              <p style="color: #999; font-size: 14px; line-height: 1.6;">
                This password reset link will expire in 1 hour. If you didn't request a password reset, you can safely ignore this email.
              </p>
              
              <p style="color: #999; font-size: 14px; margin-top: 20px;">
                Best regards,<br>
                The AppCompatCheck Team
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  },
  
  welcome: {
    subject: 'Welcome to AppCompatCheck!',
    html: (data: { firstName: string; dashboardUrl: string }) => `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Welcome to AppCompatCheck</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: Arial, sans-serif;">
          <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 40px;">
            <div style="text-align: center; margin-bottom: 40px;">
              <h1 style="color: #0ea5e9; margin: 0;">AppCompatCheck</h1>
              <p style="color: #666; margin: 10px 0 0 0;">Enterprise Compatibility Analysis Platform</p>
            </div>
            
            <h2 style="color: #333; margin-bottom: 20px;">Welcome to AppCompatCheck!</h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 30px;">
              Hi ${data.firstName}, your email has been verified and your account is now active! You can start using AppCompatCheck to analyze your code for compatibility issues, security vulnerabilities, and performance improvements.
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${data.dashboardUrl}" 
                 style="display: inline-block; background-color: #0ea5e9; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold;">
                Go to Dashboard
              </a>
            </div>
            
            <div style="margin: 40px 0;">
              <h3 style="color: #333; margin-bottom: 20px;">What's Next?</h3>
              <ul style="color: #666; line-height: 1.8; padding-left: 20px;">
                <li>Run your first compatibility scan</li>
                <li>Set up integrations with your favorite tools</li>
                <li>Invite team members to collaborate</li>
                <li>Explore our comprehensive reporting features</li>
              </ul>
            </div>
            
            <div style="border-top: 1px solid #eee; padding-top: 30px; margin-top: 40px;">
              <p style="color: #999; font-size: 14px; line-height: 1.6;">
                If you have any questions or need help getting started, don't hesitate to reach out to our support team.
              </p>
              
              <p style="color: #999; font-size: 14px; margin-top: 20px;">
                Best regards,<br>
                The AppCompatCheck Team
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  },
}

/**
 * Send email using the configured transporter
 */
async function sendEmail(
  to: string | string[],
  subject: string,
  html: string,
  text?: string
): Promise<boolean> {
  if (!transporter) {
    console.error('Email transporter not configured')
    return false
  }

  try {
    const from = process.env.EMAIL_FROM || 'noreply@appcompatcheck.com'
    
    const mailOptions = {
      from,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip HTML for text version
      messageId: generateId(32) + '@appcompatcheck.com',
    }

    const info = await transporter.sendMail(mailOptions)
    console.log('Email sent successfully:', info.messageId)
    return true
  } catch (error) {
    console.error('Failed to send email:', error)
    return false
  }
}

/**
 * Send templated email
 */
async function sendTemplatedEmail(
  to: string | string[],
  template: EmailTemplate,
  data: EmailTemplateData
): Promise<boolean> {
  const templateConfig = emailTemplates[template]
  
  if (!templateConfig) {
    console.error(`Email template '${template}' not found`)
    return false
  }

  const subject = templateConfig.subject
  const html = templateConfig.html(data)

  return sendEmail(to, subject, html)
}

/**
 * Send verification email
 */
export async function sendVerificationEmail(
  email: string,
  verificationToken: string
): Promise<boolean> {
  const verificationUrl = `${process.env.NEXT_PUBLIC_APP_URL}/auth/verify-email?token=${verificationToken}`
  
  return sendTemplatedEmail(email, 'verification', {
    verificationUrl,
    firstName: 'User', // You might want to pass this as a parameter
  })
}

/**
 * Send password reset email
 */
export async function sendPasswordResetEmail(
  email: string,
  firstName: string,
  resetToken: string
): Promise<boolean> {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${resetToken}`
  
  return sendTemplatedEmail(email, 'password-reset', {
    resetUrl,
    firstName,
  })
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(
  email: string,
  firstName: string
): Promise<boolean> {
  const dashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`
  
  return sendTemplatedEmail(email, 'welcome', {
    firstName,
    dashboardUrl,
  })
}

/**
 * Send scan completion notification
 */
export async function sendScanCompleteEmail(
  email: string,
  scanName: string,
  scanUrl: string,
  results: any
): Promise<boolean> {
  const subject = `Scan Complete: ${scanName} - AppCompatCheck`
  const html = `
    <h2>Scan Complete</h2>
    <p>Your scan "${scanName}" has completed successfully.</p>
    <p><a href="${scanUrl}">View Results</a></p>
    <p>Summary: ${results.issuesFound || 0} issues found</p>
  `
  
  return sendEmail(email, subject, html)
}

/**
 * Verify email configuration
 */
export async function verifyEmailConfig(): Promise<boolean> {
  if (!transporter) {
    return false
  }

  try {
    await transporter.verify()
    console.log('Email configuration verified successfully')
    return true
  } catch (error) {
    console.error('Email configuration verification failed:', error)
    return false
  }
}

/**
 * Health check for email service
 */
export async function checkEmailHealth(): Promise<{
  healthy: boolean
  configured: boolean
  verified: boolean
}> {
  const configured = !!transporter
  let verified = false

  if (configured) {
    try {
      await transporter!.verify()
      verified = true
    } catch (error) {
      console.error('Email health check failed:', error)
    }
  }

  return {
    healthy: configured && verified,
    configured,
    verified,
  }
}