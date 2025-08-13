'use client'

import * as React from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { 
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from '@/components/ui/navigation-menu'
import { 
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { Menu, Code, Shield, Users, BarChart3, Globe, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'

const features = [
  {
    title: 'Code Analysis',
    href: '/features/analysis',
    description: 'AI-powered code compatibility analysis',
    icon: Code,
  },
  {
    title: 'Security Scanning',
    href: '/features/security',
    description: 'Comprehensive security vulnerability detection',
    icon: Shield,
  },
  {
    title: 'Team Management',
    href: '/features/teams',
    description: 'Multi-tenant organization management',
    icon: Users,
  },
  {
    title: 'Analytics',
    href: '/features/analytics',
    description: 'Advanced reporting and insights',
    icon: BarChart3,
  },
  {
    title: 'Integrations',
    href: '/features/integrations',
    description: 'Connect with your favorite tools',
    icon: Globe,
  },
]

const solutions = [
  {
    title: 'For Developers',
    href: '/solutions/developers',
    description: 'Individual developer tools and workflows',
  },
  {
    title: 'For Teams',
    href: '/solutions/teams',
    description: 'Collaborative development environments',
  },
  {
    title: 'For Enterprise',
    href: '/solutions/enterprise',
    description: 'Enterprise-grade security and compliance',
  },
]

const resources = [
  {
    title: 'Documentation',
    href: '/docs',
    description: 'Complete API documentation and guides',
  },
  {
    title: 'Blog',
    href: '/blog',
    description: 'Latest updates and best practices',
  },
  {
    title: 'Community',
    href: '/community',
    description: 'Connect with other developers',
  },
  {
    title: 'Support',
    href: '/support',
    description: 'Get help from our support team',
  },
]

const ListItem = React.forwardRef<
  React.ElementRef<'a'>,
  React.ComponentPropsWithoutRef<'a'>
>(({ className, title, children, ...props }, ref) => {
  return (
    <li>
      <NavigationMenuLink asChild>
        <a
          ref={ref}
          className={cn(
            'block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground',
            className
          )}
          {...props}
        >
          <div className="text-sm font-medium leading-none">{title}</div>
          <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
            {children}
          </p>
        </a>
      </NavigationMenuLink>
    </li>
  )
})
ListItem.displayName = 'ListItem'

export function Header() {
  const [isOpen, setIsOpen] = React.useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <div className="mr-4 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <Code className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="hidden font-bold sm:inline-block">
              AppCompatCheck
            </span>
          </Link>
          <NavigationMenu>
            <NavigationMenuList>
              {/* Features */}
              <NavigationMenuItem>
                <NavigationMenuTrigger>Features</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {features.map((feature) => (
                      <ListItem
                        key={feature.title}
                        title={feature.title}
                        href={feature.href}
                      >
                        {feature.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Solutions */}
              <NavigationMenuItem>
                <NavigationMenuTrigger>Solutions</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid gap-3 p-6 md:w-[400px] lg:w-[500px] lg:grid-cols-[.75fr_1fr]">
                    <li className="row-span-3">
                      <NavigationMenuLink asChild>
                        <a
                          className="flex h-full w-full select-none flex-col justify-end rounded-md bg-gradient-to-b from-muted/50 to-muted p-6 no-underline outline-none focus:shadow-md"
                          href="/solutions"
                        >
                          <div className="mb-2 mt-4 text-lg font-medium">
                            Complete Solutions
                          </div>
                          <p className="text-sm leading-tight text-muted-foreground">
                            Tailored solutions for developers, teams, and enterprises.
                          </p>
                        </a>
                      </NavigationMenuLink>
                    </li>
                    {solutions.map((solution) => (
                      <ListItem
                        key={solution.title}
                        title={solution.title}
                        href={solution.href}
                      >
                        {solution.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Resources */}
              <NavigationMenuItem>
                <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
                <NavigationMenuContent>
                  <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 lg:w-[600px]">
                    {resources.map((resource) => (
                      <ListItem
                        key={resource.title}
                        title={resource.title}
                        href={resource.href}
                      >
                        {resource.description}
                      </ListItem>
                    ))}
                  </ul>
                </NavigationMenuContent>
              </NavigationMenuItem>

              {/* Pricing */}
              <NavigationMenuItem>
                <Link href="/pricing" legacyBehavior passHref>
                  <NavigationMenuLink className={cn(
                    'group inline-flex h-10 w-max items-center justify-center rounded-md bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none disabled:pointer-events-none disabled:opacity-50 data-[active]:bg-accent/50 data-[state=open]:bg-accent/50'
                  )}>
                    Pricing
                  </NavigationMenuLink>
                </Link>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>

        {/* Mobile Menu */}
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button
              variant="ghost"
              className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden"
            >
              <Menu className="h-6 w-6" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <SheetHeader>
              <SheetTitle>
                <Link
                  href="/"
                  className="flex items-center space-x-2"
                  onClick={() => setIsOpen(false)}
                >
                  <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                    <Code className="h-5 w-5 text-primary-foreground" />
                  </div>
                  <span className="font-bold">AppCompatCheck</span>
                </Link>
              </SheetTitle>
              <SheetDescription>
                Enterprise compatibility analysis platform
              </SheetDescription>
            </SheetHeader>
            <div className="my-4 h-[calc(100vh-8rem)] pb-10 pl-6">
              <div className="flex flex-col space-y-3">
                <div className="flex flex-col space-y-3">
                  <h4 className="font-medium">Features</h4>
                  {features.map((feature) => (
                    <Link
                      key={feature.href}
                      href={feature.href}
                      onClick={() => setIsOpen(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {feature.title}
                    </Link>
                  ))}
                </div>
                <div className="flex flex-col space-y-3">
                  <h4 className="font-medium">Solutions</h4>
                  {solutions.map((solution) => (
                    <Link
                      key={solution.href}
                      href={solution.href}
                      onClick={() => setIsOpen(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {solution.title}
                    </Link>
                  ))}
                </div>
                <div className="flex flex-col space-y-3">
                  <h4 className="font-medium">Resources</h4>
                  {resources.map((resource) => (
                    <Link
                      key={resource.href}
                      href={resource.href}
                      onClick={() => setIsOpen(false)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      {resource.title}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        {/* Mobile Logo */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-end">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <Link href="/" className="flex items-center space-x-2 md:hidden">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <Code className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold">AppCompatCheck</span>
            </Link>
            <span className="hidden md:block" />
          </div>
          <nav className="flex items-center space-x-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/auth/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/auth/register">
                Sign up
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  )
}