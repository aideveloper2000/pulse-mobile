import { useEffect, useState } from 'react';
import type { User } from '@supabase/supabase-js';
import { supabase } from './supabase';

/** Subscribes to the Supabase auth session. */
export function useAuthUser(): User | null {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (!active) return;
      setUser(data.user ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
      setReady(true);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return ready ? user : null;
}

/** True once the initial session check has settled. */
export function useAuthReady(): boolean {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    supabase.auth.getUser().finally(() => {
      if (active) setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      if (active) setReady(true);
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);
  return ready;
}
