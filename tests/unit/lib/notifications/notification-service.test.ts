import { NotificationService } from '@/lib/notifications/notification-service'
import { NotificationChannel, NotificationTemplate, SendNotificationOptions } from '@/types/notifications'

// Mock external services
jest.mock('nodemailer', () => ({
  createTransport: jest.fn(() => ({
    sendMail: jest.fn().mockResolvedValue({ messageId: 'test-email-id' }),
  })),
}))

describe('NotificationService', () => {
  let service: NotificationService
  let mockEmailChannel: NotificationChannel
  let mockSmsChannel: NotificationChannel

  beforeEach(() => {
    mockEmailChannel = {
      id: 'email-channel',
      type: 'email',
      name: 'Email Channel',
      config: {
        smtp: {
          host: 'smtp.test.com',
          port: 587,
          user: 'test@test.com',
          pass: 'password',
        },
      },
      enabled: true,
    }

    mockSmsChannel = {
      id: 'sms-channel',
      type: 'sms',
      name: 'SMS Channel',
      config: {
        twilio: {
          accountSid: 'test-sid',
          authToken: 'test-token',
          phoneNumber: '+1234567890',
        },
      },
      enabled: true,
    }

    service = new NotificationService([mockEmailChannel, mockSmsChannel])
  })

  describe('sendNotification', () => {
    it('should send email notification successfully', async () => {
      const options: SendNotificationOptions = {
        channelId: 'email-channel',
        recipients: ['user@test.com'],
        subject: 'Test Subject',
        content: 'Test Content',
        template: 'default',
        variables: { name: 'John' },
      }

      const result = await service.sendNotification(options)

      expect(result.success).toBe(true)
      expect(result.messageId).toBe('test-email-id')
      expect(result.channel).toBe('email-channel')
    })

    it('should handle notification template rendering', async () => {
      const template: NotificationTemplate = {
        id: 'scan-complete',
        name: 'Scan Complete',
        subject: 'Scan {{scanId}} completed',
        content: 'Hello {{userName}}, your scan {{scanId}} has completed with {{issueCount}} issues.',
        variables: ['scanId', 'userName', 'issueCount'],
      }

      service.addTemplate(template)

      const options: SendNotificationOptions = {
        channelId: 'email-channel',
        recipients: ['user@test.com'],
        template: 'scan-complete',
        variables: {
          scanId: 'scan-123',
          userName: 'John',
          issueCount: '5',
        },
      }

      const result = await service.sendNotification(options)

      expect(result.success).toBe(true)
    })

    it('should fail when channel is not found', async () => {
      const options: SendNotificationOptions = {
        channelId: 'non-existent-channel',
        recipients: ['user@test.com'],
        subject: 'Test',
        content: 'Test Content',
      }

      const result = await service.sendNotification(options)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Channel not found')
    })

    it('should fail when channel is disabled', async () => {
      // Disable the email channel
      service.updateChannel({
        ...mockEmailChannel,
        enabled: false,
      })

      const options: SendNotificationOptions = {
        channelId: 'email-channel',
        recipients: ['user@test.com'],
        subject: 'Test',
        content: 'Test Content',
      }

      const result = await service.sendNotification(options)

      expect(result.success).toBe(false)
      expect(result.error).toContain('disabled')
    })
  })

  describe('sendBulkNotifications', () => {
    it('should send multiple notifications', async () => {
      const notifications: SendNotificationOptions[] = [
        {
          channelId: 'email-channel',
          recipients: ['user1@test.com'],
          subject: 'Test 1',
          content: 'Content 1',
        },
        {
          channelId: 'email-channel',
          recipients: ['user2@test.com'],
          subject: 'Test 2',
          content: 'Content 2',
        },
      ]

      const results = await service.sendBulkNotifications(notifications)

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(true)
    })

    it('should handle partial failures in bulk sending', async () => {
      const notifications: SendNotificationOptions[] = [
        {
          channelId: 'email-channel',
          recipients: ['user1@test.com'],
          subject: 'Test 1',
          content: 'Content 1',
        },
        {
          channelId: 'non-existent-channel',
          recipients: ['user2@test.com'],
          subject: 'Test 2',
          content: 'Content 2',
        },
      ]

      const results = await service.sendBulkNotifications(notifications)

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(false)
    })
  })

  describe('addTemplate', () => {
    it('should add notification template', () => {
      const template: NotificationTemplate = {
        id: 'new-template',
        name: 'New Template',
        subject: 'New Subject',
        content: 'New Content',
        variables: ['var1'],
      }

      service.addTemplate(template)

      const templates = service.getTemplates()
      expect(templates.find(t => t.id === 'new-template')).toBeDefined()
    })
  })

  describe('updateChannel', () => {
    it('should update existing channel', () => {
      const updatedChannel = {
        ...mockEmailChannel,
        name: 'Updated Email Channel',
      }

      service.updateChannel(updatedChannel)

      const channels = service.getChannels()
      const channel = channels.find(c => c.id === 'email-channel')
      expect(channel?.name).toBe('Updated Email Channel')
    })
  })

  describe('getDeliveryStatus', () => {
    it('should return delivery status for sent notification', async () => {
      const options: SendNotificationOptions = {
        channelId: 'email-channel',
        recipients: ['user@test.com'],
        subject: 'Test',
        content: 'Test Content',
      }

      const result = await service.sendNotification(options)
      
      if (result.success && result.messageId) {
        const status = service.getDeliveryStatus(result.messageId)
        expect(status).toBeDefined()
        expect(status?.messageId).toBe(result.messageId)
      }
    })
  })

  describe('getStatistics', () => {
    it('should return notification statistics', async () => {
      // Send some test notifications
      await service.sendNotification({
        channelId: 'email-channel',
        recipients: ['user@test.com'],
        subject: 'Test',
        content: 'Test Content',
      })

      const stats = service.getStatistics()

      expect(stats.totalSent).toBeGreaterThan(0)
      expect(stats.channels).toBeDefined()
    })
  })

  describe('validateChannel', () => {
    it('should validate email channel configuration', () => {
      const result = service.validateChannel(mockEmailChannel)
      expect(result.valid).toBe(true)
    })

    it('should detect invalid channel configuration', () => {
      const invalidChannel = {
        ...mockEmailChannel,
        config: {}, // Invalid config
      }

      const result = service.validateChannel(invalidChannel)
      expect(result.valid).toBe(false)
      expect(result.errors).toHaveLength(1)
    })
  })

  describe('testChannel', () => {
    it('should test channel connectivity', async () => {
      const result = await service.testChannel('email-channel')
      
      expect(result.success).toBe(true)
      expect(result.channelId).toBe('email-channel')
    })

    it('should fail test for non-existent channel', async () => {
      const result = await service.testChannel('non-existent')
      
      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })
  })
})