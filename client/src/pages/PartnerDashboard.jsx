import { useEffect, useState } from 'react';
import { api, getSession } from '../services/api';
import { useAuth } from '../context/AuthContext';

// Fetches resume with auth header and opens/downloads it in the browser
function ResumeActions({ applicationId, filename }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr]   = useState('');

  const fetchResume = async (mode) => {
    setBusy(true); setErr('');
    try {
      const session = getSession();
      const res = await fetch(
        `${(import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')}/internships/applications/${applicationId}/resume`,
        { headers: session?.token ? { Authorization: `Bearer ${session.token}` } : {} }
      );
      if (!res.ok) { const d = await res.json(); throw new Error(d?.error || 'Failed to fetch resume.'); }
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      if (mode === 'preview') {
        window.open(url, '_blank');
      } else {
        const a = document.createElement('a');
        a.href = url; a.download = filename || 'resume';
        document.body.appendChild(a); a.click();
        document.body.removeChild(a);
      }
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div style={{ padding: '12px 14px', background: '#f8faf6',
                  borderRadius: 6, border: '1px solid #d9e8d0' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 20 }}>📄</span>
        <strong style={{ fontSize: 12, color: '#1e3829', flex: 1,
                         overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {filename || 'resume'}
        </strong>
        <button className="button button-small button-outline" disabled={busy}
                onClick={() => fetchResume('preview')} style={{ fontSize: 10 }}>
          👁 Preview
        </button>
        <button className="button button-small" disabled={busy}
                onClick={() => fetchResume('download')} style={{ fontSize: 10 }}>
          ↓ Download
        </button>
      </div>
      {err && <p className="form-alert" style={{ marginTop: 8, fontSize: 10 }}>{err}</p>}
    </div>
  );
}

// ─── Request Verification Button ──────────────────────────────────────────
function RequestVerificationButton({ onSuccess }) {
  const [busy, setBusy]   = useState(false);
  const [done, setDone]   = useState(false);
  const [error, setError] = useState('');

  const request = async () => {
    setBusy(true); setError('');
    try {
      const data = await api('/auth/me/request-verification', { method: 'PATCH' });
      setDone(true);
      onSuccess(data.user);
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  if (done) return <p className="form-success" style={{ marginTop: 8 }}>Request submitted successfully.</p>;
  return (
    <>
      {error && <p className="form-alert" style={{ marginTop: 8 }}>{error}</p>}
      <button className="button button-small" disabled={busy} onClick={request} style={{ marginTop: 10 }}>
        {busy ? 'Submitting…' : 'Request Verification'}
      </button>
    </>
  );
}

// ─── Dev-Only Verify Button ────────────────────────────────────────────────
// Calls the local dev endpoint to instantly verify the logged-in partner.
// Only works when SEED_DEMO_DATA=true (dev environment). Hidden in production.
function DevVerifyButton({ onVerified }) {
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState('');

  const verify = async () => {
    setBusy(true); setError('');
    try {
      await api('/auth/dev-verify-partner', { method: 'POST' });
      // Refresh session so isVerifiedPartner updates immediately
      const me = await api('/auth/me');
      onVerified(me.user);
    } catch (e) {
      setError(e.message || 'Dev verify failed — is SEED_DEMO_DATA=true on the server?');
    } finally { setBusy(false); }
  };

  return (
    <div style={{ marginTop: 12, padding: '10px 14px', background: '#fff8e8',
                  border: '1px solid #f0d080', borderRadius: 6 }}>
      <strong style={{ fontSize: 11, color: '#7a5500' }}>🛠 Local development only</strong>
      <p style={{ margin: '4px 0 8px', fontSize: 11, color: '#7a5500' }}>
        Skip coordinator approval and verify this account instantly:
      </p>
      {error && <p className="form-alert" style={{ marginBottom: 8 }}>{error}</p>}
      <button className="button button-small" disabled={busy} onClick={verify}
              style={{ background: '#b45309', borderColor: '#b45309' }}>
        {busy ? 'Verifying…' : '⚡ Verify Now (Dev Only)'}
      </button>
    </div>
  );
}

const initialForm = {
  title: '', description: '', skills: '', location: '',
  mode: 'remote', durationWeeks: 12, stipend: 10000, credits: 4, capacity: 1, deadline: '',
};

// ─── Dev-Only Publish Button ───────────────────────────────────────────────
// Instantly publishes a pending internship for student visibility (dev only).
function DevPublishButton({ internshipId, onPublished }) {
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState('');

  const publish = async () => {
    setBusy(true); setError('');
    try {
      await api(`/internships/${internshipId}/dev-publish`, { method: 'POST' });
      onPublished();
    } catch (e) {
      setError(e.message || 'Dev publish failed — is SEED_DEMO_DATA=true on the server?');
    } finally { setBusy(false); }
  };

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
      {error && <small style={{ color: '#943727', fontSize: 9, maxWidth: 180, textAlign: 'right' }}>{error}</small>}
      <button
        className="button button-small"
        disabled={busy}
        onClick={publish}
        style={{ background: '#b45309', borderColor: '#b45309', fontSize: 9, padding: '4px 8px' }}>
        {busy ? 'Publishing…' : '⚡ Publish Now (Dev)'}
      </button>
    </div>
  );
}

const workflowStatuses = ['shortlisted', 'interview', 'offered', 'accepted', 'rejected', 'in-progress', 'completed'];

const STATUS_LABELS = {
  applied: 'Applied', shortlisted: 'Under Review', interview: 'Under Review',
  offered: 'Selected', accepted: 'Selected', rejected: 'Rejected',
  'in-progress': 'Selected', completed: 'Completed',
};

// ─── Applicant Details Modal ───────────────────────────────────────────────
function ApplicantModal({ application, onClose, onStatusChange }) {
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    api(`/internships/applications/${application._id}/details`)
      .then((data) => { setDetails(data); setLoading(false); })
      .catch((e) => { setError(e.message); setLoading(false); });
  }, [application._id]);

  // Notify parent of status change (applied → shortlisted happened on the backend GET)
  useEffect(() => {
    if (details && details.application.status !== application.status) {
      onStatusChange(application._id, details.application.status);
    }
  }, [details]); // eslint-disable-line

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true"
         aria-labelledby="applicant-title" onClick={onClose}>
      <section className="modal" style={{ width: 'min(100%, 580px)', maxHeight: '90vh', overflowY: 'auto' }}
               onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>
        <p className="eyebrow">Applicant Profile</p>
        <h2 id="applicant-title" style={{ margin: '4px 0 6px', fontSize: 22 }}>
          {loading ? 'Loading…' : details?.student?.name}
        </h2>

        {error && <p className="form-alert">{error}</p>}

        {loading && <p className="muted">Fetching applicant details…</p>}

        {details && !loading && (() => {
          const { student, application: app } = details;
          return (
            <>
              {/* Status updated notice */}
              {app.status === 'shortlisted' && (
                <div style={{ padding: '8px 12px', marginBottom: 16, borderRadius: 6,
                              background: '#dbeafe', border: '1px solid #bfdbfe',
                              fontSize: 11, color: '#1d4ed8', fontWeight: 700 }}>
                  Status updated to "Under Review" — student has been notified.
                </div>
              )}

              {/* Basic info */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
                            marginBottom: 18 }}>
                <div className="panel" style={{ padding: 14 }}>
                  <p className="eyebrow" style={{ marginBottom: 6 }}>Contact</p>
                  <p style={{ margin: 0, fontSize: 12, color: '#1e3829' }}>{student.name}</p>
                  <p style={{ margin: '3px 0 0', fontSize: 11, color: '#6b7a6e' }}>{student.email}</p>
                </div>
                <div className="panel" style={{ padding: 14 }}>
                  <p className="eyebrow" style={{ marginBottom: 6 }}>Credits Earned</p>
                  <strong style={{ fontSize: 24, color: '#254a36',
                                   fontFamily: "'Playfair Display', serif" }}>
                    {student.totalCredits.toFixed(1)}
                  </strong>
                  <small style={{ display: 'block', color: '#7a8a7c', fontSize: 10 }}>
                    Total academic credits
                  </small>
                </div>
              </div>

              {/* Skills */}
              {student.skillProfile?.length > 0 && (
                <div style={{ marginBottom: 18 }}>
                  <p className="eyebrow" style={{ marginBottom: 8 }}>Assessed Skills</p>
                  <div className="skill-chips">
                    {student.skillProfile.map((sp) => (
                      <span key={sp.skill} style={{ textTransform: 'capitalize' }}>
                        {sp.skill} — {sp.level} ({sp.score}%)
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Cover letter */}
              {app.coverLetter && (
                <div style={{ marginBottom: 18 }}>
                  <p className="eyebrow" style={{ marginBottom: 6 }}>Cover Note</p>
                  <p style={{ fontSize: 12, color: '#3a4e40', lineHeight: 1.7,
                               padding: '10px 14px', background: '#f8faf6',
                               borderRadius: 6, border: '1px solid #d9e8d0', margin: 0 }}>
                    {app.coverLetter}
                  </p>
                </div>
              )}

              {/* Resume */}
              <div style={{ marginBottom: 18 }}>
                <p className="eyebrow" style={{ marginBottom: 8 }}>Resume</p>
                {app.hasResume ? (
                  <ResumeActions applicationId={app._id} filename={app.resumeFilename} />
                ) : (
                  <p className="empty-inline">No resume was uploaded with this application.</p>
                )}
              </div>

              {/* Completed courses */}
              <div style={{ marginBottom: 18 }}>
                <p className="eyebrow" style={{ marginBottom: 8 }}>
                  Completed Courses ({student.completedCourses.length})
                </p>
                {student.completedCourses.length > 0 ? (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {student.completedCourses.map((c, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
                                            alignItems: 'center', padding: '10px 14px',
                                            background: '#f8faf6', borderRadius: 6,
                                            border: '1px solid #d9e8d0' }}>
                        <div>
                          <strong style={{ fontSize: 12, color: '#1e3829' }}>{c.title}</strong>
                          <small style={{ display: 'block', color: '#6b7a6e',
                                          fontSize: 10 }}>{c.code}</small>
                        </div>
                        <span style={{ padding: '3px 8px', borderRadius: 12, fontSize: 10,
                                       fontWeight: 800, background: '#e1f1df', color: '#1f663c' }}>
                          {c.credits} cr
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="empty-inline">No courses completed yet.</p>
                )}
              </div>

              <button className="button button-outline button-full" onClick={onClose}>
                Close
              </button>
            </>
          );
        })()}
      </section>
    </div>
  );
}

// ─── Main Partner Dashboard ────────────────────────────────────────────────
export default function PartnerDashboard() {
  const { user, updateUser } = useAuth();
  const [internships, setInternships] = useState([]);
  const [applications, setApplications] = useState([]);
  const [form, setForm]   = useState(initialForm);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy]   = useState(false);

  // Applicant details modal
  const [viewApp, setViewApp] = useState(null);

  const load = async () => {
    try {
      const [roles, received] = await Promise.all([
        api('/internships/mine'),
        api('/internships/applications/received'),
      ]);
      setInternships(roles.internships);
      setApplications(received.applications);
    } catch (e) { setError(e.message); }
  };

  useEffect(() => { load(); }, []);

  const update = (key, value) => setForm({ ...form, [key]: value });

  const submit = async (event) => {
    event.preventDefault();
    setError(''); setNotice(''); setBusy(true);
    try {
      const result = await api('/internships', {
        method: 'POST',
        body: {
          ...form,
          skills: form.skills.split(',').map((s) => s.trim()).filter(Boolean),
          durationWeeks: Number(form.durationWeeks),
          stipend: Number(form.stipend),
          credits: Number(form.credits),
          capacity: Number(form.capacity),
        },
      });
      setForm(initialForm);
      setNotice(result.message || 'Internship submitted.');
      await load();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  const move = async (application, status) => {
    try {
      const { application: updated } = await api(`/internships/applications/${application._id}`, {
        method: 'PATCH',
        body: { status, note: `Status updated to ${status}` },
      });
      setApplications((cur) => cur.map((a) => a._id === updated._id ? { ...a, ...updated } : a));
    } catch (e) { setError(e.message); }
  };

  // Called from modal when the GET /details auto-updated the status
  const handleStatusChange = (appId, newStatus) => {
    setApplications((cur) => cur.map((a) =>
      String(a._id) === String(appId) ? { ...a, status: newStatus } : a
    ));
  };

  const INTERNSHIP_STATUS_LABEL = {
    pending:   'Pending Review',
    published: 'Published',
    rejected:  'Rejected',
    closed:    'Closed',
  };

  return (
    <div className="workspace page-width">
      <section className="workspace-hero">
        <div>
          <p className="eyebrow">Industry workspace</p>
          <h1>Build better early careers.</h1>
          <p>Publish supervised opportunities, review applications, and keep student milestones transparent.</p>
        </div>
        <span className={user.isVerifiedPartner ? 'verification-status verified' : 'verification-status'}>
          {user.isVerifiedPartner ? '✓ Organisation verified' : 'Verification pending'}
        </span>
      </section>

      {(error || notice) && <p className={error ? 'form-alert' : 'form-success'}>{error || notice}</p>}

      {/* ── Company profile card ── */}
      <section className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-heading" style={{ marginBottom: 12 }}>
          <div>
            <p className="eyebrow">Company profile</p>
            <h2 style={{ margin: 0 }}>{user.organization || '—'}</h2>
          </div>
          <span className={user.isVerifiedPartner ? 'verification-status verified' : 'verification-status'}>
            {user.isVerifiedPartner ? '✓ Verified' : 'Unverified'}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                      gap: '6px 20px', fontSize: 12, color: '#3a4e40' }}>
          <span><b>Name:</b> {user.name}</span>
          <span><b>Email:</b> {user.email}</span>
          {user.jobTitle      && <span><b>Title:</b> {user.jobTitle}</span>}
          {user.department    && <span><b>Dept:</b> {user.department}</span>}
          {user.employeeId    && <span><b>Employee / CIN:</b> {user.employeeId}</span>}
          {user.companyEmail  && <span><b>Company email:</b> {user.companyEmail}</span>}
          {user.contactNumber && <span><b>Contact:</b> {user.contactNumber}</span>}
          {user.companyAddress && (
            <span style={{ gridColumn: '1 / -1' }}><b>Address:</b> {user.companyAddress}</span>
          )}
        </div>
      </section>

      <div className="metric-grid">
        <div className="metric-card">
          <span>Published</span>
          <strong>{internships.filter((i) => i.status === 'published').length}</strong>
          <small>Visible to students</small>
        </div>
        <div className="metric-card">
          <span>Pending review</span>
          <strong>{internships.filter((i) => i.status === 'pending').length}</strong>
          <small>Awaiting coordinator</small>
        </div>
        <div className="metric-card">
          <span>Rejected</span>
          <strong>{internships.filter((i) => i.status === 'rejected').length}</strong>
          <small>Not approved</small>
        </div>
        <div className="metric-card metric-card-accent">
          <span>Applications</span>
          <strong>{applications.length}</strong>
          <small>Manage each stage</small>
        </div>
      </div>

      {!user.isVerifiedPartner && (
        <section className="panel notice-panel" style={{ marginBottom: 18 }}>
          <b>Your organisation is awaiting verification.</b>
          <p>
            A coordinator must verify your account before you can post internships.
            {user.verificationRequested
              ? ' Your request has been submitted — a coordinator will review it shortly.'
              : ' Click below to notify a coordinator.'}
          </p>
          {!user.verificationRequested && (
            <RequestVerificationButton onSuccess={(updated) => updateUser(updated)} />
          )}
          <DevVerifyButton onVerified={(updated) => { updateUser(updated); load(); }} />
        </section>
      )}

      <div className="partner-layout">
        {/* Internship listings */}
        <section className="panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Opportunity management</p>
              <h2>Your internship listings</h2>
            </div>
          </div>
          {internships.length ? (
            <div className="role-list">
              {internships.map((item) => (
                <div key={item._id}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 3px' }}>{item.title}</h3>
                    <p style={{ margin: '0 0 4px', fontSize: 12, color: '#5a6a5c' }}>
                      {item.location} · <span style={{ textTransform: 'capitalize' }}>{item.mode}</span>
                      {' · '}{item.durationWeeks}w · {item.credits} cr
                      {item.stipend > 0 && ` · ₹${item.stipend.toLocaleString('en-IN')}/mo`}
                    </p>
                    <div className="skill-chips" style={{ margin: '4px 0' }}>
                      {item.skills.map((s) => <span key={s}>{s}</span>)}
                    </div>
                    {item.status === 'pending' && (
                      <small style={{ color: '#946914', fontSize: 10 }}>
                        ⏳ Awaiting coordinator approval before students can see this.
                      </small>
                    )}
                    {item.status === 'rejected' && (
                      <small style={{ color: '#943727', fontSize: 10 }}>
                        ✕ This submission was not approved. You may submit a revised offer.
                      </small>
                    )}
                    <small style={{ display: 'block', color: '#7a8a7c', fontSize: 10, marginTop: 2 }}>
                      Deadline: {new Date(item.deadline).toLocaleDateString('en-IN')}
                    </small>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end',
                                gap: 6, flexShrink: 0 }}>
                    <span className={`status status-${item.status}`}>
                      {INTERNSHIP_STATUS_LABEL[item.status] || item.status}
                    </span>
                    {item.status === 'pending' && (
                      <DevPublishButton internshipId={item._id} onPublished={() => load()} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-inline">No opportunities have been submitted yet.</p>
          )}
        </section>

        {/* Post new internship — verified partners only; no self-publish path */}
        {user.isVerifiedPartner && (
          <section className="panel">
            <p className="eyebrow">New opportunity</p>
            <h2>Post an internship offer</h2>
            <p className="muted" style={{ fontSize: 12, marginBottom: 12 }}>
              Each submission goes to a coordinator for independent review before students can see it.
            </p>
            <form className="stack-form" onSubmit={submit}>
              <label>Role title
                <input required value={form.title}
                       onChange={(e) => update('title', e.target.value)}
                       placeholder="e.g. Product Design Intern" />
              </label>
              <label>Opportunity description
                <textarea required value={form.description}
                          onChange={(e) => update('description', e.target.value)}
                          placeholder="Describe responsibilities, mentorship and outcomes." />
              </label>
              <div className="field-grid">
                <label>Skills (comma separated)
                  <input required value={form.skills}
                         onChange={(e) => update('skills', e.target.value)}
                         placeholder="figma, research" />
                </label>
                <label>Location
                  <input required value={form.location}
                         onChange={(e) => update('location', e.target.value)}
                         placeholder="Remote or city" />
                </label>
              </div>
              <div className="field-grid three">
                <label>Mode
                  <select value={form.mode} onChange={(e) => update('mode', e.target.value)}>
                    <option value="remote">Remote</option>
                    <option value="hybrid">Hybrid</option>
                    <option value="onsite">On-site</option>
                  </select>
                </label>
                <label>Weeks
                  <input min="1" type="number" value={form.durationWeeks}
                         onChange={(e) => update('durationWeeks', e.target.value)} />
                </label>
                <label>Credits
                  <input min="1" type="number" value={form.credits}
                         onChange={(e) => update('credits', e.target.value)} />
                </label>
              </div>
              <div className="field-grid">
                <label>Monthly stipend (₹)
                  <input min="0" type="number" value={form.stipend}
                         onChange={(e) => update('stipend', e.target.value)} />
                </label>
                <label>Application deadline
                  <input required type="date" value={form.deadline}
                         onChange={(e) => update('deadline', e.target.value)} />
                </label>
              </div>
              <button className="button button-full" disabled={busy}>
                {busy ? 'Submitting…' : 'Submit for coordinator review'}
              </button>
            </form>
          </section>
        )}
      </div>

      {/* Applications received */}
      <section className="panel" style={{ marginTop: 18 }}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Candidate collaboration</p>
            <h2>Applications received</h2>
          </div>
        </div>
        {applications.length ? (
          <div className="candidate-list">
            {applications.map((app) => (
              <div className="candidate" key={app._id}>
                <div>
                  <h3>{app.student?.name}</h3>
                  <p>
                    {app.internship?.title} · {app.student?.skills?.join(' · ') || 'Skill profile in progress'}
                  </p>
                  <small>{app.coverLetter || 'No supporting note provided.'}</small>
                </div>
                <div className="candidate-action">
                  <span className={`status status-${app.status}`}>
                    {STATUS_LABELS[app.status] || app.status}
                  </span>
                  <button
                    className="button button-small button-outline"
                    onClick={() => setViewApp(app)}>
                    View Applicant
                  </button>
                  <select
                    value={app.status}
                    onChange={(e) => move(app, e.target.value)}>
                    {workflowStatuses.map((s) => <option value={s} key={s}>{s}</option>)}
                  </select>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-inline">Applications will appear here after a verified listing is published.</p>
        )}
      </section>

      {/* Applicant details modal */}
      {viewApp && (
        <ApplicantModal
          application={viewApp}
          onClose={() => setViewApp(null)}
          onStatusChange={handleStatusChange}
        />
      )}
    </div>
  );
}
