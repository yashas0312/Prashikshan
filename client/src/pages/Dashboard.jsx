import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const formatDate = (value) =>
  value
    ? new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        .format(new Date(value))
    : '—';
const label = (value) => String(value || '').replaceAll('-', ' ');

// ─── Certificate Claim Modal ───────────────────────────────────────────────
// Shows: estimated hours, time elapsed since enrolment, proof-link input,
// and a clear warning if the student is about to trigger the anti-cheat penalty.
function CertificateModal({ enrollment, onClose, onSuccess }) {
  const [certUrl, setCertUrl]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult]     = useState(null);
  const [error, setError]       = useState('');

  const estimatedHours = enrollment.estimatedHours || enrollment.course?.hours || 0;
  const startedAt      = enrollment.startedAt || enrollment.createdAt;
  const elapsedMs      = Date.now() - new Date(startedAt).getTime();
  const elapsedHours   = elapsedMs / 3_600_000;
  const elapsedPct     = estimatedHours
    ? Math.min(100, Math.round((elapsedHours / estimatedHours) * 100))
    : 0;
  const MIN_RATIO      = 0.30;
  const isSuspicious   = estimatedHours > 0 && elapsedHours < MIN_RATIO * estimatedHours;

  // Human-readable elapsed time
  const elapsedLabel = (() => {
    const totalMins = Math.floor(elapsedMs / 60_000);
    if (totalMins < 60)  return `${totalMins} min`;
    const hrs  = Math.floor(totalMins / 60);
    const mins = totalMins % 60;
    return mins ? `${hrs}h ${mins}m` : `${hrs}h`;
  })();

  const submit = async () => {
    if (!certUrl.trim()) { setError('Please paste a certificate URL or proof link.'); return; }
    setError('');
    setSubmitting(true);
    try {
      const data = await api(`/courses/enrollments/${enrollment._id}/complete`, {
        method: 'POST',
        body: { certificateFile: certUrl.trim(), hoursSpent: Math.round(elapsedHours * 10) / 10 },
      });
      setResult(data);
      onSuccess(data);
    } catch (e) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="cert-title">
      <section className="modal" style={{ width: 'min(100%, 560px)' }}>
        <button className="modal-close" onClick={onClose} aria-label="Close">×</button>

        {result ? (
          /* ── Success State ── */
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div style={{ fontSize: 40, marginBottom: 10 }}>
              {result.penaltyApplied ? '⚠️' : '🎓'}
            </div>
            <p className="eyebrow">
              {result.penaltyApplied ? 'Accelerated Completion Detected' : 'Completion Verified'}
            </p>
            <h2 id="cert-title" style={{ margin: '4px 0 12px', fontSize: 26 }}>
              {result.penaltyApplied ? 'Partial Credits Awarded' : 'Credits Claimed!'}
            </h2>
            <div style={{
              padding: '16px', background: result.penaltyApplied ? '#fff8e8' : '#eaf5e7',
              border: `1px solid ${result.penaltyApplied ? '#f0d080' : '#c0ddb8'}`,
              borderRadius: 8, marginBottom: 14, textAlign: 'left',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                            fontSize: 13, fontWeight: 800, color: '#254a36', marginBottom: 8 }}>
                <span>NEP Credits Awarded</span>
                <strong style={{ fontSize: 22, color: result.penaltyApplied ? '#946914' : '#1c563e' }}>
                  {result.creditsAwarded} cr
                </strong>
              </div>
              {result.penaltyApplied && (
                <p style={{ margin: 0, fontSize: 11, color: '#7a5a14', lineHeight: 1.6 }}>
                  {result.completionNote}
                </p>
              )}
              {!result.penaltyApplied && (
                <p style={{ margin: 0, fontSize: 11, color: '#2f6040', lineHeight: 1.6 }}>
                  Full credits awarded. Completion verified — well done!
                </p>
              )}
            </div>
            <button className="button button-full" onClick={onClose}>Back to Dashboard</button>
          </div>
        ) : (
          /* ── Submission Form ── */
          <>
            <p className="eyebrow">Certificate & Credit Claim</p>
            <h2 id="cert-title" style={{ margin: '4px 0 6px', fontSize: 22 }}>
              {enrollment.course?.title}
            </h2>
            <p className="muted" style={{ marginBottom: 20 }}>
              {enrollment.course?.credits} NEP credits · {enrollment.course?.code}
            </p>

            {/* Time-check progress bar */}
            <div style={{
              padding: '16px', borderRadius: 8, marginBottom: 18,
              background: isSuspicious ? '#fffbeb' : '#f2f9f0',
              border: `1px solid ${isSuspicious ? '#f5d060' : '#cce8c4'}`,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between',
                            fontSize: 11, fontWeight: 800,
                            color: isSuspicious ? '#946914' : '#2d6040', marginBottom: 8 }}>
                <span>⏱ Time Verification</span>
                <span>{elapsedLabel} elapsed of ~{estimatedHours}h estimated</span>
              </div>

              {/* Estimated hours bar with MIN_RATIO threshold marker */}
              <div style={{ position: 'relative', height: 10, background: '#e0ece0',
                            borderRadius: 20, overflow: 'visible', marginBottom: 6 }}>
                {/* Elapsed fill */}
                <div style={{
                  height: '100%', width: `${elapsedPct}%`,
                  background: isSuspicious ? '#f0b429' : '#4caf7d',
                  borderRadius: 20, transition: 'width .3s',
                }} />
                {/* 30% threshold tick */}
                <div style={{
                  position: 'absolute', top: -3, bottom: -3,
                  left: `${MIN_RATIO * 100}%`, width: 2,
                  background: '#e05252', borderRadius: 2,
                  transform: 'translateX(-50%)',
                }} />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between',
                            fontSize: 9, color: '#7a8a7c' }}>
                <span>0h</span>
                <span style={{ color: '#e05252', fontWeight: 700 }}>
                  ▲ Min. {Math.round(MIN_RATIO * estimatedHours * 10) / 10}h required
                </span>
                <span>{estimatedHours}h</span>
              </div>

              {isSuspicious && (
                <div style={{
                  marginTop: 10, padding: '8px 10px', borderRadius: 6,
                  background: '#fff0c0', border: '1px solid #f0d080',
                  fontSize: 10, color: '#7a5500', lineHeight: 1.6,
                }}>
                  <strong>⚠ Accelerated completion warning</strong><br />
                  You've spent less than 30% of the expected course time. Submitting now will
                  apply an NEP credit penalty — partial credits will be awarded instead of full.
                  Continue learning to earn the full <strong>{enrollment.course?.credits} credits</strong>.
                </div>
              )}
            </div>

            {/* Proof link input */}
            <label style={{ display: 'flex', flexDirection: 'column', gap: 6,
                            fontSize: 11, fontWeight: 800, color: '#34463a', marginBottom: 18 }}>
              Certificate URL or Proof of Completion
              <input
                type="url"
                value={certUrl}
                onChange={(e) => setCertUrl(e.target.value)}
                placeholder="https://coursera.org/verify/…  or  drive.google.com/…"
                style={{ fontSize: 13 }}
              />
              <small style={{ color: '#8a968c', fontWeight: 500 }}>
                Paste a verifiable link — Coursera certificate, Google Drive upload, GitHub repo, etc.
              </small>
            </label>

            {error && <p className="form-alert" style={{ marginBottom: 14 }}>{error}</p>}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <button className="button button-outline" onClick={onClose}>
                Keep Learning
              </button>
              <button
                className="button"
                disabled={submitting || !certUrl.trim()}
                onClick={submit}
                style={{ background: isSuspicious ? '#b45309' : undefined,
                         borderColor: isSuspicious ? '#b45309' : undefined }}>
                {submitting
                  ? 'Submitting…'
                  : isSuspicious
                  ? 'Submit (Partial Credits)'
                  : 'Claim Full Credits'}
              </button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

// ─── Main Dashboard ────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user, updateUser } = useAuth();

  const [data, setData] = useState({
    courses: [], assessmentCourses: [], enrollments: [], applications: [], internships: [],
  });
  const [analytics, setAnalytics] = useState({
    timeline: [], skillMatrix: [],
    creditBreakdown: { assessment: 0, course: 0, internship: 0, daily_revision: 0, total: 0 },
  });
  const [dailyRevision, setDailyRevision]         = useState(null);
  const [showRevisionModal, setShowRevisionModal]  = useState(false);
  const [revisionAnswers, setRevisionAnswers]      = useState({});
  const [revisionResult, setRevisionResult]        = useState(null);
  const [submittingRevision, setSubmittingRevision] = useState(false);

  // Certificate modal
  const [certEnrollment, setCertEnrollment]   = useState(null); // enrollment object to certify

  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [notice, setNotice]     = useState('');

  // ── Data loader ──────────────────────────────────────────────────────────
  const loadDashboardData = async () => {
    try {
      const [
        courseData, enrollmentData, applicationData, internshipData,
        analyticsData, revisionData, assessmentCourseData,
      ] = await Promise.all([
        api('/courses/recommended'),
        api('/courses/me/enrollments'),
        api('/internships/applications/mine'),
        api('/internships/recommended'),
        api('/assessments/analytics/me').catch(() => ({
          timeline: [], skillMatrix: [],
          creditBreakdown: { total: 0 },
        })),
        api('/assessments/daily-revision').catch(() => null),
        api('/courses/assessment-recommendations').catch(() => ({ courses: [] })),
      ]);

      setData({
        courses:          courseData.courses      || [],
        assessmentCourses: assessmentCourseData.courses || [],
        enrollments:      enrollmentData.enrollments || [],
        applications:     applicationData.applications || [],
        internships:      internshipData.internships || [],
      });

      if (analyticsData) setAnalytics(analyticsData);
      if (revisionData)  setDailyRevision(revisionData);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboardData(); }, []);

  // ── Enroll ───────────────────────────────────────────────────────────────
  const enroll = async (courseId) => {
    setNotice(''); setError('');
    try {
      await api(`/courses/${courseId}/enroll`, { method: 'POST' });
    } catch (e) {
      if (e.status !== 409) { setError(e.message); return; }
      // 409 = already enrolled — fall through and refresh
    }
    // Refresh enrollments so the course appears immediately in "Continue learning"
    try {
      const enrollData = await api('/courses/me/enrollments');
      setData((cur) => ({
        ...cur,
        enrollments: enrollData.enrollments || [],
        courses: cur.courses.map((c) =>
          c._id === courseId ? { ...c, enrolled: true } : c
        ),
        assessmentCourses: cur.assessmentCourses.map((c) =>
          c._id === courseId ? { ...c, enrolled: true } : c
        ),
      }));
    } catch (_) { /* non-critical — full reload on next visit */ }
    setNotice('Course added to your learning plan.');
  };

  // ── Certificate completion callback ─────────────────────────────────────
  const handleCertSuccess = async (result) => {
    const creditLabel = result.penaltyApplied
      ? `Partial credits (${result.creditsAwarded} cr) awarded — accelerated completion penalty applied.`
      : `Course complete — ${result.creditsAwarded} NEP credits added to your record.`;
    setNotice(creditLabel);

    // Refresh user context (credit total changes)
    try {
      const me = await api('/auth/me');
      updateUser(me.user);
    } catch (_) { /* non-critical */ }

    await loadDashboardData();
  };

  // ── Daily revision ───────────────────────────────────────────────────────
  const submitDailyRevision = async () => {
    if (!dailyRevision?.dailyRevision?.questions) return;
    if (Object.keys(revisionAnswers).length < dailyRevision.dailyRevision.questions.length) {
      setError('Answer all 5 daily micro-questions before submitting.');
      return;
    }
    setSubmittingRevision(true);
    setError('');
    try {
      const answersPayload = Object.entries(revisionAnswers).map(([id, value]) => ({
        id: Number(id), value,
      }));
      const result = await api('/assessments/daily-revision/submit', {
        method: 'POST',
        body: { answers: answersPayload },
      });
      setRevisionResult(result);
      setNotice(`Daily Revision completed! +${result.creditAwarded || 0.1} NEP credits added to your record.`);
      const me = await api('/auth/me');
      updateUser(me.user);
      await loadDashboardData();
    } catch (e) { setError(e.message); }
    finally { setSubmittingRevision(false); }
  };

  // ── Render guard ─────────────────────────────────────────────────────────
  if (loading) return <div className="page-loader">Preparing your learning pathway…</div>;

  const completed = data.enrollments.filter((e) => e.status === 'completed').length;

  // SVG Growth Velocity
  const timelinePoints = analytics.timeline.length ? analytics.timeline : [
    { date: 'Day 1',  assessmentScore: 40, revisionScore: 50 },
    { date: 'Day 5',  assessmentScore: 60, revisionScore: 65 },
    { date: 'Day 10', assessmentScore: 75, revisionScore: 80 },
    { date: 'Day 15', assessmentScore: 85, revisionScore: 88 },
  ];
  const svgWidth = 500, svgHeight = 160, padding = 30;
  const getX = (i) => padding + (i / Math.max(timelinePoints.length - 1, 1)) * (svgWidth - 2 * padding);
  const getY = (v) => svgHeight - padding - ((v / 100) * (svgHeight - 2 * padding));
  const assessmentPath = timelinePoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.assessmentScore || 0)}`)
    .join(' ');
  const revisionPath = timelinePoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${getX(i)} ${getY(p.revisionScore || 0)}`)
    .join(' ');

  return (
    <div className="workspace page-width">

      {/* ── HERO ── */}
      <section className="workspace-hero">
        <div>
          <p className="eyebrow">Student workspace</p>
          <h1>Hello, {user.name.split(' ')[0]}.</h1>
          <p>Keep your skills, experience, and academic credit moving in the same direction.</p>
        </div>
        <Link className="button" to="/assessment">Take a skill assessment</Link>
      </section>

      {(error || notice) && (
        <p className={error ? 'form-alert' : 'form-success'}>{error || notice}</p>
      )}

      {/* ── METRIC CARDS ── */}
      <div className="metric-grid">
        <div className="metric-card">
          <span>Credit balance</span>
          <strong>{user.creditTotal || 0}</strong>
          <small>NEP-aligned credits earned</small>
        </div>
        <div className="metric-card">
          <span>Active learning</span>
          <strong>{data.enrollments.filter((e) => e.status === 'enrolled').length}</strong>
          <small>{completed} course{completed === 1 ? '' : 's'} completed</small>
        </div>
        <div className="metric-card">
          <span>Applications</span>
          <strong>{data.applications.length}</strong>
          <small>
            {data.applications.filter((a) => ['accepted', 'in-progress'].includes(a.status)).length} active opportunity
          </small>
        </div>
        <div className="metric-card metric-card-accent">
          <span>Skills profiled</span>
          <strong>{user.skillProfile?.length || 0}</strong>
          <small>Update through an assessment</small>
        </div>
      </div>

      {/* ── DAILY REVISION BANNER ── */}
      <section className="panel" style={{
        background: 'linear-gradient(135deg, #1c4d37 0%, #296b4e 100%)',
        color: 'white', marginBottom: 20,
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between',
                      alignItems: 'center', flexWrap: 'wrap', gap: 15 }}>
          <div>
            <span style={{
              background: '#dcefa1', color: '#163d2b', padding: '3px 8px', borderRadius: 4,
              fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em',
            }}>Daily Revision Engine</span>
            <h2 style={{ color: 'white', margin: '8px 0 4px', fontSize: 22 }}>
              5-Minute Micro Revision Quiz
            </h2>
            <p style={{ color: '#c5ded0', margin: 0, fontSize: 12 }}>
              {dailyRevision?.completed
                ? `Today's micro-quiz complete! Score: ${dailyRevision?.dailyRevision?.score ?? '—'}/${dailyRevision?.dailyRevision?.questions?.length ?? 5} (${dailyRevision?.dailyRevision?.percentage ?? 100}%). +0.1 NEP Credit earned.`
                : 'Targeted revision micro-questions based on your active course enrollments. Earn +0.1 NEP daily credit.'}
            </p>
          </div>
          {dailyRevision?.completed ? (
            <span style={{
              padding: '8px 16px', background: '#d8ee92', color: '#173c2d',
              borderRadius: 5, fontWeight: 800, fontSize: 12,
            }}>✓ Completed Today</span>
          ) : (
            <button
              className="button button-light"
              onClick={() => { setShowRevisionModal(true); setRevisionResult(null); }}>
              Start Daily Micro-Quiz
            </button>
          )}
        </div>
      </section>

      {/* ── ANALYTICS GRID: Growth Velocity + Credit Tracker ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                    gap: 18, marginBottom: 24 }}>

        {/* GROWTH VELOCITY GRAPH */}
        <div className="panel">
          <div className="panel-heading" style={{ marginBottom: 12 }}>
            <div>
              <p className="eyebrow">Growth Velocity</p>
              <h2>Learning Curve</h2>
            </div>
            <span style={{ fontSize: 10, color: '#68786b', fontWeight: 700 }}>30-Day Velocity</span>
          </div>
          <p style={{ fontSize: 11, color: '#637166', marginBottom: 14 }}>
            Plotting Assessment baselines vs. Daily Micro-Revision accuracy trends.
          </p>
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`}
               style={{ width: '100%', height: 'auto', background: '#fcfdfe',
                        borderRadius: 6, border: '1px solid #e2ebd9' }}>
            {[25, 50, 75, 100].map((val) => (
              <g key={val}>
                <line x1={padding} y1={getY(val)} x2={svgWidth - padding} y2={getY(val)}
                      stroke="#edf2ea" strokeDasharray="4 4" />
                <text x={padding - 5} y={Math.max(getY(val) + 3, 12)}
                      fill="#97a599" fontSize="9" textAnchor="end">{val}%</text>
              </g>
            ))}
            <path d={assessmentPath} fill="none" stroke="#2b7550" strokeWidth="2.5" />
            {timelinePoints.map((p, i) => (
              <circle key={`a-${i}`} cx={getX(i)} cy={getY(p.assessmentScore || 0)} r="4" fill="#2b7550" />
            ))}
            <path d={revisionPath} fill="none" stroke="#d69e2e" strokeWidth="2" strokeDasharray="3 3" />
            {timelinePoints.map((p, i) => (
              <circle key={`r-${i}`} cx={getX(i)} cy={getY(p.revisionScore || 0)} r="3" fill="#d69e2e" />
            ))}
          </svg>
          <div style={{ display: 'flex', gap: 20, marginTop: 12, fontSize: 10,
                        color: '#57665a', justifyContent: 'center' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <i style={{ display: 'inline-block', width: 10, height: 10,
                          background: '#2b7550', borderRadius: '50%' }} /> Assessment Score
            </span>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
              <i style={{ display: 'inline-block', width: 10, height: 10,
                          background: '#d69e2e', borderRadius: '50%' }} /> Daily Revision Accuracy
            </span>
          </div>
        </div>

        {/* CREDIT ACCRUAL TRACKER */}
        <div className="panel">
          <div className="panel-heading" style={{ marginBottom: 12 }}>
            <div>
              <p className="eyebrow">NEP Framework</p>
              <h2>Credit Accrual Tracker</h2>
            </div>
            <strong style={{ fontSize: 20, color: '#254a36' }}>{user.creditTotal || 0} cr</strong>
          </div>
          <p style={{ fontSize: 11, color: '#637166', marginBottom: 16 }}>
            Breakdown of verified credits accumulated by source category.
          </p>
          <div style={{ display: 'grid', gap: 14 }}>
            {[
              { label: 'Assessments',        key: 'assessment',    color: '#387854', icon: '📝' },
              { label: 'Course Completion',   key: 'course',        color: '#4a80a8', icon: '📚' },
              { label: 'Verified Internships',key: 'internship',    color: '#8e5ea2', icon: '🏢' },
              { label: 'Daily Revisions',     key: 'daily_revision',color: '#d69e2e', icon: '⚡' },
            ].map((cat) => {
              const amount = analytics.creditBreakdown?.[cat.key] || 0;
              const maxVal = Math.max(analytics.creditBreakdown?.total || 1, 10);
              const pct    = Math.round((amount / maxVal) * 100);
              return (
                <div key={cat.key}>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                                fontSize: 11, fontWeight: 700, color: '#324538', marginBottom: 4 }}>
                    <span>{cat.icon} {cat.label}</span>
                    <span>{amount.toFixed(1)} cr</span>
                  </div>
                  <div className="progress" style={{ height: 7 }}>
                    <i style={{ width: `${pct}%`, background: cat.color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── SKILL MASTERY MATRIX ── */}
      <section className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">3-Tier Competency Engine</p>
            <h2>10-Skill Mastery Matrix</h2>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <span className="level level-beginner">Beginner (&lt;50%)</span>
            <span style={{ padding: '4px 7px', borderRadius: 20, fontSize: 9, fontWeight: 800,
                           background: '#dceaf8', color: '#295b91' }}>Intermediate (50–79%)</span>
            <span style={{ padding: '4px 7px', borderRadius: 20, fontSize: 9, fontWeight: 800,
                           background: '#e1f1df', color: '#1f663c' }}>Legend (≥80%)</span>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
          {(analytics.skillMatrix?.length
            ? analytics.skillMatrix
            : (user.skillProfile?.length
                ? user.skillProfile.map((sp) => ({ skill: sp.skill, level: sp.level || 'beginner', score: sp.score || 0 }))
                : ['html','css','javascript','react','nodejs','python','mongodb','sql','git','dsa','java','cloud','os','dbms'].map((s) => ({ skill: s, level: 'beginner', score: 0 }))
              )
          ).map((item) => {
            const ls = item.level === 'legend'
              ? { bg: '#e1f1df', color: '#1f663c', border: '#bfe0bc' }
              : item.level === 'intermediate'
              ? { bg: '#dceaf8', color: '#295b91', border: '#c0d7f2' }
              : { bg: '#fff0ce', color: '#946914', border: '#f2dcab' };
            return (
              <div key={item.skill} style={{ padding: 14, borderRadius: 7,
                                            border: `1px solid ${ls.border}`, background: '#fdfdfb' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between',
                              alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontWeight: 800, fontSize: 12, color: '#233b2c',
                                 textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {item.skill}
                  </span>
                  <span style={{ padding: '2px 6px', borderRadius: 12, fontSize: 9, fontWeight: 800,
                                 background: ls.bg, color: ls.color, textTransform: 'capitalize' }}>
                    {item.level}
                  </span>
                </div>
                <div className="progress" style={{ height: 5, marginBottom: 6 }}>
                  <i style={{ width: `${item.score}%`, background: ls.color }} />
                </div>
                <small style={{ color: '#7a877c', fontSize: 10 }}>Baseline score: {item.score}%</small>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── WORKSPACE LAYOUT: recommended + applications + sidebar ── */}
      <div className="workspace-layout">
        <div className="workspace-main">

          {/* ASSESSMENT-BASED COURSE RECOMMENDATIONS */}
          {data.assessmentCourses.length > 0 && (
            <section className="panel">
              <div className="panel-heading">
                <div>
                  <p className="eyebrow">Based on your assessment results</p>
                  <h2>Skill-Matched Courses</h2>
                </div>
                <Link to="/courses" className="text-action">Browse all <span>→</span></Link>
              </div>
              <div className="course-list">
                {data.assessmentCourses.slice(0, 6).map((course) => (
                  <article className="course-row" key={course._id}>
                    <div className="course-code">{course.code.split('-')[0]}</div>
                    <div>
                      <span className="tag">{course.level}</span>
                      <h3>{course.title}</h3>
                      <p>{course.skills.join(' · ')}</p>
                      {course.explainabilityTag && (
                        <small style={{ display: 'block', marginTop: 3, color: '#387352',
                                        fontWeight: 700, fontSize: '9.5px' }}>
                          🎯 {course.explainabilityTag}
                        </small>
                      )}
                    </div>
                    <div className="course-meta">
                      <span>{course.hours} hrs</span>
                      <b>{course.credits} cr</b>
                    </div>
                    {course.enrolled ? (
                      <span className="status status-active">Enrolled</span>
                    ) : (
                      <button className="button button-small" onClick={() => enroll(course._id)}>
                        Add course
                      </button>
                    )}
                  </article>
                ))}
              </div>
            </section>
          )}

          {/* RECOMMENDED COURSES */}
          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Multi-Factor Best Path Algorithm</p>
                <h2>Recommended Next Steps</h2>
              </div>
              <Link to="/courses" className="text-action">Browse all <span>→</span></Link>
            </div>
            <div className="course-list">
              {data.courses.slice(0, 4).map((course) => (
                <article className="course-row" key={course._id}>
                  <div className="course-code">{course.code.split('-')[0]}</div>
                  <div>
                    <span className="tag">{course.level}</span>
                    <h3>{course.title}</h3>
                    <p>{course.skills.join(' · ')}</p>
                    {course.explainabilityTag && (
                      <small style={{ display: 'block', marginTop: 3, color: '#387352',
                                      fontWeight: 700, fontSize: '9.5px' }}>
                        💡 {course.explainabilityTag}
                      </small>
                    )}
                  </div>
                  <div className="course-meta">
                    <span>{course.hours} hrs</span>
                    <b>{course.credits} cr</b>
                  </div>
                  {course.enrolled ? (
                    <span className="status status-active">Enrolled</span>
                  ) : (
                    <button className="button button-small" onClick={() => enroll(course._id)}>
                      Add course
                    </button>
                  )}
                </article>
              ))}
              {data.courses.length === 0 && (
                <p className="empty-inline">
                  Complete a skill assessment to unlock a tailored learning plan.
                </p>
              )}
            </div>
          </section>

          {/* APPLICATIONS */}
          <section className="panel">
            <div className="panel-heading">
              <div>
                <p className="eyebrow">Experience record</p>
                <h2>Applications & milestones</h2>
              </div>
              <Link to="/internships" className="text-action">Find opportunities <span>→</span></Link>
            </div>
            {data.applications.length ? (
              <div className="application-list">
                {data.applications.map((app) => (
                  <article className="application-row" key={app._id}>
                    <div>
                      <h3>{app.internship?.title}</h3>
                      <p>{app.internship?.organization} · Applied {formatDate(app.createdAt)}</p>
                    </div>
                    <div className="application-status">
                      <span className={`status status-${app.status}`}>{label(app.status)}</span>
                      <small>{app.progress}% milestone progress</small>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state compact">
                <strong>No applications yet.</strong>
                <p>Explore verified internships matched to your evolving skill profile.</p>
                <Link className="button button-small" to="/internships">Browse internships</Link>
              </div>
            )}
          </section>
        </div>

        {/* SIDEBAR */}
        <aside className="workspace-side">
          <section className="panel">
            <p className="eyebrow">My skill profile</p>
            <h2>Where you are today</h2>
            {user.skillProfile?.length ? (
              <div className="skill-stack">
                {user.skillProfile.map((skill) => (
                  <div key={skill.skill}>
                    <div>
                      <span>{skill.skill}</span>
                      <b>{skill.score}%</b>
                    </div>
                    <div className="progress"><i style={{ width: `${skill.score}%` }} /></div>
                    <small>{skill.level}</small>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-inline">Your profile starts with a quick assessment.</div>
            )}
            <Link className="button button-outline button-full" to="/assessment">
              {user.skillProfile?.length ? 'Reassess skills' : 'Start assessment'}
            </Link>
          </section>

          <section className="panel opportunity-panel">
            <p className="eyebrow">Matched opportunities</p>
            <h2>Worth a closer look</h2>
            {data.internships.slice(0, 2).map((item) => (
              <div className="opportunity-mini" key={item._id}>
                <span>{item.matchScore}% match</span>
                <h3>{item.title}</h3>
                <p>{item.organization} · {item.mode}</p>
              </div>
            ))}
            <Link className="text-action" to="/internships">View all verified roles <span>→</span></Link>
          </section>
        </aside>
      </div>

      {/* ── CONTINUE LEARNING — with Certificate Claim ── */}
      <section className="panel progress-panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Course activity</p>
            <h2>Continue learning</h2>
          </div>
        </div>

        {data.enrollments.length ? (
          data.enrollments.map((enrollment) => {
            const isCompleted    = enrollment.status === 'completed';
            const estimatedHours = enrollment.estimatedHours || enrollment.course?.hours || 0;
            const startedAt      = enrollment.startedAt || enrollment.createdAt;
            const elapsedHours   = startedAt
              ? (Date.now() - new Date(startedAt).getTime()) / 3_600_000
              : 0;
            const MIN_RATIO    = 0.30;
            const isSuspicious = estimatedHours > 0 && elapsedHours < MIN_RATIO * estimatedHours;

            return (
              <div key={enrollment._id} style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0,1fr) minmax(160px,.55fr) auto',
                alignItems: 'center', gap: 22, padding: '16px 0',
                borderTop: '1px solid #ebefea',
              }}>
                {/* Course info */}
                <div>
                  <h3 style={{ margin: '0 0 3px', fontSize: 13, color: '#243c2c',
                               letterSpacing: '-.02em' }}>
                    {enrollment.course?.title}
                  </h3>
                  <p style={{ margin: 0, color: '#7b887e', fontSize: 10 }}>
                    {enrollment.course?.code} · {enrollment.course?.credits} credits
                    {estimatedHours > 0 && ` · ~${estimatedHours}h estimated`}
                  </p>
                  {/* Time elapsed indicator */}
                  {!isCompleted && estimatedHours > 0 && (
                    <p style={{ margin: '4px 0 0', fontSize: 9, fontWeight: 700,
                                color: isSuspicious ? '#946914' : '#387352' }}>
                      {isSuspicious ? '⚠ ' : '✓ '}
                      {elapsedHours < 1
                        ? `${Math.round(elapsedHours * 60)}m elapsed`
                        : `${Math.round(elapsedHours * 10) / 10}h elapsed`}
                      {' '}of {estimatedHours}h
                      {isSuspicious && ' — keep learning to earn full credits'}
                    </p>
                  )}
                </div>

                {/* Progress bar */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between',
                                fontSize: 10, color: '#7d897f', marginBottom: 5 }}>
                    <span>{enrollment.progress}% complete</span>
                  </div>
                  <div className="progress">
                    <i style={{ width: `${enrollment.progress}%` }} />
                  </div>
                </div>

                {/* Action */}
                {isCompleted ? (
                  <div style={{ display: 'grid', gap: 4, justifyItems: 'end' }}>
                    <span className="status status-completed">Completed</span>
                    {enrollment.completionNote && (
                      <small style={{ fontSize: 9, color: '#946914', maxWidth: 160, textAlign: 'right' }}>
                        ⚠ Partial credits
                      </small>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <Link
                      to="/courses"
                      state={{ openCourseId: enrollment.course?._id }}
                      className="button button-small button-outline"
                      style={{ textDecoration: 'none', fontSize: 10 }}
                    >
                      Learn ▶
                    </Link>
                    <button
                      className="button button-small"
                      style={{
                        background: isSuspicious ? 'transparent' : undefined,
                        color: isSuspicious ? '#946914' : undefined,
                        borderColor: isSuspicious ? '#e0b030' : undefined,
                        fontSize: 10,
                      }}
                      onClick={() => setCertEnrollment(enrollment)}>
                      {isSuspicious ? '⚠ Claim Credits' : 'Submit Certificate'}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <p className="empty-inline">
            When you add a course, its progress and earned credits will appear here.
          </p>
        )}
      </section>

      {/* ── CERTIFICATE MODAL ── */}
      {certEnrollment && (
        <CertificateModal
          enrollment={certEnrollment}
          onClose={() => setCertEnrollment(null)}
          onSuccess={(result) => {
            handleCertSuccess(result);
            // Keep modal open to show result state — modal closes itself via Back button
          }}
        />
      )}

      {/* ── DAILY REVISION QUIZ MODAL ── */}
      {showRevisionModal && dailyRevision?.dailyRevision && (
        <div className="modal-backdrop" role="presentation">
          <section className="modal" style={{ width: 'min(100%, 620px)' }}>
            <button className="modal-close" onClick={() => setShowRevisionModal(false)}>×</button>
            <p className="eyebrow">Daily Micro-Revision</p>
            <h2>Knowledge Retention Quiz</h2>
            <p className="muted">5 quick questions on active course topics (+0.1 NEP Credit).</p>

            {revisionResult ? (
              <div style={{ textAlign: 'center', padding: '20px 0' }}>
                <h3 style={{ fontSize: 24, color: '#1e3829' }}>Revision Complete!</h3>
                <p style={{ fontSize: 18, fontWeight: 800, color: '#2f6946', margin: '10px 0' }}>
                  Score: {revisionResult.score} / {revisionResult.total} ({revisionResult.percentage}%)
                </p>
                <p className="form-success">
                  +{revisionResult.creditAwarded || 0.1} NEP Academic Credit added to your profile.
                </p>
                <button className="button button-full" style={{ marginTop: 20 }}
                        onClick={() => setShowRevisionModal(false)}>
                  Back to Dashboard
                </button>
              </div>
            ) : (
              <div>
                <div style={{ display: 'grid', gap: 16, maxHeight: '55vh',
                              overflowY: 'auto', paddingRight: 6, margin: '18px 0' }}>
                  {dailyRevision.dailyRevision.questions.map((question, index) => (
                    <div key={index} style={{ padding: 14, border: '1px solid #dce4da',
                                             borderRadius: 6, background: '#fcfdfc' }}>
                      <p style={{ fontSize: 10, textTransform: 'uppercase', color: '#387352',
                                  fontWeight: 800, margin: '0 0 4px' }}>
                        {index + 1}. {question.skill}
                      </p>
                      <h4 style={{ margin: '0 0 10px', fontSize: 13, color: '#253d2d' }}>
                        {question.prompt}
                      </h4>
                      <div className="answer-options" style={{ gridTemplateColumns: '1fr' }}>
                        {question.options.map((opt) => (
                          <button
                            key={opt}
                            className={revisionAnswers[index] === opt ? 'chosen' : ''}
                            onClick={() => setRevisionAnswers({ ...revisionAnswers, [index]: opt })}>
                            <span>{String.fromCharCode(65 + question.options.indexOf(opt))}</span> {opt}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  className="button button-large button-full"
                  disabled={
                    submittingRevision ||
                    Object.keys(revisionAnswers).length < dailyRevision.dailyRevision.questions.length
                  }
                  onClick={submitDailyRevision}>
                  {submittingRevision ? 'Evaluating Answers…' : 'Submit Revision Quiz'}
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
}
