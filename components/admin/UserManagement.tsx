'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
  Shield, 
  Mail, 
  Calendar,
  Building,
  UserCheck,
  UserX,
  MoreHorizontal
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  organizationId?: number;
  organizationName?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
  scanCount: number;
}

interface Organization {
  id: number;
  name: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [organizationFilter, setOrganizationFilter] = useState('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchOrganizations();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizations = async () => {
    try {
      const response = await fetch('/api/admin/organizations');
      if (response.ok) {
        const data = await response.json();
        setOrganizations(data.organizations || []);
      }
    } catch (error) {
      console.error('Failed to fetch organizations:', error);
    }
  };

  const handleCreateUser = async (userData: Partial<User>) => {
    try {
      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        await fetchUsers();
        setIsCreateDialogOpen(false);
      }
    } catch (error) {
      console.error('Failed to create user:', error);
    }
  };

  const handleUpdateUser = async (id: number, updates: Partial<User>) => {
    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });

      if (response.ok) {
        await fetchUsers();
        setEditingUser(null);
      }
    } catch (error) {
      console.error('Failed to update user:', error);
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;

    try {
      const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        await fetchUsers();
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const handleToggleUserStatus = async (id: number, isActive: boolean) => {
    await handleUpdateUser(id, { isActive });
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.lastName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesOrganization = organizationFilter === 'all' || 
      user.organizationId?.toString() === organizationFilter;
    
    return matchesSearch && matchesRole && matchesOrganization;
  });

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const roleOptions = [
    { value: 'user', label: 'User' },
    { value: 'manager', label: 'Manager' },
    { value: 'admin', label: 'Admin' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">User Management</h2>
          <p className="text-gray-600">Manage user accounts and permissions</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create User
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <CreateUserForm 
              organizations={organizations}
              onSubmit={handleCreateUser} 
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Users</p>
                <p className="text-2xl font-bold">{users.length}</p>
              </div>
              <Shield className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Active Users</p>
                <p className="text-2xl font-bold text-green-600">
                  {users.filter(u => u.isActive).length}
                </p>
              </div>
              <UserCheck className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Inactive Users</p>
                <p className="text-2xl font-bold text-red-600">
                  {users.filter(u => !u.isActive).length}
                </p>
              </div>
              <UserX className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Admins</p>
                <p className="text-2xl font-bold text-purple-600">
                  {users.filter(u => u.role === 'admin').length}
                </p>
              </div>
              <Shield className="w-8 h-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="search">Search Users</Label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                <Input
                  id="search"
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>Role</Label>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Organization</Label>
              <Select value={organizationFilter} onValueChange={setOrganizationFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Organizations</SelectItem>
                  {organizations.map(org => (
                    <SelectItem key={org.id} value={org.id.toString()}>
                      {org.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Role</TableHead>
                  <TableHead>Organization</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Login</TableHead>
                  <TableHead>Scans</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : filteredUsers.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {user.firstName} {user.lastName}
                          </div>
                          <div className="text-sm text-gray-600">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={getRoleColor(user.role)}>
                          {user.role}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.organizationName ? (
                          <div className="flex items-center gap-1">
                            <Building className="w-4 h-4 text-gray-400" />
                            {user.organizationName}
                          </div>
                        ) : (
                          <span className="text-gray-400">No organization</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={user.isActive}
                            onCheckedChange={(checked) => handleToggleUserStatus(user.id, checked)}
                          />
                          <Badge variant={user.isActive ? 'default' : 'secondary'}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.lastLoginAt ? (
                          <div className="text-sm">
                            {formatDistanceToNow(new Date(user.lastLoginAt), { addSuffix: true })}
                          </div>
                        ) : (
                          <span className="text-gray-400">Never</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <span className="text-sm">{user.scanCount}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingUser(user)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(`mailto:${user.email}`)}
                          >
                            <Mail className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id)}
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

      {/* Edit User Dialog */}
      {editingUser && (
        <Dialog open={!!editingUser} onOpenChange={() => setEditingUser(null)}>
          <DialogContent className="max-w-2xl">
            <EditUserForm
              user={editingUser}
              organizations={organizations}
              onSubmit={(updates) => handleUpdateUser(editingUser.id, updates)}
              onCancel={() => setEditingUser(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function CreateUserForm({ 
  organizations, 
  onSubmit 
}: { 
  organizations: Organization[];
  onSubmit: (data: Partial<User>) => void;
}) {
  const [formData, setFormData] = useState({
    email: '',
    firstName: '',
    lastName: '',
    role: 'user',
    organizationId: '',
    isActive: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      organizationId: formData.organizationId ? parseInt(formData.organizationId) : undefined,
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Create New User</DialogTitle>
        <DialogDescription>
          Add a new user to the system with appropriate role and permissions.
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="firstName">First Name</Label>
            <Input
              id="firstName"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="lastName">Last Name</Label>
            <Input
              id="lastName"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="email">Email Address</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="role">Role</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="organization">Organization</Label>
            <Select 
              value={formData.organizationId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, organizationId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No organization</SelectItem>
                {organizations.map(org => (
                  <SelectItem key={org.id} value={org.id.toString()}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
          />
          <Label htmlFor="isActive">User is active</Label>
        </div>

        <DialogFooter>
          <Button type="submit">Create User</Button>
        </DialogFooter>
      </form>
    </>
  );
}

function EditUserForm({ 
  user, 
  organizations,
  onSubmit, 
  onCancel 
}: { 
  user: User;
  organizations: Organization[];
  onSubmit: (updates: Partial<User>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    organizationId: user.organizationId?.toString() || '',
    isActive: user.isActive,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      organizationId: formData.organizationId ? parseInt(formData.organizationId) : undefined,
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Edit User</DialogTitle>
        <DialogDescription>
          Update user information and permissions.
        </DialogDescription>
      </DialogHeader>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="edit-firstName">First Name</Label>
            <Input
              id="edit-firstName"
              value={formData.firstName}
              onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-lastName">Last Name</Label>
            <Input
              id="edit-lastName"
              value={formData.lastName}
              onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
              required
            />
          </div>
        </div>

        <div>
          <Label htmlFor="edit-email">Email Address</Label>
          <Input
            id="edit-email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="edit-role">Role</Label>
            <Select 
              value={formData.role} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, role: value }))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="edit-organization">Organization</Label>
            <Select 
              value={formData.organizationId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, organizationId: value }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select organization" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">No organization</SelectItem>
                {organizations.map(org => (
                  <SelectItem key={org.id} value={org.id.toString()}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Switch
            id="edit-isActive"
            checked={formData.isActive}
            onCheckedChange={(checked) => setFormData(prev => ({ ...prev, isActive: checked }))}
          />
          <Label htmlFor="edit-isActive">User is active</Label>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">Update User</Button>
        </DialogFooter>
      </form>
    </>
  );
}