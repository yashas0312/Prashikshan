import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const { authenticate } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const submit = async (event) => {
    event.preventDefault(); setError(''); setBusy(true);
    try {
      const session = await api('/auth/login', { method: 'POST', body: form });
      authenticate(session);
      // Redirect each role to their correct home
      let dest;
      if (session.user?.role === 'coordinator') {
        dest = '/coordination';
      } else if (session.user?.role === 'partner') {
        dest = session.user?.isProfileComplete
          ? (location.state?.from || '/partner')
          : '/partner-setup';
      } else if (session.user?.role === 'student' && !session.user?.isAssessed) {
        dest = '/industry-awareness';
      } else {
        dest = location.state?.from || '/dashboard';
      }
      navigate(dest, { replace: true });
    }
    catch (requestError) { setError(requestError.message); }
    finally { setBusy(false); }
  };
  return <div className="auth-page"><section className="auth-aside"><Link className="brand brand-inverse" to="/"><span className="brand-mark">P</span><span>Prashikshan</span></Link><div><p className="eyebrow eyebrow-light">Welcome back</p><h1>Continue building<br />a career with proof.</h1><p>Your learning, applications, milestones, and credits stay connected in one place.</p></div><small>Transparent pathways for experiential learning.</small></section><section className="auth-form-wrap"><form className="auth-form" onSubmit={submit}><Link className="mobile-brand brand" to="/"><span className="brand-mark">P</span>Prashikshan</Link><div><p className="eyebrow">Sign in</p><h2>Your workspace is ready.</h2><p className="muted">Enter your details to continue.</p></div>{error && <p className="form-alert">{error}</p>}<label>Email address<input type="email" autoComplete="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="you@example.com" /></label><label>Password<input type="password" autoComplete="current-password" minLength="8" required value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Your password" /></label><button className="button button-full" disabled={busy}>{busy ? 'Signing in…' : 'Sign in'}</button><p className="form-footer">New to Prashikshan? <Link to="/register">Create an account</Link></p></form></section></div>;
}
