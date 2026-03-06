import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export type AppRole = 'admin' | 'csr' | 'borrower' | 'broker' | 'lender' | null;

export const EXTERNAL_ROLES: AppRole[] = ['borrower', 'broker', 'lender'];
export const INTERNAL_ROLES: AppRole[] = ['admin', 'csr'];

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole;
  loading: boolean;
  isExternalUser: boolean;
  isInternalUser: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [loading, setLoading] = useState(true);

  const isExternalUser = role !== null && EXTERNAL_ROLES.includes(role);
  const isInternalUser = role !== null && INTERNAL_ROLES.includes(role);

  const fetchUserRole = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching role:', error);
        return null;
      }
      return data?.role as AppRole;
    } catch (error) {
      console.error('Error fetching role:', error);
      return null;
    }
  }, []);

  const applySessionState = useCallback(async (nextSession: Session | null) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);

    if (nextSession?.user) {
      const fetchedRole = await fetchUserRole(nextSession.user.id);
      setRole(fetchedRole);
    } else {
      setRole(null);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, authSession) => {
        void (async () => {
          if (!isMounted) return;

          if (authSession?.user) {
            await applySessionState(authSession);
            if (isMounted) setLoading(false);
            return;
          }

          // Recovery guard: avoid forced redirects on transient tab-return auth glitches.
          if (event === 'SIGNED_OUT') {
            const { data: refreshed, error } = await supabase.auth.refreshSession();
            if (!error && refreshed.session?.user) {
              await applySessionState(refreshed.session);
              if (isMounted) setLoading(false);
              return;
            }
          }

          await applySessionState(null);
          if (isMounted) setLoading(false);
        })();
      }
    );

    // THEN check for existing session
    void (async () => {
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (!isMounted) return;

      await applySessionState(existingSession ?? null);
      if (isMounted) setLoading(false);
    })();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [applySessionState]);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    return { error: error as Error | null };
  };

  const signUp = async (email: string, password: string, fullName: string) => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          full_name: fullName,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signOut = async () => {
    // Clear all workspace session storage on logout
    sessionStorage.removeItem('workspace_openFiles');
    sessionStorage.removeItem('workspace_activeFileId');
    // Clear all deal navigation states (deal-nav-* keys)
    const keysToRemove: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith('deal-nav-')) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach(key => sessionStorage.removeItem(key));
    await supabase.auth.signOut();
    setRole(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      role, 
      loading, 
      isExternalUser,
      isInternalUser,
      signIn, 
      signUp, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};
