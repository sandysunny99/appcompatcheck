import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Play, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Product Demo | AppCompatCheck',
  description: 'Watch a demo of AppCompatCheck platform and learn how it can help your team.',
};

export default function DemoPage() {
  return (
    <div className="container mx-auto px-4 py-16">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight">
            See AppCompatCheck in Action
          </h1>
          <p className="text-xl text-muted-foreground">
            Watch a quick demo of how AppCompatCheck helps teams analyze code compatibility,
            identify issues, and maintain high quality standards.
          </p>
        </div>

        {/* Video Placeholder */}
        <Card className="mb-12 overflow-hidden">
          <div className="relative aspect-video bg-gradient-to-br from-blue-500 to-purple-600">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center text-white">
                <Play className="mx-auto mb-4 h-20 w-20 opacity-80" />
                <p className="text-lg font-medium">Demo video coming soon</p>
                <p className="text-sm opacity-80">
                  In the meantime, sign up for a free trial to explore all features
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Features Covered */}
        <div className="mb-12">
          <h2 className="mb-6 text-2xl font-bold">What you'll learn in this demo:</h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              'Upload and analyze security logs',
              'View detailed compatibility reports',
              'Set up team collaboration features',
              'Configure automated scanning',
              'Monitor system health and metrics',
              'Export reports and insights',
            ].map((feature, index) => (
              <div key={index} className="flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 flex-shrink-0 text-green-500 mt-0.5" />
                <span className="text-muted-foreground">{feature}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Use Cases */}
        <div className="mb-12">
          <h2 className="mb-6 text-2xl font-bold">Perfect for:</h2>
          <div className="grid gap-6 md:grid-cols-3">
            <Card>
              <CardHeader>
                <CardTitle>Development Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Catch compatibility issues early in the development cycle
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>DevOps Engineers</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Integrate scanning into your CI/CD pipeline seamlessly
                </CardDescription>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Teams</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Identify security vulnerabilities and compliance issues
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <div className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 p-8 text-center text-white">
          <h2 className="mb-4 text-2xl font-bold">Ready to get started?</h2>
          <p className="mb-6 text-lg opacity-90">
            Sign up now and start analyzing your code in minutes.
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button asChild size="lg" variant="secondary">
              <Link href="/sign-up">
                Start Free Trial
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="bg-white/10 hover:bg-white/20 text-white border-white/20">
              <Link href="/docs">
                View Documentation
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
