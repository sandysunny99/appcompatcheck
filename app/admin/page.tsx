import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import { hasPermission, Permission } from '@/lib/auth/permissions';
import { AdminDashboard } from '@/components/admin/AdminDashboard';
import { LoadingSpinner } from '@/components/ui/loading';

export default async function AdminPage() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/auth/login');
  }

  // Check if user has admin system permission
  if (!hasPermission(session.user.role, Permission.ADMIN_SYSTEM)) {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">System Administration</h1>
        <p className="text-gray-600 mt-2">
          Manage system configuration, compatibility rules, users, and organizations.
        </p>
      </div>

      <Suspense fallback={<LoadingSpinner />}>
        <AdminDashboard userId={session.user.id} userRole={session.user.role} />
      </Suspense>
    </div>
  );
}