import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function PartnerProfileSetup() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: user?.name || '',
    organization: user?.organization || '',
    employeeId: user?.employeeId || '',
    companyEmail: user?.companyEmail || '',
    jobTitle: user?.jobTitle || '',
    department: user?.department || '',
    contactNumber: user?.contactNumber || '',
    companyAddress: user?.companyAddress || '',
  });
  const [error, setError]   = useState('');
  const [busy, setBusy]     = useState(false);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const submit = async (e) => {
    e.preventDefault();
    setError(''); setBusy(true);
    try {
      const { user: updated } = await api('/auth/me/partner-profile', {
        method: 'PATCH', body: form,
      });
      updateUser(updated);
      navigate('/partner', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-page">
      <section className="auth-aside">
        <Link className="brand brand-inverse" to="/"><span className="brand-mark">P</span><span>Prashikshan</span></Link>
        <div>
          <p className="eyebrow eyebrow-light">Industry onboarding</p>
          <h1>Set up your company profile.</h1>
          <p>Tell us about your organisation so students can trust and apply to your opportunities.</p>
        </div>
        <small>This information is stored securely and only used within Prashikshan.</small>
      </section>

      <section className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit}>
          <Link className="mobile-brand brand" to="/"><span className="brand-mark">P</span>Prashikshan</Link>
          <div>
            <p className="eyebrow">Profile setup</p>
            <h2>Complete your details.</h2>
            <p className="muted">Required once — you can update this later from your workspace.</p>
          </div>

          {error && <p className="form-alert">{error}</p>}

          <label>Full name
            <input required value={form.name}
                   onChange={(e) => set('name', e.target.value)}
                   placeholder="Your full name" />
          </label>

          <label>Company / organisation name
            <input required value={form.organization}
                   onChange={(e) => set('organization', e.target.value)}
                   placeholder="e.g. TechCorp India" />
          </label>

          <div className="field-grid">
            <label>Employee ID / company ID
              <input required value={form.employeeId}
                     onChange={(e) => set('employeeId', e.target.value)}
                     placeholder="EMP-001 or CIN" />
            </label>
            <label>Official company email
              <input required type="email" value={form.companyEmail}
                     onChange={(e) => set('companyEmail', e.target.value)}
                     placeholder="you@company.com" />
            </label>
          </div>

          <div className="field-grid">
            <label>Job title / designation
              <input required value={form.jobTitle}
                     onChange={(e) => set('jobTitle', e.target.value)}
                     placeholder="e.g. HR Manager" />
            </label>
            <label>Department <span className="optional">optional</span>
              <input value={form.department}
                     onChange={(e) => set('department', e.target.value)}
                     placeholder="e.g. Human Resources" />
            </label>
          </div>

          <div className="field-grid">
            <label>Contact number
              <input required value={form.contactNumber}
                     onChange={(e) => set('contactNumber', e.target.value)}
                     placeholder="+91 98765 43210" />
            </label>
          </div>

          <label>Company address
            <textarea required value={form.companyAddress}
                      onChange={(e) => set('companyAddress', e.target.value)}
                      placeholder="Full office address" />
          </label>

          <button className="button button-full" disabled={busy}>
            {busy ? 'Saving…' : 'Save profile & continue'}
          </button>
        </form>
      </section>
    </div>
  );
}
