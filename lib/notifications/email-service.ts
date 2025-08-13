export interface EmailData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export interface EmailOptions {
  from?: string;
  replyTo?: string;
  cc?: string[];
  bcc?: string[];
}

// Email service for sending notifications
export class EmailService {
  
  // Send email using template
  async sendEmail(emailData: EmailData, options: EmailOptions = {}): Promise<void> {
    try {
      // In a real implementation, this would use a service like:
      // - SendGrid
      // - AWS SES
      // - Mailgun
      // - Resend
      // - Nodemailer with SMTP
      
      console.log('📧 Email would be sent:', {
        to: emailData.to,
        subject: emailData.subject,
        template: emailData.template,
        data: emailData.data,
        options,
      });

      // For development, we'll just log the email content
      if (process.env.NODE_ENV === 'development') {
        this.logEmailContent(emailData);
      }

      // In production, implement actual email sending here
      if (process.env.NODE_ENV === 'production') {
        await this.sendProductionEmail(emailData, options);
      }

    } catch (error) {
      console.error('Failed to send email:', error);
      throw error;
    }
  }

  // Log email content for development
  private logEmailContent(emailData: EmailData): void {
    console.log('\n' + '='.repeat(50));
    console.log('📧 EMAIL PREVIEW');
    console.log('='.repeat(50));
    console.log(`To: ${emailData.to}`);
    console.log(`Subject: ${emailData.subject}`);
    console.log(`Template: ${emailData.template}`);
    console.log('Data:', JSON.stringify(emailData.data, null, 2));
    
    // Generate email content based on template
    const content = this.generateEmailContent(emailData.template, emailData.data);
    console.log('\nContent:');
    console.log(content);
    console.log('='.repeat(50) + '\n');
  }

  // Generate email content from template
  private generateEmailContent(template: string, data: Record<string, any>): string {
    switch (template) {
      case 'organization-invitation':
        return this.generateInvitationEmail(data);
      case 'welcome':
        return this.generateWelcomeEmail(data);
      case 'password-reset':
        return this.generatePasswordResetEmail(data);
      case 'scan-completed':
        return this.generateScanCompletedEmail(data);
      default:
        return `Email template "${template}" not found. Data: ${JSON.stringify(data)}`;
    }
  }

  // Generate organization invitation email
  private generateInvitationEmail(data: Record<string, any>): string {
    return `
Subject: Invitation to join ${data.organizationName}

Hello!

You've been invited to join ${data.organizationName} as a ${data.role}.

Click the link below to accept your invitation:
${data.inviteUrl}

This invitation will expire on ${data.expiresAt}.

If you didn't expect this invitation, you can safely ignore this email.

Best regards,
The AppCompatCheck Team
    `.trim();
  }

  // Generate welcome email
  private generateWelcomeEmail(data: Record<string, any>): string {
    return `
Subject: Welcome to AppCompatCheck!

Hello ${data.name}!

Welcome to AppCompatCheck! We're excited to have you on board.

You can get started by:
1. Uploading your first security log or compatibility data
2. Running your first compatibility analysis
3. Generating your first report

If you have any questions, feel free to reach out to our support team.

Best regards,
The AppCompatCheck Team
    `.trim();
  }

  // Generate password reset email
  private generatePasswordResetEmail(data: Record<string, any>): string {
    return `
Subject: Reset your AppCompatCheck password

Hello!

You requested to reset your password for AppCompatCheck.

Click the link below to reset your password:
${data.resetUrl}

This link will expire in ${data.expirationTime}.

If you didn't request this reset, you can safely ignore this email.

Best regards,
The AppCompatCheck Team
    `.trim();
  }

  // Generate scan completed email
  private generateScanCompletedEmail(data: Record<string, any>): string {
    return `
Subject: Your compatibility scan is complete

Hello ${data.userName}!

Your compatibility scan "${data.scanName}" has completed successfully.

Results summary:
- Total checks: ${data.totalChecks}
- Failed checks: ${data.failedChecks}
- Risk score: ${data.riskScore}/100

You can view the full report at: ${data.reportUrl}

Best regards,
The AppCompatCheck Team
    `.trim();
  }

  // Send production email (implement with your preferred service)
  private async sendProductionEmail(emailData: EmailData, options: EmailOptions): Promise<void> {
    // Example implementation with a hypothetical email service
    /*
    const emailProvider = new EmailProvider({
      apiKey: process.env.EMAIL_API_KEY,
    });

    await emailProvider.send({
      to: emailData.to,
      from: options.from || process.env.DEFAULT_FROM_EMAIL,
      subject: emailData.subject,
      html: this.generateEmailContent(emailData.template, emailData.data),
      ...options,
    });
    */

    // For now, just throw an error to indicate it's not implemented
    throw new Error('Production email sending not implemented. Please configure an email service.');
  }

  // Send bulk emails
  async sendBulkEmails(emails: EmailData[], options: EmailOptions = {}): Promise<void> {
    const promises = emails.map(email => this.sendEmail(email, options));
    await Promise.all(promises);
  }

  // Send notification email
  async sendNotification(
    to: string,
    type: 'scan_completed' | 'scan_failed' | 'invitation' | 'welcome' | 'password_reset',
    data: Record<string, any>
  ): Promise<void> {
    const subjects = {
      scan_completed: 'Your compatibility scan is complete',
      scan_failed: 'Your compatibility scan failed',
      invitation: `Invitation to join ${data.organizationName}`,
      welcome: 'Welcome to AppCompatCheck!',
      password_reset: 'Reset your AppCompatCheck password',
    };

    const templates = {
      scan_completed: 'scan-completed',
      scan_failed: 'scan-failed',
      invitation: 'organization-invitation',
      welcome: 'welcome',
      password_reset: 'password-reset',
    };

    await this.sendEmail({
      to,
      subject: subjects[type],
      template: templates[type],
      data,
    });
  }
}

// Export singleton instance
export const emailService = new EmailService();

// Export the sendEmail function for convenience
export const sendEmail = (emailData: EmailData, options: EmailOptions = {}) => 
  emailService.sendEmail(emailData, options);