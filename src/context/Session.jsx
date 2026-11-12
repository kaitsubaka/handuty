import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Hub } from 'aws-amplify/utils';
import { getCurrentUser, signOut as amplifySignOut } from 'aws-amplify/auth';
import { client } from '../lib/amplify';
import { run } from '../lib/api';

const SessionContext = createContext(null);

/**
 * `status` is `loading`, `signedOut`, `needsProfile` (signed in, profile not created yet) or
 * `ready` (with `profile` and `privateProfile`).
 */
export function SessionProvider({ children }) {
  const [session, setSession] = useState({ status: 'loading' });

  const refresh = useCallback(async () => {
    let userId;
    try {
      ({ userId } = await getCurrentUser());
    } catch {
      setSession({ status: 'signedOut' });
      return;
    }
    try {
      const profile = await run(client.models.Profile.get({ userId }));
      if (!profile) {
        setSession({ status: 'needsProfile', userId });
        return;
      }
      const privateProfile = await run(client.models.PrivateProfile.get({ userId }));
      setSession({ status: 'ready', userId, profile, privateProfile });
    } catch (error) {
      console.error('[session] could not load the profile', error);
      setSession({ status: 'error', userId, error });
    }
  }, []);

  useEffect(() => {
    refresh();
    return Hub.listen('auth', ({ payload }) => {
      if (payload.event === 'signedIn' || payload.event === 'signedOut') {
        refresh();
      }
    });
  }, [refresh]);

  const signOut = useCallback(async () => {
    await amplifySignOut();
    setSession({ status: 'signedOut' });
  }, []);

  const value = useMemo(() => ({ ...session, refresh, signOut }), [session, refresh, signOut]);

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
