'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Users, 
  Shield, 
  Settings, 
  Plus,
  UserPlus,
  Team,
  Activity,
  BarChart3,
  Calendar,
  Storage
} from 'lucide-react';
import MemberManagement from './member-management';

interface OrganizationStats {
  totalMembers: number;
  activeMembers: number;
  totalTeams: number;
  monthlyScans: number;
  storageUsed: number;
  apiCalls: number;
}

interface Organization {
  id: number;
  name: string;
  slug: string;
  plan: string;
  isActive: boolean;
}

interface OrganizationOverviewProps {
  organizationId: number;
}

export default function OrganizationOverview({ organizationId }: OrganizationOverviewProps) {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [stats, setStats] = useState<OrganizationStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrganizationData();
  }, [organizationId]);

  const fetchOrganizationData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/organizations/${organizationId}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch organization data');
      }

      const data = await response.json();
      setOrganization(data.organization);
      setStats(data.stats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan.toLowerCase()) {
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      case 'pro': return 'bg-blue-100 text-blue-800';
      case 'free': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !organization || !stats) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error: {error || 'Failed to load organization data'}</p>
        <Button onClick={fetchOrganizationData} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Organization Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{organization.name}</h1>
          <div className="flex items-center gap-4 mt-2">
            <Badge className={getPlanBadgeColor(organization.plan)}>
              {organization.plan.toUpperCase()} Plan
            </Badge>
            <span className="text-sm text-gray-500">/{organization.slug}</span>
            {organization.isActive ? (
              <Badge className="bg-green-100 text-green-800">Active</Badge>
            ) : (
              <Badge className="bg-red-100 text-red-800">Inactive</Badge>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button>
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Members
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Members</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMembers}</div>
            <p className="text-xs text-muted-foreground">
              {stats.activeMembers} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teams</CardTitle>
            <Team className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeams}</div>
            <p className="text-xs text-muted-foreground">
              Active teams
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Scans</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.monthlyScans}</div>
            <p className="text-xs text-muted-foreground">
              This month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Storage Used</CardTitle>
            <Storage className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatBytes(stats.storageUsed)}</div>
            <p className="text-xs text-muted-foreground">
              {stats.apiCalls} API calls
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Organization Management Tabs */}
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="teams">Teams</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm">New scan completed</p>
                      <p className="text-xs text-muted-foreground">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm">New member joined</p>
                      <p className="text-xs text-muted-foreground">1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
                    <div className="flex-1">
                      <p className="text-sm">Team created</p>
                      <p className="text-xs text-muted-foreground">3 days ago</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 gap-3">
                  <Button variant="outline" className="justify-start">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite New Member
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Plus className="h-4 w-4 mr-2" />
                    Create Team
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <Shield className="h-4 w-4 mr-2" />
                    Manage Rules
                  </Button>
                  <Button variant="outline" className="justify-start">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Reports
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="members" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization Members</CardTitle>
              <CardDescription>
                Manage your organization members and their roles
              </CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <MemberManagement organizationId={organizationId} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Teams</CardTitle>
              <CardDescription>
                Organize your members into teams for better collaboration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Team management component will be implemented here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Organization Settings</CardTitle>
              <CardDescription>
                Configure your organization preferences and policies
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Organization settings component will be implemented here.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}