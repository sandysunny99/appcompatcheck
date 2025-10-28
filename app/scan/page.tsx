import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { hasPermission, Permission } from '@/lib/auth/permissions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Server, Shield, Package, CheckCircle, Activity } from 'lucide-react';

export default async function ScanPage() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/sign-in');
  }

  if (!hasPermission(session, Permission.SCAN_CREATE)) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">System Compatibility Scan</h1>
        <p className="text-muted-foreground mt-2">
          Analyze your system and applications for compatibility issues and security vulnerabilities.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-500" />
              <CardTitle>System Scan</CardTitle>
            </div>
            <CardDescription>Scan system for compatibility issues</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>OS compatibility</span>
              </div>
              <div className="flex gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Software analysis</span>
              </div>
              <div className="flex gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Configuration review</span>
              </div>
            </div>
            <Button asChild className="w-full">
              <Link href="/scan/system">Start System Scan</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-red-500" />
              <CardTitle>Security Scan</CardTitle>
            </div>
            <CardDescription>Upload security tool logs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Vulnerability detection</span>
              </div>
              <div className="flex gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Log analysis</span>
              </div>
              <div className="flex gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Risk assessment</span>
              </div>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/upload">Upload Logs</Link>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-purple-500" />
              <CardTitle>Application Scan</CardTitle>
            </div>
            <CardDescription>Analyze application compatibility</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 text-sm">
              <div className="flex gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Dependency analysis</span>
              </div>
              <div className="flex gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>Version checks</span>
              </div>
              <div className="flex gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span>API validation</span>
              </div>
            </div>
            <Button asChild variant="outline" className="w-full">
              <Link href="/upload">Upload Data</Link>
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Scans</CardTitle>
          <CardDescription>View your latest scans and results</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-sm text-muted-foreground">No scans yet. Start your first scan.</p>
            <Button asChild className="mt-4">
              <Link href="/scan/system">Start Scan</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
