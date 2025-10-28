import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session';
import InvitationAcceptance from '@/components/organizations/invitation-acceptance';
import { LoadingSpinner } from '@/components/ui/loading';

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
        <Suspense fallback={<LoadingSpinner />}>
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