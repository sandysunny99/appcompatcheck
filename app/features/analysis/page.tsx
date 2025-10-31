import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Code, CheckCircle, Zap, Shield } from 'lucide-react';
import Link from 'next/link';

export default function CodeAnalysisPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div>
            <Code className="h-16 w-16 mx-auto mb-4 text-primary" suppressHydrationWarning />
          </div>
          <h1 className="text-4xl font-bold mb-4">AI-Powered Code Analysis</h1>
          <p className="text-xl text-muted-foreground">
            Automatically analyze your codebase for compatibility issues and security vulnerabilities
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-12">
          <Card>
            <CardHeader>
              <div>
                <Zap className="h-8 w-8 text-yellow-500 mb-2" suppressHydrationWarning />
              </div>
              <CardTitle>Fast & Accurate</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Scan thousands of lines of code in seconds with our AI-powered analysis engine
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <Shield className="h-8 w-8 text-blue-500 mb-2" suppressHydrationWarning />
              </div>
              <CardTitle>Security Focused</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Detect vulnerabilities and security issues before they reach production
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <CheckCircle className="h-8 w-8 text-green-500 mb-2" suppressHydrationWarning />
              </div>
              <CardTitle>Compatibility Checks</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Ensure your code works across different environments and platforms
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <Code className="h-8 w-8 text-purple-500 mb-2" suppressHydrationWarning />
              </div>
              <CardTitle>Multi-Language Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Support for JavaScript, TypeScript, Python, Java, and more
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button asChild size="lg">
            <Link href="/scan">Start Code Analysis</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
