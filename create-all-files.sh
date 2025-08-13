#!/bin/bash

# AppCompatCheck Complete File Creation Script
echo "🚀 Creating all AppCompatCheck project files..."

# First run the structure script
./create-project.sh

echo "📝 Creating core application files..."

# Main App Layout
cat > app/layout.tsx << 'EOF'
import type { Metadata } from 'next'
import './globals.css'
import { Header } from '@/components/header'
import { ThemeProvider } from '@/contexts/theme-context'

export const metadata: Metadata = {
  title: 'AppCompatCheck',
  description: 'Comprehensive Compatibility Analysis Platform',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        <ThemeProvider>
          <div className="relative flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
EOF

# Home Page
cat > app/page.tsx << 'EOF'
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { siteConfig } from '@/lib/config';

export default function HomePage() {
  return (
    <main className="flex-1 flex items-center justify-center">
      <section className="py-20 text-center">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-4xl font-bold text-foreground tracking-tight sm:text-5xl md:text-6xl">
            Welcome to
            <span className="block text-primary">{siteConfig.name}</span>
          </h1>
          <p className="mt-6 text-xl text-muted-foreground max-w-2xl mx-auto">
            Comprehensive Compatibility Analysis Platform with AI-powered scanning
          </p>
          <div className="mt-8">
            <Button
              asChild
              size="lg"
              className="text-lg rounded-full px-8 py-3"
            >
              <a href="/sign-up">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </a>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
EOF

# Config file
cat > lib/config.ts << 'EOF'
export const siteConfig = {
  name: 'AppCompatCheck',
  description: 'Comprehensive Compatibility Analysis Platform',
  url: process.env.BASE_URL || 'http://localhost:3000',
}
EOF

# Global CSS
cat > app/globals.css << 'EOF'
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root {
    --background: 0 0% 100%;
    --foreground: 222.2 84% 4.9%;
    --card: 0 0% 100%;
    --card-foreground: 222.2 84% 4.9%;
    --popover: 0 0% 100%;
    --popover-foreground: 222.2 84% 4.9%;
    --primary: 221.2 83.2% 53.3%;
    --primary-foreground: 210 40% 98%;
    --secondary: 210 40% 96%;
    --secondary-foreground: 222.2 84% 4.9%;
    --muted: 210 40% 96%;
    --muted-foreground: 215.4 16.3% 46.9%;
    --accent: 210 40% 96%;
    --accent-foreground: 222.2 84% 4.9%;
    --destructive: 0 84.2% 60.2%;
    --destructive-foreground: 210 40% 98%;
    --border: 214.3 31.8% 91.4%;
    --input: 214.3 31.8% 91.4%;
    --ring: 221.2 83.2% 53.3%;
    --radius: 0.5rem;
  }

  .dark {
    --background: 222.2 84% 4.9%;
    --foreground: 210 40% 98%;
    --card: 222.2 84% 4.9%;
    --card-foreground: 210 40% 98%;
    --popover: 222.2 84% 4.9%;
    --popover-foreground: 210 40% 98%;
    --primary: 217.2 91.2% 59.8%;
    --primary-foreground: 222.2 84% 4.9%;
    --secondary: 217.2 32.6% 17.5%;
    --secondary-foreground: 210 40% 98%;
    --muted: 217.2 32.6% 17.5%;
    --muted-foreground: 215 20.2% 65.1%;
    --accent: 217.2 32.6% 17.5%;
    --accent-foreground: 210 40% 98%;
    --destructive: 0 62.8% 30.6%;
    --destructive-foreground: 210 40% 98%;
    --border: 217.2 32.6% 17.5%;
    --input: 217.2 32.6% 17.5%;
    --ring: 224.3 76.3% 94.1%;
  }
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
EOF

# Button component
cat > components/ui/button.tsx << 'EOF'
import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/90",
        destructive:
          "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        outline:
          "border border-input bg-background hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 rounded-md px-3",
        lg: "h-11 rounded-md px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
EOF

# Utils
cat > lib/utils.ts << 'EOF'
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
EOF

# Theme Context
cat > contexts/theme-context.tsx << 'EOF'
'use client'

import { createContext, useContext, useEffect, useState } from 'react'

type Theme = 'dark' | 'light' | 'system'

type ThemeProviderProps = {
  children: React.ReactNode
  defaultTheme?: Theme
  storageKey?: string
}

type ThemeProviderState = {
  theme: Theme
  setTheme: (theme: Theme) => void
}

const initialState: ThemeProviderState = {
  theme: 'system',
  setTheme: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
  children,
  defaultTheme = 'system',
  storageKey = 'ui-theme',
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage?.getItem(storageKey) as Theme) || defaultTheme
  )

  useEffect(() => {
    const root = window.document.documentElement

    root.classList.remove('light', 'dark')

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)')
        .matches
        ? 'dark'
        : 'light'

      root.classList.add(systemTheme)
      return
    }

    root.classList.add(theme)
  }, [theme])

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme)
      setTheme(theme)
    },
  }

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext)

  if (context === undefined)
    throw new Error('useTheme must be used within a ThemeProvider')

  return context
}
EOF

# Header component
cat > components/header.tsx << 'EOF'
'use client'

import { siteConfig } from '@/lib/config'
import { Button } from '@/components/ui/button'
import { ThemeControls } from '@/components/theme-controls'

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-between">
        <div className="flex items-center space-x-2">
          <h1 className="text-xl font-bold">{siteConfig.name}</h1>
        </div>
        
        <div className="flex items-center space-x-4">
          <nav className="hidden md:flex items-center space-x-6">
            <a href="/dashboard" className="text-sm font-medium hover:text-primary">
              Dashboard
            </a>
            <a href="/scans" className="text-sm font-medium hover:text-primary">
              Scans
            </a>
            <a href="/reports" className="text-sm font-medium hover:text-primary">
              Reports
            </a>
            <a href="/docs" className="text-sm font-medium hover:text-primary">
              Docs
            </a>
          </nav>
          
          <ThemeControls />
          
          <div className="flex items-center space-x-2">
            <Button variant="ghost" size="sm" asChild>
              <a href="/sign-in">Sign In</a>
            </Button>
            <Button size="sm" asChild>
              <a href="/sign-up">Sign Up</a>
            </Button>
          </div>
        </div>
      </div>
    </header>
  )
}
EOF

# Theme controls
cat > components/theme-controls.tsx << 'EOF'
'use client'

import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/contexts/theme-context'
import { Button } from '@/components/ui/button'

export function ThemeControls() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
    >
      <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
      <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  )
}
EOF

# API Status endpoint
cat > app/api/simple-status/route.ts << 'EOF'
import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
}
EOF

# Middleware
cat > middleware.ts << 'EOF'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Add security headers
  const response = NextResponse.next()
  
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin')
  
  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
EOF

# README.md
cat > README.md << 'EOF'
# AppCompatCheck

Comprehensive Compatibility Analysis Platform - Enterprise-grade code scanning with AI analysis.

## Features

- 🔍 **Advanced Compatibility Scanning** - AI-powered analysis of code compatibility
- 📊 **Real-time Dashboard** - Live monitoring and progress tracking
- 📋 **Comprehensive Reports** - PDF and CSV export capabilities
- 🔒 **Enterprise Security** - JWT authentication with RBAC
- 🏢 **Multi-tenancy** - Organization and team management
- 🔌 **Third-party Integrations** - GitHub, Snyk, Jira, Jenkins, and more
- 📈 **Performance Monitoring** - Real-time system monitoring
- 🧪 **Complete Testing Suite** - Unit, integration, and e2e tests

## Quick Start

```bash
# Install dependencies
npm install

# Set up environment
cp .env.example .env.local

# Start development server
npm run dev
```

Visit http://localhost:3000 to see the application.

## Documentation

- [API Documentation](docs/API.md)
- [Complete Documentation](docs/README.md)

## Testing

```bash
# Run all tests
npm run test:all

# Run specific test suites
npm run test:unit        # Unit tests
npm run test:integration # Integration tests
npm run test:e2e        # End-to-end tests
```

## License

MIT License - see LICENSE file for details.
EOF

echo "✅ Core application files created!"
echo ""
echo "🎯 Next steps:"
echo "1. git add ."
echo "2. git commit -m 'Initial commit: AppCompatCheck application'"
echo "3. git push origin main"
echo ""
echo "📚 For complete file contents, refer to the conversation history."
EOF