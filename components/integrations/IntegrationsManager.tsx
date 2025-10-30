'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Github, 
  Shield, 
  MessageSquare, 
  Loader2,
  CheckCircle,
  XCircle,
  RefreshCw,
  Settings,
  Trash2,
  TestTube
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface Integration {
  id: string;
  name: string;
  provider: string;
  type: string;
  status: 'active' | 'inactive';
  description: string;
  icon: string;
  configured: boolean;
  lastSync: string | null;
  config: any;
}

interface IntegrationsManagerProps {
  userId: number;
}

export function IntegrationsManager({ userId }: IntegrationsManagerProps) {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchIntegrations();
  }, []);

  const fetchIntegrations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/integrations');
      if (response.ok) {
        const data = await response.json();
        setIntegrations(data.integrations || []);
      }
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
      toast({
        title: 'Error',
        description: 'Failed to load integrations',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTestConnection = async (integrationId: string) => {
    setTestingId(integrationId);
    try {
      const response = await fetch(`/api/integrations/${integrationId}/test`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Connection Successful',
          description: data.message || 'Integration is working correctly',
        });
      } else {
        toast({
          title: 'Connection Failed',
          description: data.message || 'Failed to connect to the integration',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Test connection failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to test connection',
        variant: 'destructive',
      });
    } finally {
      setTestingId(null);
    }
  };

  const handleSync = async (integrationId: string) => {
    setSyncingId(integrationId);
    try {
      const response = await fetch(`/api/integrations/${integrationId}/sync`, {
        method: 'POST',
      });
      const data = await response.json();

      if (data.success) {
        toast({
          title: 'Sync Complete',
          description: `Processed ${data.itemsProcessed} items (${data.itemsCreated} created, ${data.itemsUpdated} updated)`,
        });
        fetchIntegrations(); // Refresh the list
      } else {
        toast({
          title: 'Sync Failed',
          description: data.message || 'Failed to sync integration',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Sync failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to sync integration',
        variant: 'destructive',
      });
    } finally {
      setSyncingId(null);
    }
  };

  const handleToggleStatus = async (integration: Integration) => {
    try {
      const newStatus = integration.status === 'active' ? 'inactive' : 'active';
      const response = await fetch(`/api/integrations/${integration.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (response.ok) {
        toast({
          title: newStatus === 'active' ? 'Integration Activated' : 'Integration Deactivated',
          description: `${integration.name} is now ${newStatus}`,
        });
        fetchIntegrations();
      }
    } catch (error) {
      console.error('Failed to toggle status:', error);
      toast({
        title: 'Error',
        description: 'Failed to update integration status',
        variant: 'destructive',
      });
    }
  };

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'github':
        return <Github className="w-8 h-8" />;
      case 'shield':
        return <Shield className="w-8 h-8" />;
      case 'jira':
      case 'slack':
        return <MessageSquare className="w-8 h-8" />;
      default:
        return <Settings className="w-8 h-8" />;
    }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'active') {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Active
        </Badge>
      );
    }
    return (
      <Badge variant="outline" className="text-gray-600">
        <XCircle className="w-3 h-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-600">Total Integrations</div>
            <div className="text-2xl font-bold">{integrations.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-600">Active</div>
            <div className="text-2xl font-bold text-green-600">
              {integrations.filter(i => i.status === 'active').length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-600">Configured</div>
            <div className="text-2xl font-bold text-blue-600">
              {integrations.filter(i => i.configured).length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-sm text-gray-600">Available</div>
            <div className="text-2xl font-bold text-gray-600">
              {integrations.filter(i => !i.configured).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Integrations Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {integrations.map((integration) => (
          <Card key={integration.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    integration.status === 'active' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'bg-gray-100 text-gray-600'
                  }`}>
                    {getIcon(integration.icon)}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{integration.name}</CardTitle>
                    <div className="mt-1">{getStatusBadge(integration.status)}</div>
                  </div>
                </div>
              </div>
              <CardDescription className="mt-2">
                {integration.description}
              </CardDescription>
            </CardHeader>

            <CardContent>
              <div className="space-y-3">
                {integration.configured && integration.lastSync && (
                  <div className="text-xs text-gray-500">
                    Last synced: {new Date(integration.lastSync).toLocaleString()}
                  </div>
                )}

                <div className="flex gap-2 flex-wrap">
                  {integration.configured ? (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestConnection(integration.id)}
                        disabled={testingId === integration.id}
                      >
                        {testingId === integration.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Testing...
                          </>
                        ) : (
                          <>
                            <TestTube className="w-4 h-4 mr-2" />
                            Test
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSync(integration.id)}
                        disabled={syncingId === integration.id || integration.status !== 'active'}
                      >
                        {syncingId === integration.id ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Sync
                          </>
                        )}
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(integration)}
                      >
                        {integration.status === 'active' ? 'Deactivate' : 'Activate'}
                      </Button>
                    </>
                  ) : (
                    <Button size="sm" className="w-full">
                      <Settings className="w-4 h-4 mr-2" />
                      Configure
                    </Button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
