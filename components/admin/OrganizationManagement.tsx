'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Building, 
  Users, 
  Calendar,
  Settings
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface Organization {
  id: number;
  name: string;
  description?: string;
  domain?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  userCount: number;
  scanCount: number;
  settings: {
    maxUsers?: number;
    maxScansPerMonth?: number;
    allowedFeatures?: string[];
  };
}

export function OrganizationManagement() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingOrganization, setEditingOrganization] = useState<Organization | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchOrganizations();
  }, []);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/organizations');
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations || []);
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async (orgData: Partial<Organization>) => {
    try {
      const response = await fetch('/api/admin/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orgData),
      });

      if (response.ok) {
        await fetchOrganizations();
        setIsCreateDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to create organization:', error);
    }
  };

  const handleUpdateOrganization = async (id: number, updates: Partial<Organization>) => {
    try {
      const response = await fetch(`/api/admin/organizations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        await fetchOrganizations();
        setEditingOrganization(null);
      }
    } catch (error) {
      console.error('Failed to update organization:', error);
    }
  };

  const handleDeleteOrganization = async (id: number) => {
    if (!confirm('Are you sure you want to delete this organization? This will affect all associated users.')) return;

    try {
      const response = await fetch(`/api/admin/organizations/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchOrganizations();
      }
    } catch (error) {
      console.error('Failed to delete organization:', error);
    }
  };

  const handleToggleOrganization = async (id: number, isActive: boolean) => {
    await handleUpdateOrganization(id, { isActive });
  };

  const filteredOrganizations = organizations.filter(org => 
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.domain?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Organization Management</h2>
          <p className="text-gray-600">Manage organizations and their settings</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Organization
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <CreateOrganizationForm onSubmit={handleCreateOrganization} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Organizations</p>
                <p className="text-2xl font-bold">{organizations.length}</p>
              </div>
              <Building className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Organizations</p>
                <p className="text-2xl font-bold text-green-600">
                  {organizations.filter(o => o.isActive).length}
                </p>
              </div>
              <Building className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">
                  {organizations.reduce((acc, org) => acc + org.userCount, 0)}
                </p>
              </div>
              <Users className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Scans</p>
                <p className="text-2xl font-bold">
                  {organizations.reduce((acc, org) => acc + org.scanCount, 0)}
                </p>
              </div>
              <Settings className="w-8 h-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
            <Input
              placeholder="Search organizations..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Organizations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Organizations ({filteredOrganizations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Scans</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading organizations...
                    </TableCell>
                  </TableRow>
                ) : filteredOrganizations.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No organizations found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredOrganizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{org.name}</div>
                          {org.description && (
                            <div className="text-sm text-gray-600 truncate max-w-xs">
                              {org.description}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {org.domain ? (
                          <code className="text-sm bg-gray-100 px-2 py-1 rounded">
                            {org.domain}
                          </code>
                        ) : (
                          <span className="text-gray-400">No domain</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>{org.userCount}</span>
                          {org.settings.maxUsers && (
                            <span className="text-xs text-gray-500">
                              /{org.settings.maxUsers}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span>{org.scanCount.toLocaleString()}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={org.isActive}
                            onCheckedChange={(checked) => handleToggleOrganization(org.id, checked)}
                          />
                          <Badge variant={org.isActive ? 'default' : 'secondary'}>
                            {org.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {formatDistanceToNow(new Date(org.createdAt), { addSuffix: true })}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingOrganization(org)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteOrganization(org.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Edit Organization Dialog */}
      {editingOrganization && (
        <Dialog open={!!editingOrganization} onOpenChange={() => setEditingOrganization(null)}>
          <DialogContent className="max-w-2xl">
            <EditOrganizationForm
              organization={editingOrganization}
              onSubmit={(updates) => handleUpdateOrganization(editingOrganization.id, updates)}
              onCancel={() => setEditingOrganization(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function CreateOrganizationForm({ onSubmit }: { onSubmit: (data: Partial<Organization>) => void }) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    domain: '',
    isActive: true,
    maxUsers: '',
    maxScansPerMonth: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      settings: {
        maxUsers: formData.maxUsers ? parseInt(formData.maxUsers) : undefined,
        maxScansPerMonth: formData.maxScansPerMonth ? parseInt(formData.maxScansPerMonth) : undefined,
        allowedFeatures: ['scan', 'report', 'analytics'], // Default features
      },
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create New Organization</DialogTitle>
        <DialogDescription>
          Set up a new organization with initial configuration.
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Organization Name</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            placeholder="e.g., Acme Corporation"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            placeholder="Brief description of the organization..."
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="domain">Email Domain</Label>
          <Input
            id="domain"
            value={formData.domain}
            onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
            placeholder="e.g., acme.com"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="maxUsers">Max Users</Label>
            <Input
              id="maxUsers"
              type="number"
              value={formData.maxUsers}
              onChange={(e) => setFormData(prev => ({ ...prev, maxUsers: e.target.value }))}
              placeholder="e.g., 100"
            />
          </div>
          <div>
            <Label htmlFor="maxScansPerMonth">Max Scans/Month</Label>
            <Input
              id="maxScansPerMonth"
              type="number"
              value={formData.maxScansPerMonth}
              onChange={(e) => setFormData(prev => ({ ...prev, maxScansPerMonth: e.target.value }))}
              placeholder="e.g., 1000"
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
          />
          <Label htmlFor="isActive">Organization is active</Label>
        </div>

        <DialogFooter>
          <Button type="submit">Create Organization</Button>
        </DialogFooter>
      </form>
    </>
  );
}

function EditOrganizationForm({ 
  organization, 
  onSubmit, 
  onCancel 
}: { 
  organization: Organization;
  onSubmit: (updates: Partial<Organization>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: organization.name,
    description: organization.description || '',
    domain: organization.domain || '',
    isActive: organization.isActive,
    maxUsers: organization.settings.maxUsers?.toString() || '',
    maxScansPerMonth: organization.settings.maxScansPerMonth?.toString() || '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      settings: {
        ...organization.settings,
        maxUsers: formData.maxUsers ? parseInt(formData.maxUsers) : undefined,
        maxScansPerMonth: formData.maxScansPerMonth ? parseInt(formData.maxScansPerMonth) : undefined,
      },
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit Organization</DialogTitle>
        <DialogDescription>
          Update organization settings and configuration.
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="edit-name">Organization Name</Label>
          <Input
            id="edit-name"
            value={formData.name}
            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
            required
          />
        </div>

        <div>
          <Label htmlFor="edit-description">Description</Label>
          <Textarea
            id="edit-description"
            value={formData.description}
            onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="edit-domain">Email Domain</Label>
          <Input
            id="edit-domain"
            value={formData.domain}
            onChange={(e) => setFormData(prev => ({ ...prev, domain: e.target.value }))}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="edit-maxUsers">Max Users</Label>
            <Input
              id="edit-maxUsers"
              type="number"
              value={formData.maxUsers}
              onChange={(e) => setFormData(prev => ({ ...prev, maxUsers: e.target.value }))}
            />
          </div>
          <div>
            <Label htmlFor="edit-maxScansPerMonth">Max Scans/Month</Label>
            <Input
              id="edit-maxScansPerMonth"
              type="number"
              value={formData.maxScansPerMonth}
              onChange={(e) => setFormData(prev => ({ ...prev, maxScansPerMonth: e.target.value }))}
            />
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="edit-isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
          />
          <Label htmlFor="edit-isActive">Organization is active</Label>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Update Organization</Button>
        </DialogFooter>
      </form>
    </>
  );
}