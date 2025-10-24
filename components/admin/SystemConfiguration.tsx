'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Settings, Database, Mail, Shield, Save, AlertCircle } from 'lucide-react';

export function SystemConfiguration() {
  const [settings, setSettings] = useState({
    // Application Settings
    appName: 'AppCompatCheck',
    appUrl: 'https://appcompatcheck.com',
    maxUploadSize: '100',
    sessionTimeout: '30',
    
    // Email Settings
    smtpHost: 'smtp.gmail.com',
    smtpPort: '587',
    smtpUser: '',
    smtpFrom: 'noreply@appcompatcheck.com',
    
    // Database Settings
    dbBackupEnabled: true,
    dbBackupFrequency: 'daily',
    dbRetentionDays: '30',
    
    // Security Settings
    mfaEnabled: true,
    passwordMinLength: '8',
    passwordExpireDays: '90',
    maxLoginAttempts: '5',
    
    // API Settings
    rateLimitEnabled: true,
    rateLimitPerMinute: '100',
    apiKeyRotationDays: '30',
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleInputChange = (key: string, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Here you would typically make an API call to save settings
      // await fetch('/api/admin/settings', { method: 'POST', body: JSON.stringify(settings) });
      
      setSaveMessage('Settings saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('Error saving settings. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">System Configuration</h2>
          <p className="text-muted-foreground">
            Manage global system settings and configurations
          </p>
        </div>
        <Button onClick={handleSave} disabled={isSaving}>
          <Save className="mr-2 h-4 w-4" />
          {isSaving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      {saveMessage && (
        <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-md flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          {saveMessage}
        </div>
      )}

      {/* Application Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Application Settings
          </CardTitle>
          <CardDescription>
            Configure general application settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="appName">Application Name</Label>
              <Input
                id="appName"
                value={settings.appName}
                onChange={(e) => handleInputChange('appName', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="appUrl">Application URL</Label>
              <Input
                id="appUrl"
                value={settings.appUrl}
                onChange={(e) => handleInputChange('appUrl', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxUploadSize">Max Upload Size (MB)</Label>
              <Input
                id="maxUploadSize"
                type="number"
                value={settings.maxUploadSize}
                onChange={(e) => handleInputChange('maxUploadSize', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
              <Input
                id="sessionTimeout"
                type="number"
                value={settings.sessionTimeout}
                onChange={(e) => handleInputChange('sessionTimeout', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Configuration
          </CardTitle>
          <CardDescription>
            Configure SMTP settings for email notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="smtpHost">SMTP Host</Label>
              <Input
                id="smtpHost"
                value={settings.smtpHost}
                onChange={(e) => handleInputChange('smtpHost', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpPort">SMTP Port</Label>
              <Input
                id="smtpPort"
                type="number"
                value={settings.smtpPort}
                onChange={(e) => handleInputChange('smtpPort', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpUser">SMTP Username</Label>
              <Input
                id="smtpUser"
                value={settings.smtpUser}
                onChange={(e) => handleInputChange('smtpUser', e.target.value)}
                placeholder="email@example.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="smtpFrom">From Email Address</Label>
              <Input
                id="smtpFrom"
                value={settings.smtpFrom}
                onChange={(e) => handleInputChange('smtpFrom', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Database Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Database Configuration
          </CardTitle>
          <CardDescription>
            Configure database backup and maintenance settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="dbBackupEnabled">Automatic Backups</Label>
              <p className="text-sm text-muted-foreground">
                Enable automatic database backups
              </p>
            </div>
            <Switch
              id="dbBackupEnabled"
              checked={settings.dbBackupEnabled}
              onCheckedChange={(checked) => handleInputChange('dbBackupEnabled', checked)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dbBackupFrequency">Backup Frequency</Label>
              <Input
                id="dbBackupFrequency"
                value={settings.dbBackupFrequency}
                onChange={(e) => handleInputChange('dbBackupFrequency', e.target.value)}
                placeholder="daily, weekly, monthly"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dbRetentionDays">Retention Period (days)</Label>
              <Input
                id="dbRetentionDays"
                type="number"
                value={settings.dbRetentionDays}
                onChange={(e) => handleInputChange('dbRetentionDays', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Security Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Security Configuration
          </CardTitle>
          <CardDescription>
            Configure security and authentication settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="mfaEnabled">Multi-Factor Authentication</Label>
              <p className="text-sm text-muted-foreground">
                Require MFA for all users
              </p>
            </div>
            <Switch
              id="mfaEnabled"
              checked={settings.mfaEnabled}
              onCheckedChange={(checked) => handleInputChange('mfaEnabled', checked)}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="passwordMinLength">Minimum Password Length</Label>
              <Input
                id="passwordMinLength"
                type="number"
                value={settings.passwordMinLength}
                onChange={(e) => handleInputChange('passwordMinLength', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="passwordExpireDays">Password Expiration (days)</Label>
              <Input
                id="passwordExpireDays"
                type="number"
                value={settings.passwordExpireDays}
                onChange={(e) => handleInputChange('passwordExpireDays', e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
              <Input
                id="maxLoginAttempts"
                type="number"
                value={settings.maxLoginAttempts}
                onChange={(e) => handleInputChange('maxLoginAttempts', e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="rateLimitEnabled">API Rate Limiting</Label>
              <p className="text-sm text-muted-foreground">
                Enable rate limiting for API requests
              </p>
            </div>
            <Switch
              id="rateLimitEnabled"
              checked={settings.rateLimitEnabled}
              onCheckedChange={(checked) => handleInputChange('rateLimitEnabled', checked)}
            />
          </div>
          {settings.rateLimitEnabled && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="rateLimitPerMinute">Requests Per Minute</Label>
                <Input
                  id="rateLimitPerMinute"
                  type="number"
                  value={settings.rateLimitPerMinute}
                  onChange={(e) => handleInputChange('rateLimitPerMinute', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apiKeyRotationDays">API Key Rotation (days)</Label>
                <Input
                  id="apiKeyRotationDays"
                  type="number"
                  value={settings.apiKeyRotationDays}
                  onChange={(e) => handleInputChange('apiKeyRotationDays', e.target.value)}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
