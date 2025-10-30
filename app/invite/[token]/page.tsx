import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import InvitationAcceptance from '@/components/organizations/invitation-acceptance';
import { Loader2 } from 'lucide-react';

interface InvitePageProps {
  params: {
    token: string;
  };
}

export default async function InvitePage({ params }: InvitePageProps) {
  const { token } = params;
  const session = await getSession();

  if (!session?.user) {
    // Redirect to login with return URL
    redirect(`/sign-in?callbackUrl=${encodeURIComponent(`/invite/${token}`)}`);
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-md mx-auto">
        <Suspense fallback={
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        }>
          <InvitationAcceptance 
            token={token} 
            userId={session.user.id}
            userEmail={session.user.email}
          />
        </Suspense>
      </div>
    </div>
  );
}