export interface EmailTemplateData {
  user: {
    name: string;
    email: string;
  };
  organization?: {
    name: string;
  };
  data?: Record<string, any>;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

export class EmailTemplateEngine {
  private static interpolate(template: string, data: EmailTemplateData): string {
    return template.replace(/\{\{([^}]+)\}\}/g, (match, key) => {
      const keys = key.trim().split('.');
      let value: any = data;
      
      for (const k of keys) {
        value = value?.[k];
      }
      
      return value ?? match;
    });
  }

  static render(templateName: string, data: EmailTemplateData): EmailTemplate {
    const template = EMAIL_TEMPLATES[templateName];
    if (!template) {
      throw new Error(`Email template '${templateName}' not found`);
    }

    return {
      subject: this.interpolate(template.subject, data),
      html: this.interpolate(template.html, data),
      text: this.interpolate(template.text, data),
    };
  }

  static getAvailableTemplates(): string[] {
    return Object.keys(EMAIL_TEMPLATES);
  }
}

const EMAIL_TEMPLATES: Record<string, EmailTemplate> = {
  scan_completed: {
    subject: 'Security Scan Completed - {{data.scanName}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">AppCompatCheck</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Security Analysis Platform</p>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">🎉 Scan Completed Successfully</h2>
          
          <p>Hi {{user.name}},</p>
          
          <p>Your security scan "<strong>{{data.scanName}}</strong>" has been completed successfully.</p>
          
          <div style="background: #f8f9fa; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px 0; color: #155724;">Scan Results Summary</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Total Files Scanned:</strong> {{data.totalFiles}}</li>
              <li><strong>Vulnerabilities Found:</strong> {{data.vulnerabilitiesCount}}</li>
              <li><strong>Critical Issues:</strong> {{data.criticalCount}}</li>
              <li><strong>High Priority Issues:</strong> {{data.highCount}}</li>
            </ul>
          </div>
          
          <p>You can view the detailed report and take action on any identified issues.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{data.reportUrl}}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Full Report</a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            This scan was performed on {{data.completedAt}} and took {{data.duration}} to complete.
          </p>
        </div>
        
        <div style="background: #f1f3f4; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p>© 2024 AppCompatCheck. All rights reserved.</p>
          <p>
            <a href="{{data.unsubscribeUrl}}" style="color: #666;">Unsubscribe</a> | 
            <a href="{{data.preferencesUrl}}" style="color: #666;">Manage Preferences</a>
          </p>
        </div>
      </div>
    `,
    text: `
AppCompatCheck - Scan Completed

Hi {{user.name}},

Your security scan "{{data.scanName}}" has been completed successfully.

Scan Results Summary:
- Total Files Scanned: {{data.totalFiles}}
- Vulnerabilities Found: {{data.vulnerabilitiesCount}}
- Critical Issues: {{data.criticalCount}}
- High Priority Issues: {{data.highCount}}

View your full report: {{data.reportUrl}}

This scan was performed on {{data.completedAt}} and took {{data.duration}} to complete.

---
© 2024 AppCompatCheck. All rights reserved.
Unsubscribe: {{data.unsubscribeUrl}}
Manage Preferences: {{data.preferencesUrl}}
    `,
  },

  vulnerability_detected: {
    subject: '🚨 Critical Vulnerability Detected - {{data.vulnerabilityType}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #dc3545 0%, #c82333 100%); color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">🚨 Security Alert</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">AppCompatCheck</p>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #dc3545; margin-bottom: 20px;">Critical Vulnerability Detected</h2>
          
          <p>Hi {{user.name}},</p>
          
          <p>We've detected a <strong>{{data.severity}}</strong> severity vulnerability in your application that requires immediate attention.</p>
          
          <div style="background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #721c24;">Vulnerability Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 5px 10px 5px 0; font-weight: bold; color: #721c24;">Type:</td>
                <td style="padding: 5px 0;">{{data.vulnerabilityType}}</td>
              </tr>
              <tr>
                <td style="padding: 5px 10px 5px 0; font-weight: bold; color: #721c24;">File:</td>
                <td style="padding: 5px 0;">{{data.fileName}}</td>
              </tr>
              <tr>
                <td style="padding: 5px 10px 5px 0; font-weight: bold; color: #721c24;">Line:</td>
                <td style="padding: 5px 0;">{{data.lineNumber}}</td>
              </tr>
              <tr>
                <td style="padding: 5px 10px 5px 0; font-weight: bold; color: #721c24;">CVSS Score:</td>
                <td style="padding: 5px 0;"><strong>{{data.cvssScore}}</strong></td>
              </tr>
            </table>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #856404;">Description</h4>
            <p style="margin: 0; color: #856404;">{{data.description}}</p>
          </div>
          
          <div style="background: #d1ecf1; border: 1px solid #bee5eb; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #0c5460;">Recommended Action</h4>
            <p style="margin: 0; color: #0c5460;">{{data.recommendation}}</p>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{data.vulnerabilityUrl}}" style="display: inline-block; background: #dc3545; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">View Vulnerability Details</a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            This vulnerability was detected on {{data.detectedAt}} during scan "{{data.scanName}}".
          </p>
        </div>
        
        <div style="background: #f1f3f4; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p>© 2024 AppCompatCheck. All rights reserved.</p>
          <p>
            <a href="{{data.unsubscribeUrl}}" style="color: #666;">Unsubscribe</a> | 
            <a href="{{data.preferencesUrl}}" style="color: #666;">Manage Preferences</a>
          </p>
        </div>
      </div>
    `,
    text: `
🚨 SECURITY ALERT - AppCompatCheck

Hi {{user.name}},

CRITICAL VULNERABILITY DETECTED

We've detected a {{data.severity}} severity vulnerability in your application that requires immediate attention.

Vulnerability Details:
- Type: {{data.vulnerabilityType}}
- File: {{data.fileName}}
- Line: {{data.lineNumber}}
- CVSS Score: {{data.cvssScore}}

Description: {{data.description}}

Recommended Action: {{data.recommendation}}

View details: {{data.vulnerabilityUrl}}

This vulnerability was detected on {{data.detectedAt}} during scan "{{data.scanName}}".

---
© 2024 AppCompatCheck. All rights reserved.
Unsubscribe: {{data.unsubscribeUrl}}
Manage Preferences: {{data.preferencesUrl}}
    `,
  },

  report_generated: {
    subject: '📊 Security Report Generated - {{data.reportName}}',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #28a745 0%, #20c997 100%); color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">📊 Report Ready</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">AppCompatCheck</p>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">Your Security Report is Ready</h2>
          
          <p>Hi {{user.name}},</p>
          
          <p>Your security report "<strong>{{data.reportName}}</strong>" has been generated and is ready for download.</p>
          
          <div style="background: #d4edda; border: 1px solid #c3e6cb; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #155724;">Report Summary</h3>
            <ul style="margin: 0; padding-left: 20px; color: #155724;">
              <li><strong>Report Type:</strong> {{data.reportType}}</li>
              <li><strong>Date Range:</strong> {{data.dateRange}}</li>
              <li><strong>Total Scans:</strong> {{data.totalScans}}</li>
              <li><strong>File Size:</strong> {{data.fileSize}}</li>
            </ul>
          </div>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{data.downloadUrl}}" style="display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 0 10px 10px 0;">Download PDF</a>
            <a href="{{data.csvUrl}}" style="display: inline-block; background: #17a2b8; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 0 10px 10px 0;">Download CSV</a>
          </div>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>Note:</strong> This report will be available for download for 30 days. After that, you'll need to generate a new report.
            </p>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            Report generated on {{data.generatedAt}} and includes data from {{data.dataSource}}.
          </p>
        </div>
        
        <div style="background: #f1f3f4; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p>© 2024 AppCompatCheck. All rights reserved.</p>
          <p>
            <a href="{{data.unsubscribeUrl}}" style="color: #666;">Unsubscribe</a> | 
            <a href="{{data.preferencesUrl}}" style="color: #666;">Manage Preferences</a>
          </p>
        </div>
      </div>
    `,
    text: `
AppCompatCheck - Report Generated

Hi {{user.name}},

Your security report "{{data.reportName}}" has been generated and is ready for download.

Report Summary:
- Report Type: {{data.reportType}}
- Date Range: {{data.dateRange}}
- Total Scans: {{data.totalScans}}
- File Size: {{data.fileSize}}

Download Links:
- PDF: {{data.downloadUrl}}
- CSV: {{data.csvUrl}}

Note: This report will be available for download for 30 days.

Report generated on {{data.generatedAt}} and includes data from {{data.dataSource}}.

---
© 2024 AppCompatCheck. All rights reserved.
Unsubscribe: {{data.unsubscribeUrl}}
Manage Preferences: {{data.preferencesUrl}}
    `,
  },

  team_invitation: {
    subject: 'Team Invitation - Join {{organization.name}} on AppCompatCheck',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #6f42c1 0%, #6610f2 100%); color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">🤝 Team Invitation</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">AppCompatCheck</p>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">You're Invited to Join a Team</h2>
          
          <p>Hi {{user.name}},</p>
          
          <p><strong>{{data.invitedBy}}</strong> has invited you to join the <strong>{{organization.name}}</strong> team on AppCompatCheck.</p>
          
          <div style="background: #e7e3ff; border: 1px solid #d1c4e9; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px 0; color: #4527a0;">Invitation Details</h3>
            <ul style="margin: 0; padding-left: 20px; color: #4527a0;">
              <li><strong>Organization:</strong> {{organization.name}}</li>
              <li><strong>Role:</strong> {{data.role}}</li>
              <li><strong>Invited by:</strong> {{data.invitedBy}}</li>
              <li><strong>Invitation expires:</strong> {{data.expiresAt}}</li>
            </ul>
          </div>
          
          {{#if data.message}}
          <div style="background: #f8f9fa; border-left: 4px solid #6f42c1; padding: 15px; margin: 20px 0;">
            <h4 style="margin: 0 0 10px 0; color: #4527a0;">Personal Message</h4>
            <p style="margin: 0; color: #666; font-style: italic;">"{{data.message}}"</p>
          </div>
          {{/if}}
          
          <p>As a team member, you'll be able to:</p>
          <ul style="color: #666;">
            <li>Access shared security scans and reports</li>
            <li>Collaborate on vulnerability assessments</li>
            <li>View team analytics and insights</li>
            <li>Participate in security workflows</li>
          </ul>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{data.acceptUrl}}" style="display: inline-block; background: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 0 10px 10px 0;">Accept Invitation</a>
            <a href="{{data.declineUrl}}" style="display: inline-block; background: #6c757d; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 0 10px 10px 0;">Decline</a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            This invitation was sent on {{data.sentAt}} and will expire on {{data.expiresAt}}.
          </p>
        </div>
        
        <div style="background: #f1f3f4; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p>© 2024 AppCompatCheck. All rights reserved.</p>
          <p>If you didn't expect this invitation, you can safely ignore this email.</p>
        </div>
      </div>
    `,
    text: `
AppCompatCheck - Team Invitation

Hi {{user.name}},

{{data.invitedBy}} has invited you to join the {{organization.name}} team on AppCompatCheck.

Invitation Details:
- Organization: {{organization.name}}
- Role: {{data.role}}
- Invited by: {{data.invitedBy}}
- Invitation expires: {{data.expiresAt}}

{{#if data.message}}
Personal Message: "{{data.message}}"
{{/if}}

As a team member, you'll be able to:
- Access shared security scans and reports
- Collaborate on vulnerability assessments
- View team analytics and insights
- Participate in security workflows

Accept: {{data.acceptUrl}}
Decline: {{data.declineUrl}}

This invitation was sent on {{data.sentAt}} and will expire on {{data.expiresAt}}.

---
© 2024 AppCompatCheck. All rights reserved.
If you didn't expect this invitation, you can safely ignore this email.
    `,
  },

  password_reset: {
    subject: 'Password Reset Request - AppCompatCheck',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #ffc107 0%, #ff8f00 100%); color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">🔐 Password Reset</h1>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">AppCompatCheck</p>
        </div>
        
        <div style="padding: 30px 20px;">
          <h2 style="color: #333; margin-bottom: 20px;">Password Reset Request</h2>
          
          <p>Hi {{user.name}},</p>
          
          <p>We received a request to reset your password for your AppCompatCheck account.</p>
          
          <div style="background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0;">
            <p style="margin: 0; color: #856404;">
              <strong>Security Notice:</strong> If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
            </p>
          </div>
          
          <p>To reset your password, click the button below:</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="{{data.resetUrl}}" style="display: inline-block; background: #ffc107; color: #212529; padding: 12px 30px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset Password</a>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            This link will expire in {{data.expiresIn}} for security reasons.
          </p>
          
          <p style="color: #666; font-size: 14px;">
            If the button doesn't work, copy and paste this link into your browser:<br>
            <a href="{{data.resetUrl}}" style="color: #007bff;">{{data.resetUrl}}</a>
          </p>
        </div>
        
        <div style="background: #f1f3f4; padding: 20px; text-align: center; font-size: 12px; color: #666;">
          <p>© 2024 AppCompatCheck. All rights reserved.</p>
          <p>For security questions, contact our support team.</p>
        </div>
      </div>
    `,
    text: `
AppCompatCheck - Password Reset Request

Hi {{user.name}},

We received a request to reset your password for your AppCompatCheck account.

Security Notice: If you didn't request this password reset, please ignore this email. Your password will remain unchanged.

To reset your password, visit this link:
{{data.resetUrl}}

This link will expire in {{data.expiresIn}} for security reasons.

---
© 2024 AppCompatCheck. All rights reserved.
For security questions, contact our support team.
    `,
  },
};

export { EMAIL_TEMPLATES };