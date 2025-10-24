import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'

const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'AppCompatCheck - Enterprise Compatibility Analysis Platform',
    template: '%s | AppCompatCheck',
  },
  description: 'Comprehensive compatibility analysis platform for enterprise-grade code scanning with AI-powered insights, multi-tenant architecture, and real-time monitoring.',
  keywords: [
    'compatibility analysis',
    'code scanning',
    'enterprise software',
    'AI analysis',
    'multi-tenant',
    'real-time monitoring',
    'software quality',
    'code review',
    'technical debt',
    'security scanning'
  ],
  authors: [{ name: 'AppCompatCheck Team' }],
  creator: 'AppCompatCheck',
  publisher: 'AppCompatCheck',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: '/',
    title: 'AppCompatCheck - Enterprise Compatibility Analysis Platform',
    description: 'Comprehensive compatibility analysis platform for enterprise-grade code scanning with AI-powered insights.',
    siteName: 'AppCompatCheck',
    images: [
      {
        url: '/images/og-image.png',
        width: 1200,
        height: 630,
        alt: 'AppCompatCheck - Enterprise Compatibility Analysis Platform',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AppCompatCheck - Enterprise Compatibility Analysis Platform',
    description: 'Comprehensive compatibility analysis platform for enterprise-grade code scanning with AI-powered insights.',
    images: ['/images/twitter-image.png'],
    creator: '@appcompatcheck',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/apple-icon-180x180.png', sizes: '180x180', type: 'image/png' },
    ],
    other: [
      { rel: 'mask-icon', url: '/safari-pinned-tab.svg', color: '#0ea5e9' },
    ],
  },
  manifest: '/manifest.json',
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* DNS prefetch for external domains */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        
        {/* Theme color */}
        <meta name="theme-color" content="#0ea5e9" />
        <meta name="msapplication-TileColor" content="#0ea5e9" />
        
        {/* Viewport meta tag for responsive design */}
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=5, viewport-fit=cover"
        />
        
        {/* Security headers via meta tags */}
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="Referrer-Policy" content="origin-when-cross-origin" />
        
        {/* PWA specific meta tags */}
        <meta name="application-name" content="AppCompatCheck" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="AppCompatCheck" />
      </head>
      <body
        className={cn(
          'min-h-screen bg-background font-sans antialiased',
          inter.variable
        )}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {/* Skip to main content link for accessibility */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary text-primary-foreground px-4 py-2 rounded-md z-50"
          >
            Skip to main content
          </a>
          
          {/* Main application content */}
          <div id="main-content" className="relative">
            {children}
          </div>
          
          {/* Global toast notifications */}
          <Toaster />
          
          {/* Global modals and overlays container */}
          <div id="modal-root" />
          <div id="tooltip-root" />
          <div id="popover-root" />
        </ThemeProvider>
        
        {/* Analytics and monitoring scripts */}
        {process.env.NODE_ENV === 'production' && (
          <>
            {/* Google Analytics */}
            {process.env.NEXT_PUBLIC_GA_ID && (
              <>
                <script
                  async
                  src={`https://www.googletagmanager.com/gtag/js?id=${process.env.NEXT_PUBLIC_GA_ID}`}
                />
                <script
                  dangerouslySetInnerHTML={{
                    __html: `
                      window.dataLayer = window.dataLayer || [];
                      function gtag(){dataLayer.push(arguments);}
                      gtag('js', new Date());
                      gtag('config', '${process.env.NEXT_PUBLIC_GA_ID}');
                    `,
                  }}
                />
              </>
            )}
            
            {/* Monitoring and error tracking */}
            {process.env.NEXT_PUBLIC_SENTRY_DSN && (
              <script
                dangerouslySetInnerHTML={{
                  __html: `
                    window.addEventListener('error', function(e) {
                      console.error('Global error:', e.error);
                    });
                    window.addEventListener('unhandledrejection', function(e) {
                      console.error('Unhandled promise rejection:', e.reason);
                    });
                  `,
                }}
              />
            )}
          </>
        )}
        
        {/* Service Worker registration */}
        {typeof window !== 'undefined' && 'serviceWorker' in navigator && (
          <script
            dangerouslySetInnerHTML={{
              __html: `
                if ('serviceWorker' in navigator) {
                  window.addEventListener('load', function() {
                    navigator.serviceWorker.register('/sw.js')
                      .then(function(registration) {
                        console.log('SW registered: ', registration);
                      })
                      .catch(function(registrationError) {
                        console.log('SW registration failed: ', registrationError);
                      });
                  });
                }
              `,
            }}
          />
        )}
      </body>
    </html>
  )
}