'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';

// Dynamically import SwaggerUI to avoid SSR issues
const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
  </div>
});
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, Code, Book, Zap, Shield, Users } from 'lucide-react';

export default function ApiDocsPage() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
    // Dynamically import the CSS
    import('swagger-ui-react/swagger-ui.css');
  }, []);
  
  if (!mounted) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }
  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              AppCompatCheck API
            </h1>
            <p className="text-xl text-gray-600">
              Complete REST API documentation for security compatibility analysis
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm">
              Version 1.0.0
            </Badge>
            <Badge variant="outline" className="text-sm">
              OpenAPI 3.0.3
            </Badge>
          </div>
        </div>

        {/* Quick Links & Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Endpoints</CardTitle>
              <Code className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">12+</div>
              <p className="text-xs text-muted-foreground">REST API endpoints</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Features</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">8</div>
              <p className="text-xs text-muted-foreground">Core features</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Security</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">JWT</div>
              <p className="text-xs text-muted-foreground">Bearer token auth</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Multi-Tenant</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">✓</div>
              <p className="text-xs text-muted-foreground">Organization support</p>
            </CardContent>
          </Card>
        </div>

        {/* Getting Started */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Book className="h-5 w-5" />
                Quick Start Guide
              </CardTitle>
              <CardDescription>
                Get up and running with the AppCompatCheck API in minutes
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="min-w-6 h-6 flex items-center justify-center text-xs">
                    1
                  </Badge>
                  <div>
                    <p className="font-medium">Create Account</p>
                    <p className="text-sm text-muted-foreground">Sign up and get your API credentials</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="min-w-6 h-6 flex items-center justify-center text-xs">
                    2
                  </Badge>
                  <div>
                    <p className="font-medium">Authenticate</p>
                    <p className="text-sm text-muted-foreground">Use JWT tokens for API access</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Badge variant="outline" className="min-w-6 h-6 flex items-center justify-center text-xs">
                    3
                  </Badge>
                  <div>
                    <p className="font-medium">Upload & Analyze</p>
                    <p className="text-sm text-muted-foreground">Submit security data for compatibility analysis</p>
                  </div>
                </div>
              </div>
              <Button variant="outline" className="w-full">
                <ExternalLink className="h-4 w-4 mr-2" />
                View Getting Started Guide
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Example Request</CardTitle>
              <CardDescription>
                Sample API call to start a compatibility scan
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-100 rounded-lg p-4 text-sm font-mono">
                <div className="text-green-600"># Start a compatibility scan</div>
                <div className="mt-2">
                  <span className="text-blue-600">curl</span> -X POST \\<br />
                  &nbsp;&nbsp;<span className="text-purple-600">https://api.appcompatcheck.com/scan</span> \\<br />
                  &nbsp;&nbsp;-H <span className="text-orange-600">"Authorization: Bearer YOUR_TOKEN"</span> \\<br />
                  &nbsp;&nbsp;-F <span className="text-orange-600">"file=@security-log.json"</span> \\<br />
                  &nbsp;&nbsp;-F <span className="text-orange-600">"dataType=security_log"</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* API Features */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">API Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: Shield,
                title: 'Security Analysis',
                description: 'Analyze security tool compatibility and detect vulnerabilities'
              },
              {
                icon: Users,
                title: 'Multi-Tenancy',
                description: 'Organization and team management with role-based access'
              },
              {
                icon: Zap,
                title: 'Real-time Monitoring',
                description: 'System health monitoring and performance metrics'
              },
              {
                icon: Book,
                title: 'Detailed Reports',
                description: 'Generate PDF and CSV reports with comprehensive analysis'
              },
              {
                icon: Code,
                title: 'RESTful Design',
                description: 'Clean, predictable REST API following OpenAPI standards'
              },
              {
                icon: ExternalLink,
                title: 'Webhooks',
                description: 'Real-time notifications for scan completion and alerts'
              }
            ].map((feature, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg">
                <feature.icon className="h-8 w-8 text-blue-600 mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Interactive API Documentation */}
      <div className="border border-gray-200 rounded-lg overflow-hidden">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            Interactive API Documentation
          </h2>
          <p className="text-gray-600 mt-1">
            Explore and test all API endpoints directly from your browser
          </p>
        </div>
        
        <div className="bg-white">
          <SwaggerUI
            url="/api/docs"
            docExpansion="list"
            defaultModelsExpandDepth={2}
            defaultModelExpandDepth={2}
            displayRequestDuration={true}
            tryItOutEnabled={true}
            filter={true}
            showExtensions={true}
            showCommonExtensions={true}
            requestInterceptor={(request) => {
              // Add any custom request headers or modifications here
              return request;
            }}
            responseInterceptor={(response) => {
              // Handle responses if needed
              return response;
            }}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="mt-12 pt-8 border-t border-gray-200">
        <div className="text-center">
          <p className="text-gray-600 mb-4">
            Need help? Check out our{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Developer Guide
            </a>{' '}
            or{' '}
            <a href="#" className="text-blue-600 hover:underline">
              Contact Support
            </a>
          </p>
          <div className="flex justify-center gap-4">
            <Button variant="outline" size="sm">
              <ExternalLink className="h-4 w-4 mr-2" />
              SDK Downloads
            </Button>
            <Button variant="outline" size="sm">
              <Code className="h-4 w-4 mr-2" />
              Code Examples
            </Button>
            <Button variant="outline" size="sm">
              <Book className="h-4 w-4 mr-2" />
              Tutorials
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}