import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import ConnectRepoClient from './ConnectRepoClient';

export default async function ConnectRepoPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  return <ConnectRepoClient userEmail={user.email!} />;
}
