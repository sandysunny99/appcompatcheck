import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Code, Terminal, Zap, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function DevelopersPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Terminal className="h-16 w-16 mx-auto mb-4 text-green-500" />
          <h1 className="text-4xl font-bold mb-4">For Developers</h1>
          <p className="text-xl text-muted-foreground">
            Tools and workflows designed for individual developers
          </p>
        </div>

        <div className="space-y-6 mb-12">
          <Card>
            <CardHeader>
              <Code className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle>Fast Local Scans</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Run compatibility scans directly from your development environment
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  CLI tool for quick scans
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  IDE extensions (VS Code, IntelliJ)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Pre-commit hooks
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Zap className="h-8 w-8 text-yellow-500 mb-2" />
              <CardTitle>Instant Feedback</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Get immediate feedback on code changes with real-time analysis
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Terminal className="h-8 w-8 text-purple-500 mb-2" />
              <CardTitle>Developer-Friendly API</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Comprehensive REST API for building custom integrations
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button asChild size="lg">
            <Link href="/sign-up">Start Free Trial</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
