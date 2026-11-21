import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Exactly 10 decimal digits — matches the backend indianMobilePattern.
const PHONE_RE = /^\d{10}$/;

const BRANCHES = ['CSE', 'ISE', 'ECE', 'EEE', 'ME', 'Civil', 'Chemical', 'IT', 'AIDS', 'AIML', 'Data Science', 'Cyber Security', 'Other'];
const YEARS = [1, 2, 3, 4, 5];
const currentYear = new Date().getFullYear();
const GRAD_YEARS = Array.from({ length: 10 }, (_, i) => currentYear + i - 1);

const INITIAL_FORM = {
  name: '', email: '', password: '', confirmPassword: '',
  role: 'student', organization: '', department: '',
  // Student academic fields
  collegeName: '', branch: '', yearOfStudy: '', cgpa: '', graduationYear: '', collegeEmail: '', studentContact: '',
};


export default function Register() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [busy, setBusy] = useState(false);

  const { authenticate } = useAuth();
  const navigate = useNavigate();

  const update = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  // Strip every non-digit character, cap at 10, then update state and inline error.
  const handlePhone = (raw) => {
    const digits = raw.replace(/\D/g, '').slice(0, 10);
    update('studentContact', digits);
    if (digits.length === 0)      setPhoneError('');
    else if (digits.length < 10)  setPhoneError('Mobile number must be exactly 10 digits.');
    else                          setPhoneError('');
  };

  const submit = async (event) => {
    event.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (form.role === 'student') {
      const cgpaNum = Number(form.cgpa);
      if (form.cgpa !== '' && (Number.isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10)) {
        setError('CGPA must be a number between 0 and 10.');
        return;
      }
      if (!PHONE_RE.test(form.studentContact)) {
        setError('Contact number must be exactly 10 digits (e.g. 9876543210).');
        return;
      }
    }

    setBusy(true);
    try {
      const { confirmPassword: _c, ...payload } = form;
      if (payload.role === 'student') {
        payload.yearOfStudy    = Number(payload.yearOfStudy);
        payload.cgpa           = payload.cgpa !== '' ? Number(payload.cgpa) : '';
        payload.graduationYear = Number(payload.graduationYear);
      }
      const session = await api('/auth/register', { method: 'POST', body: payload });
      authenticate(session);
      navigate(session.user.role === 'student' ? '/assessment' : '/partner', { replace: true });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  };

  const isStudent = form.role === 'student';

  return (
    <div className="auth-page">
      <section className="auth-aside">
        <Link className="brand brand-inverse" to="/">
          <span className="brand-mark">P</span>
          <span>Prashikshan</span>
        </Link>
        <div>
          <p className="eyebrow eyebrow-light">Start your pathway</p>
          <h1>Learning that leads<br />somewhere real.</h1>
          <p>Build a visible record of skills, credits, and industry experience.</p>
        </div>
        <small>For learners and verified industry partners.</small>
      </section>

      <section className="auth-form-wrap">
        <form className="auth-form" onSubmit={submit}>
          <Link className="mobile-brand brand" to="/">
            <span className="brand-mark">P</span>Prashikshan
          </Link>

          <div>
            <p className="eyebrow">Create account</p>
            <h2>Choose your role.</h2>
            <p className="muted">
              Students can assess and apply. Partners submit opportunities for verification.
            </p>
          </div>

          {error && <p className="form-alert">{error}</p>}

          {/* Role picker */}
          <div className="role-picker">
            <button
              type="button"
              className={form.role === 'student' ? 'selected' : ''}
              onClick={() => update('role', 'student')}
            >
              <b>Student</b>
              <span>Learn, apply and earn credits</span>
            </button>
            <button
              type="button"
              className={form.role === 'partner' ? 'selected' : ''}
              onClick={() => update('role', 'partner')}
            >
              <b>Industry partner</b>
              <span>Offer supervised internships</span>
            </button>
          </div>

          {/* Name + Email */}
          <div className="field-grid">
            <label>
              Full name
              <input
                required
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                placeholder="Your full name"
              />
            </label>
            <label>
              Email address
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => update('email', e.target.value)}
                placeholder="you@example.com"
              />
            </label>
          </div>

          {/* Partner-only field */}
          {form.role === 'partner' && (
            <label>
              Organisation
              <input
                required
                value={form.organization}
                onChange={(e) => update('organization', e.target.value)}
                placeholder="Organisation name"
              />
            </label>
          )}

          <label>
            Department or programme <span className="optional">optional</span>
            <input
              value={form.department}
              onChange={(e) => update('department', e.target.value)}
              placeholder="e.g. Computer Science"
            />
          </label>

          {/* ── Student academic fields ── */}
          {isStudent && (
            <>
              <div style={{ borderTop: '1px solid #e2e8df', paddingTop: 4 }}>
                <p className="eyebrow" style={{ marginBottom: 2 }}>Academic details</p>
                <p className="muted" style={{ fontSize: 11, margin: '0 0 14px' }}>
                  Used to match you with the right opportunities and courses.
                </p>
              </div>

              <label>
                College / University name
                <input
                  required
                  value={form.collegeName}
                  onChange={(e) => update('collegeName', e.target.value)}
                  placeholder="e.g. VTU, Anna University, BITS Pilani"
                />
              </label>

              <div className="field-grid">
                <label>
                  Branch / Department
                  <select
                    required
                    value={form.branch}
                    onChange={(e) => update('branch', e.target.value)}
                  >
                    <option value="">Select branch</option>
                    {BRANCHES.map((b) => <option key={b} value={b}>{b}</option>)}
                  </select>
                </label>
              </div>

              <div className="field-grid three">
                <label>
                  Year of study
                  <select
                    required
                    value={form.yearOfStudy}
                    onChange={(e) => update('yearOfStudy', e.target.value)}
                  >
                    <option value="">Year</option>
                    {YEARS.map((y) => <option key={y} value={y}>Year {y}</option>)}
                  </select>
                </label>
                <label>
                  Current CGPA
                  <input
                    type="number"
                    required
                    min="0"
                    max="10"
                    step="0.01"
                    value={form.cgpa}
                    onChange={(e) => update('cgpa', e.target.value)}
                    placeholder="e.g. 8.4"
                  />
                </label>
                <label>
                  Graduation year
                  <select
                    required
                    value={form.graduationYear}
                    onChange={(e) => update('graduationYear', e.target.value)}
                  >
                    <option value="">Year</option>
                    {GRAD_YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </label>
              </div>

              <div className="field-grid">
                <label>
                  College email address
                  <input
                    type="email"
                    required
                    value={form.collegeEmail}
                    onChange={(e) => update('collegeEmail', e.target.value)}
                    placeholder="you@college.edu.in"
                  />
                </label>
                <label>
                  Contact number
                  <input
                    type="text"
                    inputMode="numeric"
                    required
                    maxLength={10}
                    value={form.studentContact}
                    onChange={(e) => handlePhone(e.target.value)}
                    placeholder="10-digit mobile number"
                    style={phoneError ? { borderColor: '#d9534f', boxShadow: '0 0 0 3px #fde8e6' } : undefined}
                  />
                  {phoneError && (
                    <span style={{ color: '#943727', fontSize: 10, fontWeight: 600, marginTop: 2 }}>
                      {phoneError}
                    </span>
                  )}
                </label>
              </div>
            </>
          )}

          {/* Password */}
          <div className="field-grid">
            <label>
              Password
              <input
                type="password"
                minLength="8"
                required
                value={form.password}
                onChange={(e) => update('password', e.target.value)}
                placeholder="At least 8 characters"
              />
            </label>
            <label>
              Confirm password
              <input
                type="password"
                minLength="8"
                required
                value={form.confirmPassword}
                onChange={(e) => update('confirmPassword', e.target.value)}
                placeholder="Repeat password"
              />
            </label>
          </div>

          <button className="button button-full" disabled={busy}>
            {busy ? 'Creating account…' : 'Create account'}
          </button>

          <p className="form-footer">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </form>
      </section>
    </div>
  );
}
