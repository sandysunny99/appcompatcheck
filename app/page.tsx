import { Metadata } from 'next'
import Link from 'next/link'
import { ArrowRight, Shield, Zap, Users, BarChart3, Code, Globe, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ThemeControls } from '@/components/theme-controls'
import { Header } from '@/components/header'
import { Footer } from '@/components/footer'

export const metadata: Metadata = {
  title: 'Enterprise Compatibility Analysis Platform',
  description: 'Comprehensive code scanning and compatibility analysis with AI-powered insights, real-time monitoring, and enterprise-grade security.',
}

const features = [
  {
    icon: Code,
    title: 'AI-Powered Analysis',
    description: 'Advanced machine learning algorithms analyze your code for compatibility issues, security vulnerabilities, and performance bottlenecks.',
    color: 'text-blue-500'
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Bank-grade security with role-based access control, encrypted data transmission, and compliance with industry standards.',
    color: 'text-green-500'
  },
  {
    icon: Users,
    title: 'Multi-Tenant Architecture',
    description: 'Scalable multi-tenant platform supporting unlimited organizations with isolated data and customizable workflows.',
    color: 'text-purple-500'
  },
  {
    icon: Zap,
    title: 'Real-Time Monitoring',
    description: 'Live dashboard with WebSocket updates, comprehensive metrics, and intelligent alerting system.',
    color: 'text-yellow-500'
  },
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Detailed reports, trend analysis, and actionable insights to improve your software quality over time.',
    color: 'text-red-500'
  },
  {
    icon: Globe,
    title: 'Integration Ecosystem',
    description: 'Seamlessly integrate with GitHub, GitLab, Bitbucket, Jira, Slack, Teams, and custom webhooks.',
    color: 'text-cyan-500'
  }
]

const stats = [
  { value: '10M+', label: 'Lines of Code Analyzed' },
  { value: '5,000+', label: 'Organizations Trust Us' },
  { value: '99.9%', label: 'Uptime Guarantee' },
  { value: '24/7', label: 'Enterprise Support' }
]

const testimonials = [
  {
    quote: "AppCompatCheck transformed our development workflow. The AI-powered insights helped us identify critical compatibility issues before they reached production.",
    author: "Sarah Johnson",
    role: "CTO, TechCorp",
    avatar: "/images/avatars/sarah-johnson.jpg"
  },
  {
    quote: "The multi-tenant architecture and enterprise security features make it perfect for our organization with 200+ developers across different teams.",
    author: "Michael Chen",
    role: "Engineering Director, Innovation Labs",
    avatar: "/images/avatars/michael-chen.jpg"
  },
  {
    quote: "Real-time monitoring and comprehensive reporting give us the visibility we need to maintain high code quality standards.",
    author: "Emily Rodriguez",
    role: "Lead Developer, StartupXYZ",
    avatar: "/images/avatars/emily-rodriguez.jpg"
  }
]

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-b from-background via-background to-muted/50 py-12 sm:py-16 lg:py-20">
          <div className="absolute inset-0 bg-[url('/images/grid.svg')] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]" />
          <div className="container relative">
            <div className="mx-auto max-w-4xl text-center">
              <div className="mb-8 flex justify-center">
                <Badge variant="outline" className="px-4 py-2">
                  🚀 Now with AI-Powered Analysis
                </Badge>
              </div>
              
              <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
                Enterprise{' '}
                <span className="gradient-text">
                  Compatibility Analysis
                </span>{' '}
                Platform
              </h1>
              
              <p className="mx-auto mb-8 max-w-2xl text-xl text-muted-foreground sm:text-2xl">
                Comprehensive code scanning and compatibility analysis with AI-powered insights, 
                real-time monitoring, and enterprise-grade security for modern development teams.
              </p>
              
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button asChild size="lg" className="text-lg">
                  <Link href="/dashboard">
                    Get Started Free
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-lg">
                  <Link href="/demo">
                    Watch Demo
                  </Link>
                </Button>
              </div>
              
              <div className="mt-12 flex items-center justify-center gap-8 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  <span>Enterprise Security</span>
                </div>
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span>SOC 2 Compliant</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4" />
                  <span>99.9% Uptime</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-b bg-muted/30 py-12">
          <div className="container">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-primary md:text-4xl">
                    {stat.value}
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground md:text-base">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-16 sm:py-20 lg:py-24">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Everything you need for{' '}
                <span className="text-primary">code quality</span>
              </h2>
              <p className="mb-16 text-lg text-muted-foreground">
                Powerful features designed for modern development teams who demand 
                excellence, security, and scalability.
              </p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {features.map((feature, index) => (
                <Card key={index} className="relative overflow-hidden border-0 bg-gradient-to-br from-background to-muted/30 shadow-md transition-all hover:shadow-lg">
                  <CardHeader>
                    <div className={`mb-4 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-muted ${feature.color}`}>
                      <feature.icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="bg-muted/30 py-16 sm:py-20 lg:py-24">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Trusted by{' '}
                <span className="text-primary">thousands</span>{' '}
                of developers
              </h2>
              <p className="mb-16 text-lg text-muted-foreground">
                See what development teams around the world are saying about AppCompatCheck.
              </p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {testimonials.map((testimonial, index) => (
                <Card key={index} className="bg-background">
                  <CardContent className="pt-6">
                    <blockquote className="mb-6 text-base leading-relaxed">
                      "{testimonial.quote}"
                    </blockquote>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-muted" />
                      <div>
                        <div className="font-semibold">{testimonial.author}</div>
                        <div className="text-sm text-muted-foreground">
                          {testimonial.role}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 sm:py-20 lg:py-24">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
                Ready to improve your{' '}
                <span className="text-primary">code quality</span>?
              </h2>
              <p className="mb-8 text-lg text-muted-foreground">
                Join thousands of developers who trust AppCompatCheck for their 
                compatibility analysis and code quality needs.
              </p>
              
              <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
                <Button asChild size="lg" className="text-lg">
                  <Link href="/auth/register">
                    Start Free Trial
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="text-lg">
                  <Link href="/contact">
                    Contact Sales
                  </Link>
                </Button>
              </div>
              
              <div className="mt-6 text-sm text-muted-foreground">
                No credit card required • 14-day free trial • Cancel anytime
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
      
      {/* Theme Controls */}
      <div className="fixed bottom-4 right-4">
        <ThemeControls />
      </div>
    </div>
  )
}