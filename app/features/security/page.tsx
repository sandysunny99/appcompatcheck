import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Lock, AlertTriangle, Eye } from 'lucide-react';
import Link from 'next/link';

export default function SecurityScanningPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div suppressHydrationWarning>
            <Shield className="h-16 w-16 mx-auto mb-4 text-red-500" />
          </div>
          <h1 className="text-4xl font-bold mb-4">Comprehensive Security Scanning</h1>
          <p className="text-xl text-muted-foreground">
            Detect and fix security vulnerabilities before they become threats
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-12">
          <Card>
            <CardHeader>
              <div suppressHydrationWarning>
                <AlertTriangle className="h-8 w-8 text-orange-500 mb-2" />
              </div>
              <CardTitle>Vulnerability Detection</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Identify SQL injection, XSS, CSRF, and other security vulnerabilities
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div suppressHydrationWarning>
                <Lock className="h-8 w-8 text-blue-500 mb-2" />
              </div>
              <CardTitle>Secure by Design</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Get recommendations for secure coding practices and patterns
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div suppressHydrationWarning>
                <Eye className="h-8 w-8 text-purple-500 mb-2" />
              </div>
              <CardTitle>Continuous Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Monitor your applications 24/7 for new security threats
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div suppressHydrationWarning>
                <Shield className="h-8 w-8 text-green-500 mb-2" />
              </div>
              <CardTitle>Compliance Ready</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Meet OWASP, PCI-DSS, and other security compliance standards
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button asChild size="lg">
            <Link href="/scan">Start Security Scan</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
