import {useState} from 'react';
import {Eye,EyeOff,LockKeyhole,LogIn,ShieldCheck} from 'lucide-react';
import {login} from '../api/auth.api';
import {saveAuth} from '../utils/auth-storage';
import type {AuthUser} from '../types/auth.types';
import '../styles/login.css';
interface LoginPageProps {
  onLogin: (
    token: string,
    user: AuthUser,
  ) => void;
}
function LoginPage({onLogin,}: LoginPageProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const result = await login({email, password});
      saveAuth(result.accessToken, result.user);
      onLogin(result.accessToken, result.user);
    } 
    catch (error) {
      setError(error instanceof Error ? error.message : 'Login failed');
    } 
    finally {
      setLoading(false);
    }
  }
  return (
    <main className="login-page">
      <div className="login-background-orb login-orb-one" />
      <div className="login-background-orb login-orb-two" />
      <section className="login-card">
        <div className="login-header">
          <span className="login-eyebrow">
            Internal Operations
          </span>
          <h1>Service Hub</h1>
          <p>Sign in to access your workspace.</p>
        </div>
        <form
          className="login-form"
          onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value,)}
              placeholder="employee@example.com"
              autoComplete="email"
              required/>
          </div>
          <div className="form-field">
            <label htmlFor="password">Password</label>
            <div className="password-input-wrapper">
              <input
                id="password"
                type={
                  showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event,) => setPassword(event.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
                required/>
              <button
                type="button"
                className="password-toggle-button"
                onClick={() => setShowPassword((current) =>!current)}
                aria-label={ showPassword ? 'Hide password' : 'Show password'}>
                {showPassword ? (
                  <EyeOff size={18}/>
                ) : (
                  <Eye size={18}/>
                )}
              </button>
            </div>
          </div>
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          <button
            className="primary-button login-submit-button"
            type="submit"
            disabled={loading}>
            {loading ? (
              <>
                <span className="login-loading-spinner" />
                Signing in...
              </>
            ) : (
              <>
                <LogIn size={18}/>
                Sign In
              </>
            )}
          </button>
        </form>
        <div className="login-security-note">
          <ShieldCheck size={16}/>
          <span>Secure access for authorized company users.</span>
        </div>
        <div className="login-footer-note">
          <LockKeyhole size={14}/>
          <span>Internal system</span>
        </div>
      </section>
    </main>
  );
}
export default LoginPage;