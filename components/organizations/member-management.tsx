'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  UserPlus, 
  Mail, 
  MoreHorizontal, 
  Shield, 
  User,
  Crown,
  AlertTriangle,
  CheckCircle,
  Calendar
} from 'lucide-react';

interface OrganizationMember {
  id: number;
  user: {
    id: number;
    name: string;
    email: string;
  };
  role: string;
  joinedAt: Date;
  isActive: boolean;
}

interface MemberManagementProps {
  organizationId: number;
}

export default function MemberManagement({ organizationId }: MemberManagementProps) {
  const [members, setMembers] = useState<OrganizationMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteData, setInviteData] = useState({
    email: '',
    role: 'user'
  });
  const [inviteLoading, setInviteLoading] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);

  useEffect(() => {
    fetchMembers();
  }, [organizationId, page]);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/organizations/${organizationId}/members?page=${page}&limit=20`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch members');
      }

      const data = await response.json();
      setMembers(data.members || []);
      setTotal(data.total || 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteData.email) {
      setInviteError('Email is required');
      return;
    }

    try {
      setInviteLoading(true);
      setInviteError(null);

      const response = await fetch(`/api/organizations/${organizationId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(inviteData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to invite user');
      }

      // Reset form and close dialog
      setInviteData({ email: '', role: 'user' });
      setShowInviteDialog(false);
      
      // Refresh members list
      fetchMembers();
      
      // Show success message (could be replaced with toast)
      alert('User invited successfully!');

    } catch (err) {
      setInviteError(err instanceof Error ? err.message : 'Failed to invite user');
    } finally {
      setInviteLoading(false);
    }
  };

  const handleUpdateRole = async (memberId: number, newRole: string) => {
    try {
      const response = await fetch(`/api/organizations/${organizationId}/members/${memberId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!response.ok) {
        throw new Error('Failed to update member role');
      }

      // Refresh members list
      fetchMembers();
      alert('Member role updated successfully!');

    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to update member role');
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    if (!confirm('Are you sure you want to remove this member?')) {
      return;
    }

    try {
      const response = await fetch(`/api/organizations/${organizationId}/members/${memberId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to remove member');
      }

      // Refresh members list
      fetchMembers();
      alert('Member removed successfully!');

    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'org_admin': return <Crown className="h-4 w-4" />;
      case 'manager': return <Shield className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'org_admin': return 'bg-purple-100 text-purple-800';
      case 'manager': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatRole = (role: string) => {
    switch (role) {
      case 'org_admin': return 'Organization Admin';
      case 'manager': return 'Manager';
      default: return 'User';
    }
  };

  if (loading && members.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Organization Members</h2>
          <p className="text-gray-600 mt-1">
            Manage your organization members and their permissions
          </p>
        </div>
        
        <Dialog open={showInviteDialog} onOpenChange={setShowInviteDialog}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite New Member</DialogTitle>
              <DialogDescription>
                Send an invitation to join your organization
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="user@example.com"
                  value={inviteData.email}
                  onChange={(e) => setInviteData({ ...inviteData, email: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={inviteData.role} onValueChange={(value) => setInviteData({ ...inviteData, role: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="org_admin">Organization Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {inviteError && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>{inviteError}</AlertDescription>
                </Alert>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowInviteDialog(false)}>
                Cancel
              </Button>
              <Button onClick={handleInviteUser} disabled={inviteLoading}>
                {inviteLoading ? 'Sending...' : 'Send Invitation'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {error && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Members ({total})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-4">Member</th>
                  <th className="text-left p-4">Role</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Joined</th>
                  <th className="text-left p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => (
                  <tr key={member.id} className="border-b hover:bg-gray-50">
                    <td className="p-4">
                      <div>
                        <div className="font-medium">{member.user.name || 'Unknown'}</div>
                        <div className="text-sm text-gray-500 flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {member.user.email}
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <Badge className={`${getRoleBadgeColor(member.role)} flex items-center gap-1 w-fit`}>
                        {getRoleIcon(member.role)}
                        {formatRole(member.role)}
                      </Badge>
                    </td>
                    <td className="p-4">
                      {member.isActive ? (
                        <Badge className="bg-green-100 text-green-800 flex items-center gap-1 w-fit">
                          <CheckCircle className="h-3 w-3" />
                          Active
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-800">Inactive</Badge>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="text-sm flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {new Date(member.joinedAt).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Select onValueChange={(value) => handleUpdateRole(member.user.id, value)}>
                          <SelectTrigger className="w-32">
                            <SelectValue placeholder="Change role" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="user">User</SelectItem>
                            <SelectItem value="manager">Manager</SelectItem>
                            <SelectItem value="org_admin">Org Admin</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveMember(member.user.id)}
                          className="text-red-600 hover:text-red-800"
                        >
                          Remove
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {members.length === 0 && !loading && (
            <div className="text-center py-8">
              <p className="text-gray-500">No members found</p>
            </div>
          )}

          {/* Pagination */}
          {total > 20 && (
            <div className="flex justify-between items-center mt-4">
              <Button
                variant="outline"
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
              >
                Previous
              </Button>
              <span className="text-sm text-gray-500">
                Page {page} of {Math.ceil(total / 20)}
              </span>
              <Button
                variant="outline"
                onClick={() => setPage(p => p + 1)}
                disabled={page >= Math.ceil(total / 20)}
              >
                Next
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}