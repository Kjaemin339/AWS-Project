import { createContext, useContext, useEffect, useState } from 'react';
import { signIn as cognitoSignIn, signOut as cognitoSignOut, getCurrentUserSession } from '../auth/cognito';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(undefined); // undefined = 세션 확인 중, null = 미로그인
  const [error, setError] = useState('');

  useEffect(() => {
    getCurrentUserSession().then(setSession);
  }, []);

  async function login(email, password) {
    setError('');
    try {
      const s = await cognitoSignIn(email, password);
      setSession(s);
      return true;
    } catch (e) {
      setError(e.message || '로그인에 실패했습니다');
      return false;
    }
  }

  function logout() {
    cognitoSignOut();
    setSession(null);
  }

  const value = {
    isLoading: session === undefined,
    isAuthenticated: !!session,
    idToken: session ? session.idToken : null,
    email: session ? session.email : null,
    error,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
