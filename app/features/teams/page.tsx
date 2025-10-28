import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, UserPlus, Settings, BarChart3 } from 'lucide-react';
import Link from 'next/link';

export default function TeamManagementPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Users className="h-16 w-16 mx-auto mb-4 text-blue-500" />
          <h1 className="text-4xl font-bold mb-4">Team Management</h1>
          <p className="text-xl text-muted-foreground">
            Collaborate seamlessly with multi-tenant organization management
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-12">
          <Card>
            <CardHeader>
              <UserPlus className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle>Easy Onboarding</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Invite team members and assign roles with just a few clicks
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Settings className="h-8 w-8 text-purple-500 mb-2" />
              <CardTitle>Role-Based Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Fine-grained permissions control for different team roles
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <BarChart3 className="h-8 w-8 text-green-500 mb-2" />
              <CardTitle>Team Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Track team performance and collaboration metrics
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-orange-500 mb-2" />
              <CardTitle>Multi-Organization</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Manage multiple organizations from a single account
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button asChild size="lg">
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
