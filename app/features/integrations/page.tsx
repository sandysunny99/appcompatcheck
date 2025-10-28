import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Globe, Webhook, Zap, Database } from 'lucide-react';
import Link from 'next/link';

export default function IntegrationsPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Globe className="h-16 w-16 mx-auto mb-4 text-blue-500" />
          <h1 className="text-4xl font-bold mb-4">Powerful Integrations</h1>
          <p className="text-xl text-muted-foreground">
            Connect AppCompatCheck with your favorite tools and workflows
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-12">
          <Card>
            <CardHeader>
              <Webhook className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle>Webhooks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Receive real-time notifications for scan completions and alerts
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-yellow-500 mb-2" />
              <CardTitle>CI/CD Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Integrate with GitHub Actions, GitLab CI, Jenkins, and more
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Database className="h-8 w-8 text-green-500 mb-2" />
              <CardTitle>Version Control</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Connect to GitHub, GitLab, Bitbucket for seamless scanning
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Globe className="h-8 w-8 text-purple-500 mb-2" />
              <CardTitle>REST API</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Build custom integrations with our comprehensive API
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button asChild size="lg">
            <Link href="/docs">View API Documentation</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
