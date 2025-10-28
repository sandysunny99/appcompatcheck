import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { hasPermission, Permission } from '@/lib/auth/permissions';
import { SystemScanInterface } from '@/components/scans/SystemScanInterface';

export default async function SystemScanPage() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/sign-in');
  }

  if (!hasPermission(session, Permission.SCAN_CREATE)) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SystemScanInterface 
        userId={session.user.id}
        organizationId={session.user.organizationId}
      />
    </div>
  );
}
