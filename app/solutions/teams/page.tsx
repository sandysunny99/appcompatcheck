import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Share2, GitBranch, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function TeamsPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Users className="h-16 w-16 mx-auto mb-4 text-blue-500" />
          <h1 className="text-4xl font-bold mb-4">For Teams</h1>
          <p className="text-xl text-muted-foreground">
            Collaborative development environments for modern teams
          </p>
        </div>

        <div className="space-y-6 mb-12">
          <Card>
            <CardHeader>
              <Share2 className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle>Team Collaboration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Work together seamlessly with shared scans and reports
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Shared workspaces
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Team dashboards
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Collaborative reporting
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <GitBranch className="h-8 w-8 text-purple-500 mb-2" />
              <CardTitle>Version Control Integration</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Automatic scans on pull requests and code reviews
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="h-8 w-8 text-green-500 mb-2" />
              <CardTitle>Role-Based Access</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Manage permissions and access control for team members
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button asChild size="lg">
            <Link href="/pricing">View Team Plans</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
