import { useCallback, useEffect, useMemo, useState } from 'react';
import { Hub } from 'aws-amplify/utils';
import { getCurrentUser, signOut as amplifySignOut } from 'aws-amplify/auth';
import { client } from '../lib/amplify';
import { run } from '../lib/api';
import { SessionContext } from './Session';

async function loadSession() {
  let userId;
  try {
    ({ userId } = await getCurrentUser());
  } catch {
    return { status: 'signedOut' };
  }
  try {
    const profile = await run(client.models.Profile.get({ userId }));
    if (!profile) {
      return { status: 'needsProfile', userId };
    }
    const privateProfile = await run(client.models.PrivateProfile.get({ userId }));
    return { status: 'ready', userId, profile, privateProfile };
  } catch (error) {
    console.error('[session] could not load the profile', error);
    return { status: 'error', userId, error };
  }
}

/**
 * `status` is `loading`, `signedOut`, `needsProfile` (signed in, profile not created yet) or
 * `ready` (with `profile` and `privateProfile`).
 */
export function SessionProvider({ children }) {
  const [session, setSession] = useState({ status: 'loading' });

  const refresh = useCallback(async () => {
    setSession(await loadSession());
  }, []);

  useEffect(() => {
    let active = true;
    const load = () => loadSession().then((loaded) => active && setSession(loaded));
    load();
    const stopListening = Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedIn' || payload.event === 'signedOut') {
        load();
      }
    });
    return () => {
      active = false;
      stopListening();
    };
  }, []);

  const signOut = useCallback(async () => {
    await amplifySignOut();
    setSession({ status: 'signedOut' });
  }, []);

  const value = useMemo(() => ({ ...session, refresh, signOut }), [session, refresh, signOut]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}
