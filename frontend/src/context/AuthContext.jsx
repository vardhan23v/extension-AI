import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

const toAppUser = (user) =>
  user ? { id: user.id, email: user.email, name: user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || '' } : null;

const notConfigured = () => {
  throw new Error('Sign-in is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
};

export const AuthProvider = ({ children }) => {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);

  useEffect(() => {
    if (!supabase) return undefined;
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => sub.subscription.unsubscribe();
  }, []);

  const login = async (email, password) => {
    if (!supabase) notConfigured();
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return toAppUser(data.user);
  };

  // Returns { user, needsConfirmation } — when email confirmation is enabled
  // in Supabase there is no session until the user clicks the email link.
  const register = async (name, email, password) => {
    if (!supabase) notConfigured();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name }, emailRedirectTo: `${window.location.origin}/login` },
    });
    if (error) throw error;
    return { user: toAppUser(data.user), needsConfirmation: !data.session };
  };

  // Redirects to Google; Supabase brings the user back to `next` with a session.
  const loginWithGoogle = async (next = '/dashboard') => {
    if (!supabase) notConfigured();
    // Supabase redirects to a raw error page when a provider is off, so check first.
    const settings = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: import.meta.env.VITE_SUPABASE_ANON_KEY },
    })
      .then((r) => r.json())
      .catch(() => null);
    if (settings && !settings.external?.google) throw new Error('Google sign-in isn’t enabled yet. Use email and password for now.');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}${next}` },
    });
    if (error) {
      throw new Error(/not enabled|unsupported provider/i.test(error.message) ? 'Google sign-in isn’t enabled yet. Use email and password for now.' : error.message);
    }
  };

  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
    setSession(null);
  };

  const value = {
    user: toAppUser(session?.user),
    token: session?.access_token || null,
    loading,
    isAuthenticated: !!session,
    login,
    register,
    loginWithGoogle,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
