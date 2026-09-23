import { useState } from 'react';
import LoginPage from './pages/LoginPage';
import EmployeePortal from './pages/EmployeePortal';
import HandlerPortal from './pages/HandlerPortal';
import {clearAuth,getStoredToken,getStoredUser,} from './utils/auth-storage';

import type { AuthUser } from './types/auth.types';
function App() {
  const [token, setToken] = useState<string | null>(getStoredToken(),);
  const [user, setUser] = useState<AuthUser | null>(getStoredUser(),);
  function handleLogin(accessToken: string,authenticatedUser: AuthUser,) {
    setToken(accessToken);
    setUser(authenticatedUser);
  }

  function handleLogout() {
    clearAuth();
    setToken(null);
    setUser(null);
  }

  if (!token || !user) {
    return (
      <LoginPage
        onLogin={handleLogin}/>
    );
  }
  if (user.role === 'EMPLOYEE') {
    return (
      <EmployeePortal
        token={token}
        user={user}
        onLogout={handleLogout}/>
    );
  }
  if (user.role === 'HANDLER') {
    return (
      <HandlerPortal
        token={token}
        user={user}
        onLogout={handleLogout}/>
    );
  }
  return (
    <main className="portal-page">
      <section className="portal-card">
        <h1>Unsupported account role</h1>
        <p>
          This account does not have access to a
          supported workspace.
        </p>
        <button
          className="secondary-button"
          onClick={handleLogout}>
          Sign Out
        </button>
      </section>
    </main>
  );
}
export default App;