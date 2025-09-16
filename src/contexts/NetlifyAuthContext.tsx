import React, { createContext, useState, useEffect, useContext, ReactNode } from 'react';
import netlifyIdentity from 'netlify-identity-widget';
import type { User } from 'netlify-identity-widget';

interface NetlifyAuthContextType {
  user: User | null;
  login: () => void;
  logout: () => void;
  signup: () => void;
  authReady: boolean;
}

const NetlifyAuthContext = createContext<NetlifyAuthContextType | undefined>(undefined);

export const NetlifyAuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);

  // Synchronise le token Netlify Identity avec Supabase à chaque login/session
  useEffect(() => {
    async function syncNetlifyToSupabase() {
      if (user && window.netlifyIdentity && window.netlifyIdentity.currentUser) {
        const jwt = await window.netlifyIdentity.currentUser().jwt();
        console.log('[DEBUG][Provider] Netlify JWT utilisé pour Supabase :', jwt);
        const supabase = require('../hooks/useSupabaseConfig').getSupabase();
        if (supabase.auth && supabase.auth.setSession) {
          await supabase.auth.setSession({ access_token: jwt, refresh_token: jwt });
        }
      }
    }
    syncNetlifyToSupabase();
  }, [user]);

  useEffect(() => {
    // Event listener for login
    netlifyIdentity.on('login', (user: User | null) => {
      setUser(user);
      netlifyIdentity.close(); // Close the modal on login
    });

    // Event listener for logout
    netlifyIdentity.on('logout', () => {
      setUser(null);
    });
    
    // Event listener for init. This will check if a user is already logged in
    netlifyIdentity.on('init', (user: User | null) => {
        setUser(user);
        setAuthReady(true);
    });

    // Initialize Netlify Identity
    netlifyIdentity.init();

    // Cleanup listeners on unmount
    return () => {
      netlifyIdentity.off('login');
      netlifyIdentity.off('logout');
      netlifyIdentity.off('init');
    };
  }, []);

  const login = () => {
    netlifyIdentity.open('login');
  };

  const signup = () => {
    netlifyIdentity.open('signup');
  };

  const logout = () => {
    netlifyIdentity.logout();
  };

  const contextValue = {
    user,
    login,
    logout,
    signup,
    authReady,
  };

  return (
    <NetlifyAuthContext.Provider value={contextValue}>
      {children}
    </NetlifyAuthContext.Provider>
  );
};

export const useNetlifyAuth = () => {
  const context = useContext(NetlifyAuthContext);
  if (context === undefined) {
    throw new Error('useNetlifyAuth must be used within a NetlifyAuthProvider');
  }
  return context;
};
