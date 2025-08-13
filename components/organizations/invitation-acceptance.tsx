'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertTriangle, 
  Building2, 
  Mail, 
  Shield,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface InvitationDetails {
  organization: {
    name: string;
    plan: string;
  };
  role: string;
  invitedBy: {
    name: string;
    email: string;
  };
  expiresAt: string;
  email: string;
}

interface InvitationAcceptanceProps {
  token: string;
  userId: number;
  userEmail: string;
}

export default function InvitationAcceptance({ token, userId, userEmail }: InvitationAcceptanceProps) {
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetchInvitationDetails();
  }, [token]);

  const fetchInvitationDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/invitations/${token}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch invitation details');
      }

      const data = await response.json();
      setInvitation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load invitation');
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptInvitation = async () => {
    try {
      setAccepting(true);
      setError(null);

      const response = await fetch(`/api/invitations/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to accept invitation');
      }

      setSuccess(true);
      
      // Redirect to dashboard after a short delay
      setTimeout(() => {
        router.push('/dashboard');
      }, 2000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invitation');
    } finally {
      setAccepting(false);
    }
  };

  const formatRole = (role: string) => {
    switch (role) {
      case 'org_admin': return 'Organization Admin';
      case 'manager': return 'Manager';
      default: return 'User';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'org_admin': return <Shield className="h-4 w-4 text-purple-600" />;
      case 'manager': return <Shield className="h-4 w-4 text-blue-600" />;
      default: return <Shield className="h-4 w-4 text-gray-600" />;
    }
  };

  const getPlanBadgeColor = (plan: string) => {
    switch (plan?.toLowerCase()) {
      case 'enterprise': return 'bg-purple-100 text-purple-800';
      case 'pro': return 'bg-blue-100 text-blue-800';
      case 'free': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </CardContent>
      </Card>
    );
  }

  if (success) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to the team!
          </h2>
          <p className="text-gray-600 mb-4">
            You have successfully joined the organization.
          </p>
          <div className="flex items-center justify-center text-sm text-gray-500">
            <span>Redirecting to dashboard</span>
            <ArrowRight className="h-4 w-4 ml-1" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !invitation) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Invitation Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {error || 'This invitation is invalid or has expired.'}
            </AlertDescription>
          </Alert>
          <div className="mt-6">
            <Button 
              variant="outline" 
              onClick={() => router.push('/dashboard')}
              className="w-full"
            >
              Go to Dashboard
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Check if the invitation email matches the current user's email
  const emailMismatch = invitation.email !== userEmail;
  const isExpired = new Date() > new Date(invitation.expiresAt);

  return (
    <Card>
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Building2 className="h-6 w-6 text-blue-600" />
          Organization Invitation
        </CardTitle>
        <CardDescription>
          You've been invited to join an organization
        </CardDescription>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Organization Details */}
        <div className="text-center space-y-2">
          <h3 className="text-xl font-bold text-gray-900">
            {invitation.organization.name}
          </h3>
          <Badge className={getPlanBadgeColor(invitation.organization.plan)}>
            {invitation.organization.plan.toUpperCase()} Plan
          </Badge>
        </div>

        {/* Invitation Details */}
        <div className="space-y-4">
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm font-medium text-gray-600">Your Role:</span>
            <div className="flex items-center gap-2">
              {getRoleIcon(invitation.role)}
              <span className="font-medium">{formatRole(invitation.role)}</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm font-medium text-gray-600">Invited by:</span>
            <div className="text-right">
              <div className="font-medium">{invitation.invitedBy.name}</div>
              <div className="text-sm text-gray-500 flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {invitation.invitedBy.email}
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between py-2 border-b">
            <span className="text-sm font-medium text-gray-600">Expires:</span>
            <div className="flex items-center gap-1 text-sm">
              <Clock className="h-3 w-3" />
              {new Date(invitation.expiresAt).toLocaleDateString()}
            </div>
          </div>
          
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-medium text-gray-600">Invited Email:</span>
            <span className="text-sm">{invitation.email}</span>
          </div>
        </div>

        {/* Warnings */}
        {emailMismatch && (
          <Alert className="border-yellow-200 bg-yellow-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This invitation was sent to {invitation.email}, but you're logged in as {userEmail}. 
              You may need to log in with the correct account.
            </AlertDescription>
          </Alert>
        )}

        {isExpired && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              This invitation has expired. Please contact the organization admin for a new invitation.
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => router.push('/dashboard')}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAcceptInvitation}
            disabled={accepting || emailMismatch || isExpired}
            className="flex-1"
          >
            {accepting ? 'Accepting...' : 'Accept Invitation'}
          </Button>
        </div>

        {!emailMismatch && !isExpired && (
          <p className="text-xs text-gray-500 text-center">
            By accepting this invitation, you'll become a member of {invitation.organization.name} 
            with {formatRole(invitation.role)} permissions.
          </p>
        )}
      </CardContent>
    </Card>
  );
}