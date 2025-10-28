import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Check } from 'lucide-react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { getUser } from '@/lib/db/queries';

export const metadata: Metadata = {
  title: 'Pricing - AppCompatCheck',
  description: 'Choose the perfect plan for your needs',
};

const plans = [
  {
    name: 'Free',
    price: '$0',
    description: 'Perfect for getting started',
    features: [
      '10 scans per month',
      'Basic compatibility checks',
      'Community support',
      'Public repositories only',
    ],
    cta: 'Get Started',
    href: '/sign-up',
  },
  {
    name: 'Pro',
    price: '$29',
    period: '/month',
    description: 'For professional developers',
    features: [
      'Unlimited scans',
      'Advanced analysis',
      'Priority support',
      'Private repositories',
      'API access',
      'Custom rules',
    ],
    cta: 'Start Free Trial',
    href: '/sign-up',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    description: 'For large teams and organizations',
    features: [
      'Everything in Pro',
      'Dedicated support',
      'SLA guarantee',
      'On-premise deployment',
      'Custom integrations',
      'Advanced security',
    ],
    cta: 'Contact Sales',
    href: '/contact',
  },
];

export default async function PricingPage() {
  const user = await getUser();

  return (
    <div className="flex min-h-screen flex-col">
      <Header user={user} />
      
      <main className="flex-1">
        <section className="py-16 sm:py-20 lg:py-24">
          <div className="container">
            <div className="mx-auto max-w-2xl text-center mb-16">
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
                Simple, transparent pricing
              </h1>
              <p className="text-xl text-muted-foreground">
                Choose the plan that's right for you and your team
              </p>
            </div>

            <div className="grid gap-8 md:grid-cols-3 max-w-6xl mx-auto">
              {plans.map((plan) => (
                <Card 
                  key={plan.name}
                  className={plan.popular ? 'border-primary shadow-lg scale-105' : ''}
                >
                  {plan.popular && (
                    <div className="text-center pt-4">
                      <Badge>Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader className="text-center pb-8">
                    <CardTitle className="text-2xl mb-2">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <span className="text-4xl font-bold">{plan.price}</span>
                      {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Button asChild className="w-full mb-6">
                      <Link href={plan.href}>{plan.cta}</Link>
                    </Button>
                    <ul className="space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex items-start">
                          <Check className="h-5 w-5 text-primary mr-2 flex-shrink-0" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
