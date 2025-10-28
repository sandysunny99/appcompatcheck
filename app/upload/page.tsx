import { getSession } from '@/lib/auth/session';
import { redirect } from 'next/navigation';
import { UploadPageClient } from '@/components/upload/UploadPageClient';

export default async function UploadPage() {
  const session = await getSession();
  
  if (!session?.user) {
    redirect('/sign-in');
  }

  return <UploadPageClient />;
}
