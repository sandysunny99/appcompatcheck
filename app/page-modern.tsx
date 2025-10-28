import { Metadata } from 'next';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { Hero } from '@/components/landing/Hero';
import { Features } from '@/components/landing/Features';
import { getUser } from '@/lib/db/queries';

export const metadata: Metadata = {
  title: 'Enterprise Compatibility Analysis Platform',
  description: 'AI-powered code scanning and compatibility analysis with real-time monitoring and enterprise-grade security.',
};

export default async function HomePage() {
  const user = await getUser();
  
  return (
    <div className="flex min-h-screen flex-col bg-[#0F0F1E]">
      <Header user={user} />
      
      <main className="flex-1">
        {/* Modern Hero Section with 3D Effects */}
        <Hero />
        
        {/* Modern Features Section with 3D Cards */}
        <Features />
        
        {/* More sections can be added here */}
      </main>
      
      <Footer />
    </div>
  );
}
