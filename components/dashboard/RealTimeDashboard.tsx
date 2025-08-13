'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  FileText, 
  Shield, 
  TrendingUp, 
  Users,
  X,
  Bell,
  BellOff
} from 'lucide-react';
import { useDashboardUpdates } from '@/lib/websocket/useWebSocket';
import { formatDistanceToNow } from 'date-fns';

interface RealTimeDashboardProps {
  userId: number;
  organizationId?: number;
}

export function RealTimeDashboard({ userId, organizationId }: RealTimeDashboardProps) {
  const {
    dashboardStats,
    notifications,
    recentActivity,
    connected,
    clearNotification,
    clearAllNotifications,
  } = useDashboardUpdates();

  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <div className="space-y-6">
      {/* Connection Status */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? 'bg-green-500' : 'bg-red-500'}`} />
          <span className="text-sm text-gray-600">
            {connected ? 'Connected' : 'Disconnected'}
          </span>
        </div>
        
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setNotificationsEnabled(!notificationsEnabled)}
          >
            {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            {notificationsEnabled ? 'Notifications On' : 'Notifications Off'}
          </Button>
          
          {notifications.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAllNotifications}
            >
              Clear All ({notifications.length})
            </Button>
          )}
        </div>
      </div>

      {/* Real-time Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatsCard
          title="Total Scans"
          value={dashboardStats?.totalScans || 0}
          icon={<Activity className="w-4 h-4" />}
          trend="+12% from last week"
          connected={connected}
        />
        
        <StatsCard
          title="Completed Scans"
          value={dashboardStats?.completedScans || 0}
          icon={<CheckCircle className="w-4 h-4" />}
          trend="+8% from last week"
          connected={connected}
        />
        
        <StatsCard
          title="Reports Generated"
          value={dashboardStats?.totalReports || 0}
          icon={<FileText className="w-4 h-4" />}
          trend="+15% from last week"
          connected={connected}
        />
        
        <StatsCard
          title="Active Rules"
          value={dashboardStats?.totalRules || 0}
          icon={<Shield className="w-4 h-4" />}
          trend="35 rules active"
          connected={connected}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Notifications Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5" />
              Real-time Notifications
              {notifications.length > 0 && (
                <Badge variant="secondary">{notifications.length}</Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              {notifications.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No new notifications
                </div>
              ) : (
                <div className="space-y-3">
                  {notifications.map((notification) => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onClear={() => clearNotification(notification.id)}
                      enabled={notificationsEnabled}
                    />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Activity Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-80">
              {recentActivity.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No recent activity
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  trend: string;
  connected: boolean;
}

function StatsCard({ title, value, icon, trend, connected }: StatsCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{title}</p>
            <p className="text-2xl font-bold">
              {connected ? value.toLocaleString() : '---'}
            </p>
            <p className="text-xs text-gray-500 mt-1">{trend}</p>
          </div>
          <div className="text-gray-400">
            {icon}
          </div>
        </div>
        {!connected && (
          <div className="mt-2">
            <div className="w-full bg-gray-200 rounded-full h-1">
              <div className="bg-gray-400 h-1 rounded-full animate-pulse" style={{ width: '60%' }} />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface NotificationItemProps {
  notification: {
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    title: string;
    message: string;
    timestamp: string;
  };
  onClear: () => void;
  enabled: boolean;
}

function NotificationItem({ notification, onClear, enabled }: NotificationItemProps) {
  const getAlertVariant = (type: string) => {
    switch (type) {
      case 'error':
        return 'destructive';
      case 'warning':
        return 'default';
      case 'success':
        return 'default';
      default:
        return 'default';
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'error':
        return <AlertCircle className="w-4 h-4" />;
      case 'warning':
        return <AlertCircle className="w-4 h-4" />;
      case 'success':
        return <CheckCircle className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  return (
    <Alert 
      variant={getAlertVariant(notification.type)}
      className={`relative ${!enabled ? 'opacity-50' : ''}`}
    >
      {getIcon(notification.type)}
      <AlertTitle className="pr-8">
        {notification.title}
        <Button
          variant="ghost"
          size="sm"
          className="absolute top-2 right-2 h-6 w-6 p-0"
          onClick={onClear}
        >
          <X className="w-3 h-3" />
        </Button>
      </AlertTitle>
      <AlertDescription>
        {notification.message}
        <div className="text-xs text-gray-500 mt-1">
          {formatDistanceToNow(new Date(notification.timestamp), { addSuffix: true })}
        </div>
      </AlertDescription>
    </Alert>
  );
}

interface ActivityItemProps {
  activity: {
    id: number;
    action: string;
    description: string;
    timestamp: string;
    userName?: string;
  };
}

function ActivityItem({ activity }: ActivityItemProps) {
  const getActionIcon = (action: string) => {
    if (action.includes('scan')) return <Activity className="w-4 h-4 text-blue-500" />;
    if (action.includes('report')) return <FileText className="w-4 h-4 text-green-500" />;
    if (action.includes('user')) return <Users className="w-4 h-4 text-purple-500" />;
    return <Clock className="w-4 h-4 text-gray-500" />;
  };

  return (
    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
      {getActionIcon(activity.action)}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">
          {activity.description}
        </p>
        <div className="flex items-center gap-2 mt-1">
          {activity.userName && (
            <span className="text-xs text-gray-600">
              by {activity.userName}
            </span>
          )}
          <span className="text-xs text-gray-500">
            {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
          </span>
        </div>
      </div>
    </div>
  );
}