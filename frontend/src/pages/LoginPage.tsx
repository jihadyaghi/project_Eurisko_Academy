import { useState } from 'react';
import { login } from '../api/auth.api';
import { saveAuth } from '../utils/auth-storage';
import type {AuthUser,} from '../types/auth.types';
import '../styles/login.css';

interface LoginPageProps {
  onLogin: (
    token: string,
    user: AuthUser,
  ) => void;
}
function LoginPage({
  onLogin,
}: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(
    event: React.FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await login({
        email,
        password,
      });
      saveAuth(
        result.accessToken,
        result.user,
      );
      onLogin(
        result.accessToken,
        result.user,
      );
    } catch (error) {
      setError( error instanceof Error ? error.message : 'Login failed',);
    } finally {
      setLoading(false);
    }
  }
  return (
    <main className="login-page">
      <section className="login-card">
        <div className="login-header">
          <span className="login-eyebrow">
            Internal Operations
          </span>
          <h1>
            Service Hub
          </h1>
          <p>
            Sign in to access your workspace.
          </p>
        </div>
        <form className="login-form" onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value,)
              }
              placeholder="employee@example.com"
              autoComplete="email"
              required/>
          </div>
          <div className="form-field">
            <label htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(event) =>
                setPassword(event.target.value,)
              }
              placeholder="Enter your password"
              autoComplete="current-password"
              required/>
          </div>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          <button className="primary-button" type="submit" disabled={loading} >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="demo-accounts">
          <p>Demo accounts</p>
          <small>
            Employee:
            {' '}
            employee@example.com
          </small>
          <small>
            Password:
            {' '}
            password123
          </small>
        </div>
      </section>
    </main>
  );
}

export default LoginPage;