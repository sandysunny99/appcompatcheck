import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Building2, Lock, CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function EnterprisePage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <Building2 className="h-16 w-16 mx-auto mb-4 text-purple-500" />
          <h1 className="text-4xl font-bold mb-4">For Enterprise</h1>
          <p className="text-xl text-muted-foreground">
            Enterprise-grade security, compliance, and scalability
          </p>
        </div>

        <div className="space-y-6 mb-12">
          <Card>
            <CardHeader>
              <Shield className="h-8 w-8 text-red-500 mb-2" />
              <CardTitle>Enterprise Security</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Advanced security features for enterprise environments
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  SSO and SAML integration
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  Advanced audit logging
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  SOC 2 Type II compliance
                </li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Lock className="h-8 w-8 text-blue-500 mb-2" />
              <CardTitle>Data Governance</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Full control over data residency and retention policies
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Building2 className="h-8 w-8 text-purple-500 mb-2" />
              <CardTitle>Dedicated Support</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                24/7 priority support with dedicated success manager
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button asChild size="lg">
            <Link href="/contact">Contact Sales</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
