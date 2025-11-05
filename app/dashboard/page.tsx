import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { DashboardViewSelector } from '@/components/dashboard/DashboardViewSelector';
import { Loader2 } from 'lucide-react';

export default async function DashboardPage() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/sign-in');
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12 min-h-screen bg-slate-950">
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-cyan-400 mx-auto mb-4" />
          <p className="text-slate-400 text-sm">Loading Security Dashboard...</p>
        </div>
      </div>
    }>
      <DashboardViewSelector
        userId={session.user.id}
        userEmail={session.user.email}
        organizationId={session.user.organizationId}
      />
    </Suspense>
  );
}
