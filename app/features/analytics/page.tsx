import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BarChart3, TrendingUp, PieChart, Activity } from 'lucide-react';
import Link from 'next/link';

export default function AnalyticsPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <div>
            <BarChart3 className="h-16 w-16 mx-auto mb-4 text-blue-500" suppressHydrationWarning />
          </div>
          <h1 className="text-4xl font-bold mb-4">Advanced Analytics & Reporting</h1>
          <p className="text-xl text-muted-foreground">
            Get actionable insights from your compatibility scans and security audits
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 mb-12">
          <Card>
            <CardHeader>
              <div>
                <TrendingUp className="h-8 w-8 text-green-500 mb-2" suppressHydrationWarning />
              </div>
              <CardTitle>Trend Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Track improvements and identify recurring issues over time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <PieChart className="h-8 w-8 text-purple-500 mb-2" suppressHydrationWarning />
              </div>
              <CardTitle>Custom Dashboards</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Create personalized views of metrics that matter most to you
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <Activity className="h-8 w-8 text-orange-500 mb-2" suppressHydrationWarning />
              </div>
              <CardTitle>Real-Time Monitoring</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Monitor scans and security status in real-time
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div>
                <BarChart3 className="h-8 w-8 text-blue-500 mb-2" suppressHydrationWarning />
              </div>
              <CardTitle>Export Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Generate PDF, CSV, and JSON reports for stakeholders
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="text-center">
          <Button asChild size="lg">
            <Link href="/reports">View Analytics</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
