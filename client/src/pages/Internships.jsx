import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const formatDate = (value) =>
  new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    .format(new Date(value));

// ─── Resume Match Engine (pure client-side, no extra endpoint needed) ──────
// Tokenises the resume text into skill tokens and scores each internship by
// how many of its required skills appear in the resume blob.
const SKILL_ALIASES = {
  'js': 'javascript', 'node': 'nodejs', 'node.js': 'nodejs',
  'ml': 'machine learning', 'ai': 'artificial intelligence',
  'ts': 'typescript', 'react.js': 'react', 'reactjs': 'react',
  'mongo': 'mongodb', 'postgres': 'postgresql', 'pg': 'postgresql',
  'k8s': 'kubernetes', 'tf': 'tensorflow',
};

function tokeniseResume(text) {
  const lower = text.toLowerCase();
  const tokens = new Set();
  // Grab every 1-3 word sequence so "machine learning" and "node.js" both match
  const words = lower.match(/[\w.#+]+/g) || [];
  words.forEach((w) => {
    const canon = SKILL_ALIASES[w] || w;
    tokens.add(canon);
  });
  // Two-word phrases
  for (let i = 0; i < words.length - 1; i++) {
    const phrase = `${words[i]} ${words[i + 1]}`;
    tokens.add(SKILL_ALIASES[phrase] || phrase);
  }
  return tokens;
}

function scoreInternship(internship, resumeTokens) {
  if (!resumeTokens.size) return internship.matchScore || 0;
  const skills = (internship.skills || []).map((s) => s.toLowerCase());
  if (!skills.length) return 0;
  const hits = skills.filter((s) => resumeTokens.has(SKILL_ALIASES[s] || s)).length;
  return Math.round((hits / skills.length) * 100);
}

// ─── Gartner quadrant helpers ─────────────────────────────────────────────
const QUADRANT_COLORS = {
  Leaders:      { node: '#165731', bg: '#ebf5e9', text: '#165731' },
  Challengers:  { node: '#2b543d', bg: '#f5f9f6', text: '#2b543d' },
  Visionaries:  { node: '#265d8c', bg: '#f3f8fc', text: '#265d8c' },
  'Niche Players': { node: '#57695c', bg: '#fdfdfb', text: '#57695c' },
};

// ─── Main Component ────────────────────────────────────────────────────────
export default function Internships() {
  const { user } = useAuth();

  const [internships, setInternships]         = useState([]);
  const [partnersQuadrant, setPartnersQuadrant] = useState([]);
  const [activeTab, setActiveTab]             = useState('listings');
  const [hoveredPartner, setHoveredPartner]   = useState(null);

  // Standard filters
  const [query, setQuery] = useState('');
  const [mode, setMode]   = useState('');

  // Applied internship IDs for the current user (persisted via backend)
  const [appliedIds, setAppliedIds] = useState(new Set());
  // Full application objects keyed by internship ID — for status display
  const [applicationMap, setApplicationMap] = useState(new Map());

  // Status modal
  const [statusApp, setStatusApp] = useState(null);

  // Resume match state
  const [showResumePanel, setShowResumePanel] = useState(false);
  const [resumeText, setResumeText]           = useState('');
  const [resumeTokens, setResumeTokens]       = useState(new Set());
  const [resumeActive, setResumeActive]       = useState(false);

  // Quadrant partner-click filter
  const [quadrantOrgFilter, setQuadrantOrgFilter] = useState('');

  // Application modal
  const [selected, setSelected] = useState(null);
  const [letter, setLetter]     = useState('');
  const [resumeFile, setResumeFile] = useState(null);
  const [resumeError, setResumeError] = useState('');
  const [applyBusy, setApplyBusy] = useState(false);
  const [error, setError]       = useState('');
  const [notice, setNotice]     = useState('');

  // Partner — post internship form
  const initialPostForm = { title: '', description: '', skills: '', location: '', mode: 'remote', durationWeeks: 12, stipend: 10000, credits: 4, deadline: '' };
  const [postForm, setPostForm]   = useState(initialPostForm);
  const [postBusy, setPostBusy]   = useState(false);
  const [showPostForm, setShowPostForm] = useState(false);
  const updatePost = (k, v) => setPostForm((f) => ({ ...f, [k]: v }));
  const submitPost = async (e) => {
    e.preventDefault();
    setError(''); setNotice(''); setPostBusy(true);
    try {
      await api('/internships', {
        method: 'POST',
        body: {
          title: postForm.title,
          description: postForm.description,
          skills: postForm.skills.split(',').map((s) => s.trim()).filter(Boolean),
          location: postForm.location,
          mode: postForm.mode,
          durationWeeks: Number(postForm.durationWeeks),
          stipend: Number(postForm.stipend),
          credits: Number(postForm.credits),
          deadline: postForm.deadline,
        },
      });
      setPostForm(initialPostForm);
      setShowPostForm(false);
      setNotice('Internship submitted for coordinator verification. It will appear to students once approved.');
    } catch (err) { setError(err.message); }
    finally { setPostBusy(false); }
  };

  // Partner — role preview modal (for "Post a Role" on listing cards)
  const [previewRole, setPreviewRole] = useState(null); // internship object from listings
  const [previewDeadline, setPreviewDeadline] = useState('');
  const [previewBusy, setPreviewBusy] = useState(false);
  // Partner's own posted internships (for filter + duplicate check)
  const [myPostedRoles, setMyPostedRoles] = useState([]);
  // Filter by partner's own role title (replaces "applied" filter)
  // true = show only this partner's posted internships
  const [myRolesActive, setMyRolesActive] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      api('/internships'),
      api('/internships/partners/quadrant').catch(() => ({ partners: [] })),
      user?.role === 'student'
        ? api('/internships/applications/mine').catch(() => ({ applications: [] }))
        : Promise.resolve({ applications: [] }),
      user?.role === 'partner'
        ? api('/internships/mine').catch(() => ({ internships: [] }))
        : Promise.resolve({ internships: [] }),
    ]).then(([internshipData, quadrantData, applicationData, myRolesData]) => {
      if (!active) return;
      setInternships(internshipData.internships || []);
      setPartnersQuadrant(quadrantData.partners || []);
      const ids = new Set(
        (applicationData.applications || [])
          .map((a) => String(a.internship?._id || a.internship))
          .filter(Boolean)
      );
      setAppliedIds(ids);
      const appMap = new Map(
        (applicationData.applications || []).map((a) => [
          String(a.internship?._id || a.internship),
          a,
        ])
      );
      setApplicationMap(appMap);
      setMyPostedRoles(myRolesData.internships || []);
    }).catch((e) => { if (active) setError(e.message); });
    return () => { active = false; };
  }, []);

  // ── Apply resume match ────────────────────────────────────────────────────
  const applyResume = () => {
    const tokens = tokeniseResume(resumeText);
    setResumeTokens(tokens);
    setResumeActive(true);
    setShowResumePanel(false);
    // Switch to listings tab so results are visible
    setActiveTab('listings');
    // If a partner was clicked in quadrant, keep it; otherwise clear
  };

  const clearResume = () => {
    setResumeText('');
    setResumeTokens(new Set());
    setResumeActive(false);
  };

  // ── Ranked & filtered internship list ────────────────────────────────────
  const rankedInternships = useMemo(() => {
    return internships
      .map((item) => ({
        ...item,
        resumeScore: scoreInternship(item, resumeTokens),
      }))
      .sort((a, b) =>
        resumeActive ? b.resumeScore - a.resumeScore : 0
      );
  }, [internships, resumeTokens, resumeActive]);

  // Set of internship IDs posted by this partner (for "My Roles" filter)
  const myPostedIds = new Set(myPostedRoles.map((r) => String(r._id)));

  const shown = rankedInternships.filter((item) => {
    const textMatch = `${item.title} ${item.organization} ${item.skills.join(' ')}`
      .toLowerCase()
      .includes(query.toLowerCase());
    const isApplied = appliedIds.has(String(item._id));

    // Student applied filter
    if (mode === 'applied') return isApplied && textMatch;
    // Standard mode + org filters
    const modeMatch = !mode || item.mode === mode;
    const orgMatch  = !quadrantOrgFilter || item.organization === quadrantOrgFilter;
    // Partner "My Roles" filter — composable with mode
    const myRolesMatch = !myRolesActive || myPostedIds.has(String(item._id));
    return textMatch && modeMatch && orgMatch && myRolesMatch && (user?.role === 'partner' ? true : !isApplied);
  });

  // ── Fallback demo data for quadrant ──────────────────────────────────────
  const displayPartners = partnersQuadrant.length ? partnersQuadrant : [
    { organization: 'TechCorp India',      x: 88, y: 82, quadrant: 'Leaders',       activeInternships: 4, totalCreditsOffered: 16, totalApplicantsHired: 12, avgStudentGrade: 92 },
    { organization: 'InnoLabs Global',     x: 82, y: 70, quadrant: 'Leaders',       activeInternships: 3, totalCreditsOffered: 14, totalApplicantsHired: 7,  avgStudentGrade: 95 },
    { organization: 'ScaleShift Systems',  x: 42, y: 78, quadrant: 'Challengers',   activeInternships: 5, totalCreditsOffered: 20, totalApplicantsHired: 18, avgStudentGrade: 80 },
    { organization: 'ByteCraft Solutions', x: 55, y: 38, quadrant: 'Niche Players', activeInternships: 2, totalCreditsOffered: 16, totalApplicantsHired: 4,  avgStudentGrade: 85 },
    { organization: 'Prashikshan Demo',    x: 76, y: 42, quadrant: 'Visionaries',   activeInternships: 1, totalCreditsOffered: 4,  totalApplicantsHired: 3,  avgStudentGrade: 88 },
  ];

  const apply = async () => {
    setResumeError('');
    if (!resumeFile) { setResumeError('Please attach your resume (PDF, DOC, or DOCX).'); return; }
    const allowed = ['application/pdf', 'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowed.includes(resumeFile.type)) {
      setResumeError('Only PDF, DOC, and DOCX files are accepted.');
      return;
    }
    if (resumeFile.size > 5 * 1024 * 1024) {
      setResumeError('File must be under 5 MB.');
      return;
    }
    setError(''); setNotice(''); setApplyBusy(true);
    try {
      const session = JSON.parse(localStorage.getItem('prashikshan_session') || 'null');
      const formData = new FormData();
      formData.append('resume', resumeFile);
      formData.append('coverLetter', letter);
      const res = await fetch(
        `${(import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')}/internships/${selected._id}/apply`,
        { method: 'POST', headers: session?.token ? { Authorization: `Bearer ${session.token}` } : {}, body: formData }
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Application failed.');
      const internshipId = String(selected._id);
      setAppliedIds((prev) => new Set([...prev, internshipId]));
      setApplicationMap((prev) => new Map([...prev, [internshipId, { ...data.application, internship: selected }]]));
      setNotice(`Application sent to ${selected.organization}. You can track it in your workspace.`);
      setSelected(null); setLetter(''); setResumeFile(null);
    } catch (e) { setError(e.message); }
    finally { setApplyBusy(false); }
  };

  // ── Tab button style helper ───────────────────────────────────────────────
  const tabStyle = (tab) => ({
    padding: '10px 18px', border: 'none', background: 'transparent',
    fontWeight: 800, fontSize: 13, cursor: 'pointer',
    color: activeTab === tab ? '#1c563e' : '#6b7a6e',
    borderBottom: activeTab === tab ? '3px solid #1c563e' : '3px solid transparent',
  });

  // Match score badge colour
  const badgeStyle = (score) => {
    if (score >= 75) return { bg: '#e1f1df', color: '#1f663c' };
    if (score >= 40) return { bg: '#fff0ce', color: '#946914' };
    return { bg: '#f0f0f0', color: '#6b7a6e' };
  };

  return (
    <div className="opportunities page-width">

      {/* ── HEADING ── */}
      <section className="opportunity-heading">
        <div>
          <p className="eyebrow">Verified opportunities & Partner Ratings</p>
          <h1>Real experience.<br />A visible record.</h1>
          <p>Every listing is reviewed before publication, with application status and supervised progress in one place.</p>
        </div>
        <div className="verification-card">
          <span>✓</span>
          <div>
            <b>Prashikshan verified</b>
            <p>Partner and opportunity review completed before students can apply.</p>
          </div>
        </div>
      </section>

      {(error || notice) && (
        <p className={error ? 'form-alert' : 'form-success'}>{error || notice}</p>
      )}

      {/* ── POST INTERNSHIP (partner only) ── */}
      {user?.role === 'partner' && (
        <div style={{ marginBottom: 22 }}>
          <button
            className={showPostForm ? 'button button-outline' : 'button'}
            onClick={() => setShowPostForm((v) => !v)}>
            {showPostForm ? '✕ Cancel' : '+ Post Internship'}
          </button>

          {showPostForm && (
            <section className="panel" style={{ marginTop: 14 }}>
              <p className="eyebrow">New opportunity</p>
              <h2 style={{ marginBottom: 18 }}>Post an internship offer</h2>

              {/* Verification gate — shown only when not verified */}
              {!user.isVerifiedPartner ? (
                <div style={{ padding: '14px 16px', background: '#fffbeb',
                              border: '1px solid #f0d080', borderRadius: 7 }}>
                  <strong style={{ fontSize: 12, color: '#7a5500' }}>
                    ⚠ Organisation not yet verified
                  </strong>
                  <p style={{ margin: '6px 0 0', fontSize: 12, color: '#7a5500', lineHeight: 1.6 }}>
                    A coordinator must verify your account before you can post internships.
                    Go to your <a href="/partner" style={{ color: '#b45309', fontWeight: 700 }}>Industry Workspace</a> to
                    request verification or use the dev-only instant verification button.
                  </p>
                </div>
              ) : (
              <form className="stack-form" onSubmit={submitPost}>
                <label>Role title
                  <input required value={postForm.title}
                         onChange={(e) => updatePost('title', e.target.value)}
                         placeholder="e.g. Frontend Engineering Intern" />
                </label>
                <label>Description
                  <textarea required value={postForm.description}
                             onChange={(e) => updatePost('description', e.target.value)}
                             placeholder="Responsibilities, mentorship, eligibility, outcomes…" />
                </label>
                <div className="field-grid">
                  <label>Required skills (comma-separated)
                    <input required value={postForm.skills}
                           onChange={(e) => updatePost('skills', e.target.value)}
                           placeholder="react, javascript, css" />
                  </label>
                  <label>Location
                    <input required value={postForm.location}
                           onChange={(e) => updatePost('location', e.target.value)}
                           placeholder="Remote or city name" />
                  </label>
                </div>
                <div className="field-grid three">
                  <label>Mode
                    <select value={postForm.mode} onChange={(e) => updatePost('mode', e.target.value)}>
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                      <option value="onsite">On-site</option>
                    </select>
                  </label>
                  <label>Duration (weeks)
                    <input min="1" type="number" value={postForm.durationWeeks}
                           onChange={(e) => updatePost('durationWeeks', e.target.value)} />
                  </label>
                  <label>NEP Credits
                    <input min="1" type="number" value={postForm.credits}
                           onChange={(e) => updatePost('credits', e.target.value)} />
                  </label>
                </div>
                <div className="field-grid">
                  <label>Monthly stipend (₹)
                    <input min="0" type="number" value={postForm.stipend}
                           onChange={(e) => updatePost('stipend', e.target.value)} />
                  </label>
                  <label>Application deadline
                    <input required type="date" value={postForm.deadline}
                           onChange={(e) => updatePost('deadline', e.target.value)} />
                  </label>
                </div>
                <button className="button button-full" disabled={postBusy}>
                  {postBusy ? 'Submitting…' : 'Submit for verification'}
                </button>
              </form>
              )}
            </section>
          )}
        </div>
      )}

      {/* ── SMART RESUME MATCH BANNER ── */}
      {user?.role === 'student' && (
        <div style={{
          marginBottom: 22, padding: '16px 22px',
          background: resumeActive
            ? 'linear-gradient(135deg, #1c4d37 0%, #296b4e 100%)'
            : 'linear-gradient(135deg, #234b38 0%, #2d6047 100%)',
          borderRadius: 9, color: 'white',
          display: 'flex', alignItems: 'center',
          justifyContent: 'space-between', flexWrap: 'wrap', gap: 14,
        }}>
          <div>
            <span style={{
              background: '#dcefa1', color: '#163d2b', padding: '2px 8px', borderRadius: 4,
              fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
              letterSpacing: '0.08em', display: 'inline-block', marginBottom: 6,
            }}>Smart Match Engine</span>
            <h3 style={{ margin: '0 0 3px', fontSize: 16, color: 'white',
                         fontFamily: "'Playfair Display', serif" }}>
              {resumeActive
                ? `Resume match active — showing best-fit roles first`
                : 'Match internships to your resume or skill summary'}
            </h3>
            <p style={{ margin: 0, fontSize: 11, color: '#c5ded0' }}>
              {resumeActive
                ? `${shown.length} role${shown.length !== 1 ? 's' : ''} ranked by resume alignment`
                : 'Paste your resume text or list your skills — roles re-rank by fit score instantly.'}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
            {resumeActive && (
              <button
                onClick={clearResume}
                style={{
                  padding: '8px 14px', borderRadius: 5, border: '1px solid rgba(255,255,255,0.4)',
                  background: 'transparent', color: 'white', fontSize: 11, fontWeight: 700,
                  cursor: 'pointer',
                }}>
                ✕ Clear match
              </button>
            )}
            <button
              className="button button-light"
              onClick={() => setShowResumePanel((v) => !v)}>
              {showResumePanel ? 'Close' : resumeActive ? 'Edit resume' : '✦ Smart Match via Resume'}
            </button>
          </div>
        </div>
      )}

      {/* ── RESUME INPUT PANEL (expands inline) ── */}
      {showResumePanel && (
        <div style={{
          marginBottom: 22, padding: '22px 24px',
          background: '#f8faf6', border: '1px solid #cce0c4',
          borderRadius: 9, boxShadow: '0 4px 18px rgba(0,0,0,.06)',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
            {/* Text area */}
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 800,
                              color: '#34463a', marginBottom: 7 }}>
                Paste resume text or skill summary
              </label>
              <textarea
                rows={7}
                value={resumeText}
                onChange={(e) => setResumeText(e.target.value)}
                placeholder={`Paste your resume or just list skills, e.g.\n\nPython, Pandas, SQL, Tableau, Power BI\nMachine learning, scikit-learn, TensorFlow\nData analysis, visualization, Excel`}
                style={{ fontSize: 12, lineHeight: 1.6, resize: 'vertical' }}
              />
              <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                <button
                  className="button"
                  disabled={!resumeText.trim()}
                  onClick={applyResume}
                  style={{ flex: 1 }}>
                  ✦ Rank internships by match
                </button>
                <button
                  className="button button-outline"
                  onClick={() => setShowResumePanel(false)}>
                  Cancel
                </button>
              </div>
            </div>

            {/* How it works */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div>
                <p className="eyebrow" style={{ marginBottom: 6 }}>How Smart Match works</p>
                <p style={{ fontSize: 12, color: '#607366', lineHeight: 1.7, margin: 0 }}>
                  The engine tokenises your resume into individual skills and two-word phrases,
                  then scores each internship by how many of its required skills appear in your text.
                  Roles are re-ranked from highest to lowest match percentage — no data leaves your browser.
                </p>
              </div>
              <div style={{ padding: '14px', background: 'white',
                            border: '1px solid #d8e8d0', borderRadius: 7 }}>
                <p style={{ fontSize: 10, fontWeight: 800, color: '#2d5240', margin: '0 0 8px' }}>
                  Match score legend
                </p>
                {[
                  { label: '≥ 75% — Strong match',   bg: '#e1f1df', color: '#1f663c' },
                  { label: '40–74% — Partial match', bg: '#fff0ce', color: '#946914' },
                  { label: '< 40% — Low overlap',    bg: '#f0f0f0', color: '#6b7a6e' },
                ].map((tier) => (
                  <div key={tier.label} style={{ display: 'flex', alignItems: 'center',
                                                 gap: 8, marginBottom: 5 }}>
                    <span style={{ padding: '2px 7px', borderRadius: 10, fontSize: 9,
                                   fontWeight: 800, background: tier.bg, color: tier.color }}>
                      {tier.label.split('—')[0].trim()}
                    </span>
                    <span style={{ fontSize: 10, color: '#607366' }}>
                      {tier.label.split('—')[1].trim()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── TABS ── */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid #e2ebd9',
                    marginBottom: 25, paddingBottom: 2 }}>
        <button style={tabStyle('listings')} onClick={() => { setActiveTab('listings'); setQuadrantOrgFilter(''); }}>
          📋 Verified Opportunities ({shown.length})
        </button>
        <button style={tabStyle('quadrant')} onClick={() => setActiveTab('quadrant')}>
          📊 Partner Ratings — Gartner Quadrant
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 1: LISTINGS
      ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'listings' && (
        <>
          {/* Active filters bar */}
          {(resumeActive || quadrantOrgFilter) && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center',
                          marginBottom: 16, flexWrap: 'wrap' }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#6b7a6e' }}>Active filters:</span>
              {resumeActive && (
                <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 10,
                               fontWeight: 800, background: '#e1f1df', color: '#1f663c' }}>
                  ✦ Resume match active
                </span>
              )}
              {quadrantOrgFilter && (
                <span style={{ display: 'flex', alignItems: 'center', gap: 5,
                               padding: '3px 10px', borderRadius: 12, fontSize: 10,
                               fontWeight: 800, background: '#dceaf8', color: '#295b91' }}>
                  🏢 {quadrantOrgFilter}
                  <button
                    onClick={() => setQuadrantOrgFilter('')}
                    style={{ border: 'none', background: 'none', cursor: 'pointer',
                             color: '#295b91', fontSize: 12, padding: 0, lineHeight: 1 }}>
                    ×
                  </button>
                </span>
              )}
            </div>
          )}

          <div className="opportunity-tools">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by role, organisation or skill"
            />
            <div className="filter-bar">
              {['', 'remote', 'hybrid', 'onsite'].map((m) => (
                <button key={m || 'all'} className={mode === m && !myRolesActive ? 'active' : ''}
                        onClick={() => { setMode(m); setMyRolesActive(false); }}>
                  {m || 'all modes'}
                </button>
              ))}
              {/* Student: "applied" filter. Partner: "my roles" filter */}
              {user?.role === 'student' && (
                <button
                  className={mode === 'applied' ? 'active' : ''}
                  onClick={() => { setMode('applied'); setMyRolesActive(false); }}>
                  applied
                </button>
              )}
              {user?.role === 'partner' && (
                <button
                  className={myRolesActive ? 'active' : ''}
                  onClick={() => {
                    setMyRolesActive((v) => !v);
                    setMode('');
                  }}>
                  my roles
                </button>
              )}
            </div>
          </div>

          <div className="internship-grid">
            {shown.map((item) => {
              const bs = resumeActive ? badgeStyle(item.resumeScore) : null;
              return (
                <article className="internship-card" key={item._id}
                         style={{ position: 'relative' }}>
                  <div className="internship-card-top">
                    <span className="verified-badge">Verified</span>
                    <span>{item.mode}</span>
                  </div>

                  {/* Resume match badge — only shown when Smart Match is active */}
                  {resumeActive && (
                    <div style={{
                      display: 'inline-flex', alignItems: 'center', gap: 5,
                      marginBottom: 6, padding: '3px 9px', borderRadius: 12,
                      background: bs.bg, color: bs.color, fontSize: 9, fontWeight: 800,
                    }}>
                      <span style={{ fontSize: 11 }}>
                        {item.resumeScore >= 75 ? '★' : item.resumeScore >= 40 ? '◐' : '○'}
                      </span>
                      {item.resumeScore}% Resume Match
                    </div>
                  )}

                  <h2>{item.title}</h2>
                  <p className="organisation">{item.organization}</p>
                  <p>{item.description}</p>
                  <div className="skill-chips">
                    {item.skills.map((skill) => {
                      // Highlight skills that matched the resume
                      const matched = resumeActive && resumeTokens.has(
                        SKILL_ALIASES[skill.toLowerCase()] || skill.toLowerCase()
                      );
                      return (
                        <span key={skill} style={matched ? {
                          background: '#c8e8c0', color: '#1a5c30', fontWeight: 800,
                        } : {}}>
                          {skill}
                        </span>
                      );
                    })}
                  </div>
                  <div className="internship-details">
                    <span>{item.location}</span>
                    <span>{item.durationWeeks} weeks</span>
                    <span>{item.credits} credits</span>
                  </div>
                  <div className="internship-footer">
                    <div>
                      <b>{item.stipend ? `₹${item.stipend.toLocaleString('en-IN')}/mo` : 'Unpaid'}</b>
                      <small>Apply by {formatDate(item.deadline)}</small>
                    </div>
                    {user?.role === 'student' ? (
                      appliedIds.has(String(item._id)) ? (
                        <button
                          className="button button-small button-outline"
                          onClick={() => setStatusApp(applicationMap.get(String(item._id)))}>
                          Check Status
                        </button>
                      ) : (
                        <button className="button button-small" onClick={() => setSelected(item)}>
                          Apply
                        </button>
                      )
                    ) : user?.role === 'partner' ? (
                      <button
                        className="button button-small button-outline"
                        onClick={() => {
                          setPreviewRole(item);
                          // Default deadline 30 days from today
                          const d = new Date();
                          d.setDate(d.getDate() + 30);
                          setPreviewDeadline(d.toISOString().split('T')[0]);
                        }}>
                        Post a Role
                      </button>
                    ) : (
                      <Link className="button button-small button-outline" to="/login">Sign in to apply</Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>

          {!shown.length && (
            <div className="empty-state">
              <strong>No verified internships match this search.</strong>
              <p>
                {resumeActive
                  ? 'No roles matched your resume skills. Try editing your resume text or clearing the match filter.'
                  : 'Try a different keyword or mode.'}
              </p>
              {resumeActive && (
                <button className="button button-small" onClick={clearResume}>
                  Clear resume filter
                </button>
              )}
            </div>
          )}
        </>
      )}

      {/* ═══════════════════════════════════════════════════════════════════
          TAB 2: GARTNER MAGIC QUADRANT
      ════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'quadrant' && (
        <section className="panel" style={{ padding: 30 }}>
          <div className="panel-heading" style={{ marginBottom: 15 }}>
            <div>
              <p className="eyebrow">Industry Partner Matrix</p>
              <h2>Gartner Magic Quadrant for Internship Providers</h2>
            </div>
            <p style={{ maxWidth: 500, fontSize: 11, color: '#627367', margin: 0 }}>
              Plotting verified partners on <b>Completeness of Vision</b> (Mentorship Feedback %)
              vs <b>Ability to Execute</b> (Opportunity Scale & NEP Credits).{' '}
              <strong style={{ color: '#1c563e' }}>Click any company</strong> to filter its roles.
            </p>
          </div>

          {/* Matrix */}
          <div style={{ position: 'relative', width: '100%', maxWidth: 850, margin: '20px auto' }}>

            {/* Y-axis label */}
            <div style={{ textAlign: 'center', marginBottom: 6 }}>
              <span style={{ display: 'inline-block', background: '#234b38', color: 'white',
                             padding: '3px 12px', borderRadius: 12, fontSize: 10, fontWeight: 800 }}>
                ▲ Ability to Execute / Opportunity Scale (Y-axis)
              </span>
            </div>

            {/* Plot area */}
            <div style={{
              position: 'relative', width: '100%', height: 500,
              border: '2px solid #234b38', borderRadius: 10,
              background: '#fcfdfe', overflow: 'hidden',
            }}>
              {/* Quadrant backgrounds */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr',
                            gridTemplateRows: '1fr 1fr', width: '100%', height: '100%' }}>
                {[
                  { label: 'Challengers',   sub: 'High Scale · Rapidly Growing Mentorship',      bg: '#f5f9f6', br: '1px dashed #234b38', bb: '1px dashed #234b38', tc: '#2b543d' },
                  { label: 'Leaders 👑',    sub: 'High Mentorship · High Opportunity Scale',      bg: '#ebf5e9', bb: '1px dashed #234b38', tc: '#165731' },
                  { label: 'Niche Players', sub: 'Focused · Domain-Specific Roles',               bg: '#fdfdfb', br: '1px dashed #234b38', tc: '#57695c' },
                  { label: 'Visionaries',   sub: 'Exceptional Mentorship · Specialised Scale',    bg: '#f3f8fc', tc: '#265d8c' },
                ].map((q) => (
                  <div key={q.label} style={{
                    background: q.bg, padding: 14,
                    borderRight: q.br, borderBottom: q.bb,
                  }}>
                    <span style={{ fontSize: 13, fontWeight: 800, color: q.tc,
                                   textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                      {q.label}
                    </span>
                    <small style={{ display: 'block', color: '#68786c',
                                    fontSize: 10, marginTop: 3 }}>{q.sub}</small>
                  </div>
                ))}
              </div>

              {/* Partner nodes */}
              {displayPartners.map((partner, idx) => {
                const leftPct   = Math.max(12, Math.min(86, partner.x));
                const bottomPct = Math.max(12, Math.min(86, partner.y));
                const isHovered = hoveredPartner?.organization === partner.organization;
                const isFiltered = quadrantOrgFilter === partner.organization;
                const qColors   = QUADRANT_COLORS[partner.quadrant] || QUADRANT_COLORS['Niche Players'];

                return (
                  <div
                    key={idx}
                    onMouseEnter={() => setHoveredPartner(partner)}
                    onMouseLeave={() => setHoveredPartner(null)}
                    onClick={() => {
                      // Toggle: clicking the same org a second time clears the filter
                      const next = isFiltered ? '' : partner.organization;
                      setQuadrantOrgFilter(next);
                      if (next) setActiveTab('listings');
                    }}
                    style={{
                      position: 'absolute',
                      left: `${leftPct}%`, bottom: `${bottomPct}%`,
                      transform: 'translate(-50%, 50%)',
                      cursor: 'pointer',
                      zIndex: isHovered ? 20 : 10,
                    }}
                  >
                    {/* Node bubble */}
                    <div style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '6px 12px', borderRadius: 20,
                      background: qColors.node, color: 'white',
                      boxShadow: isHovered || isFiltered
                        ? '0 8px 20px rgba(0,0,0,0.35)'
                        : '0 3px 10px rgba(0,0,0,0.15)',
                      fontSize: 11, fontWeight: 800,
                      border: isFiltered
                        ? '2px solid #d8ee92'
                        : '2px solid rgba(255,255,255,0.6)',
                      transform: (isHovered || isFiltered) ? 'scale(1.08)' : 'scale(1)',
                      transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                    }}>
                      <span>🏢</span>
                      <span>{partner.organization}</span>
                      {isFiltered && <span style={{ fontSize: 9, opacity: 0.8 }}>✓</span>}
                    </div>

                    {/* Hover popover */}
                    {isHovered && (
                      <div style={{
                        position: 'absolute',
                        [bottomPct > 55 ? 'top' : 'bottom']: '115%',
                        left: leftPct > 65 ? 'auto' : '50%',
                        right: leftPct > 65 ? 0 : 'auto',
                        transform: leftPct > 65 ? 'none' : 'translateX(-50%)',
                        width: 245, padding: 14, borderRadius: 8,
                        background: '#1d3b2c', color: 'white',
                        boxShadow: '0 10px 25px rgba(0,0,0,0.35)',
                        zIndex: 30, fontSize: 11, lineHeight: 1.6,
                        pointerEvents: 'none',
                      }}>
                        <strong style={{ display: 'block', fontSize: 13,
                                         color: '#dcf09e', marginBottom: 4 }}>
                          {partner.organization}
                        </strong>
                        <span style={{ display: 'inline-block', padding: '2px 6px',
                                       borderRadius: 4, background: '#36614a',
                                       fontSize: 9, fontWeight: 800,
                                       textTransform: 'uppercase', marginBottom: 8 }}>
                          {partner.quadrant}
                        </span>
                        <div>• Active Roles: {partner.activeInternships}</div>
                        <div>• Credits Offered: {partner.totalCreditsOffered} cr</div>
                        <div>• Applicants Hired: {partner.totalApplicantsHired}</div>
                        <div>• Mentorship Rating: {partner.x}%</div>
                        <div>• Opportunity Score: {partner.y}%</div>
                        <div style={{ marginTop: 8, paddingTop: 8,
                                      borderTop: '1px solid rgba(255,255,255,.15)',
                                      fontSize: 9, color: '#a8c9ae' }}>
                          Click to filter listings by this company →
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>{/* end plot area */}

            {/* X-axis label */}
            <div style={{ textAlign: 'right', marginTop: 6 }}>
              <span style={{ display: 'inline-block', background: '#234b38', color: 'white',
                             padding: '3px 12px', borderRadius: 12, fontSize: 10, fontWeight: 800 }}>
                Completeness of Vision / Mentorship Rating (X-axis) ▶
              </span>
            </div>
          </div>{/* end matrix wrapper */}

          {/* Quadrant legend */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10,
                        justifyContent: 'center', marginTop: 18 }}>
            {Object.entries(QUADRANT_COLORS).map(([name, c]) => (
              <span key={name} style={{
                display: 'inline-flex', alignItems: 'center', gap: 6,
                padding: '4px 12px', borderRadius: 20,
                background: c.bg, color: c.text, fontSize: 10, fontWeight: 800,
                border: `1px solid ${c.node}30`,
              }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%',
                               background: c.node, display: 'inline-block' }} />
                {name}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* ── STATUS MODAL ── */}
      {statusApp && (() => {
        // Map backend status to the 4 display stages
        const STAGES = ['applied', 'under review', 'selected', 'rejected'];
        const STATUS_MAP = {
          applied:     { stage: 'applied',      step: 0 },
          shortlisted: { stage: 'under review', step: 1 },
          interview:   { stage: 'under review', step: 1 },
          offered:     { stage: 'selected',     step: 2 },
          accepted:    { stage: 'selected',     step: 2 },
          rejected:    { stage: 'rejected',     step: -1 },
          'in-progress':{ stage: 'selected',   step: 2 },
          completed:   { stage: 'selected',     step: 2 },
        };
        const mapped  = STATUS_MAP[statusApp.status] || { stage: 'applied', step: 0 };
        const isRejected = mapped.step === -1;
        // Progress bar: rejected = 0%, otherwise spread across 3 positive steps
        const barPct = isRejected ? 0 : Math.round(((mapped.step + 1) / 3) * 100);
        const internshipTitle = statusApp.internship?.title || 'Internship';
        const orgName = statusApp.internship?.organization || '';

        return (
          <div className="modal-backdrop" role="dialog" aria-modal="true"
               aria-labelledby="status-title" onClick={() => setStatusApp(null)}>
            <section className="modal" style={{ width: 'min(100%, 480px)' }}
                     onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setStatusApp(null)} aria-label="Close">×</button>
              <p className="eyebrow">Application Status</p>
              <h2 id="status-title" style={{ margin: '4px 0 4px', fontSize: 22 }}>{internshipTitle}</h2>
              <p className="muted" style={{ marginBottom: 20 }}>{orgName}</p>

              {/* Stage labels */}
              <div style={{ display: 'flex', justifyContent: 'space-between',
                            marginBottom: 6, fontSize: 10, fontWeight: 800 }}>
                {STAGES.filter((s) => s !== 'rejected').map((s, i) => (
                  <span key={s} style={{
                    color: !isRejected && mapped.step >= i ? '#1c563e' : '#9aaa9d',
                    textTransform: 'capitalize',
                  }}>{s}</span>
                ))}
              </div>

              {/* Blue progress bar */}
              <div style={{ height: 8, borderRadius: 20, background: '#e2ebd9',
                            marginBottom: 14, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', borderRadius: 20,
                  width: `${barPct}%`,
                  background: isRejected ? '#e05252' : '#2563eb',
                  transition: 'width .4s ease',
                }} />
              </div>

              {/* Current status badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '8px 14px', borderRadius: 6, marginBottom: 16,
                background: isRejected ? '#fae9e5' : '#dbeafe',
                border: `1px solid ${isRejected ? '#f3c9c0' : '#bfdbfe'}`,
              }}>
                <span style={{ fontSize: 16 }}>
                  {isRejected ? '✗' : mapped.step === 2 ? '✓' : '●'}
                </span>
                <div>
                  <strong style={{ fontSize: 12, color: isRejected ? '#943727' : '#1d4ed8',
                                   textTransform: 'capitalize', display: 'block' }}>
                    {mapped.stage}
                  </strong>
                  <small style={{ fontSize: 10, color: isRejected ? '#b54b3c' : '#3b82f6' }}>
                    {isRejected
                      ? 'Your application was not taken forward at this time.'
                      : mapped.step === 0
                        ? 'Your application was received successfully.'
                        : mapped.step === 1
                          ? 'The team is reviewing your profile.'
                          : 'Congratulations — you have been selected!'}
                  </small>
                </div>
              </div>

              {/* Timeline */}
              {statusApp.timeline?.length > 0 && (
                <div style={{ borderTop: '1px solid #e7ece6', paddingTop: 12 }}>
                  <p style={{ fontSize: 10, fontWeight: 800, color: '#5a6a5c',
                               margin: '0 0 8px', textTransform: 'uppercase',
                               letterSpacing: '0.07em' }}>Timeline</p>
                  {statusApp.timeline.map((t, i) => (
                    <div key={i} style={{ display: 'flex', gap: 10, marginBottom: 6,
                                          alignItems: 'flex-start' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', marginTop: 4,
                                     flexShrink: 0, background: '#2563eb' }} />
                      <div>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#1d3a26',
                                       textTransform: 'capitalize' }}>{t.status}</span>
                        {t.note && (
                          <span style={{ fontSize: 10, color: '#7a8a7c',
                                         marginLeft: 6 }}>{t.note}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <button className="button button-outline button-full"
                      style={{ marginTop: 16 }}
                      onClick={() => setStatusApp(null)}>Close</button>
            </section>
          </div>
        );
      })()}

      {/* ── APPLICATION MODAL ── */}
      {selected && (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="apply-title">
          <section className="modal">
            <button className="modal-close" onClick={() => { setSelected(null); setResumeFile(null); setResumeError(''); }} aria-label="Close">×</button>
            <p className="eyebrow">Application</p>
            <h2 id="apply-title">{selected.title}</h2>
            <p className="muted">
              {selected.organization} · {selected.credits} academic credits on verified completion.
            </p>
            {resumeActive && selected.resumeScore !== undefined && (
              <div style={{
                padding: '8px 12px', marginBottom: 16, borderRadius: 6,
                background: badgeStyle(selected.resumeScore).bg,
                color: badgeStyle(selected.resumeScore).color,
                fontSize: 11, fontWeight: 700,
              }}>
                {selected.resumeScore}% resume match — your skills align with{' '}
                {selected.skills.filter((s) =>
                  resumeTokens.has(SKILL_ALIASES[s.toLowerCase()] || s.toLowerCase())
                ).join(', ') || 'some of the requirements'}.
              </div>
            )}

            {/* Resume upload — required */}
            <label style={{ marginBottom: 4 }}>
              Resume <span style={{ color: '#e05252', fontWeight: 800 }}>*</span>
              <span className="optional" style={{ marginLeft: 6 }}>PDF, DOC, DOCX · max 5 MB</span>
              <input
                type="file"
                accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => { setResumeFile(e.target.files?.[0] || null); setResumeError(''); }}
                style={{ marginTop: 6 }}
              />
            </label>
            {resumeFile && (
              <p style={{ fontSize: 11, color: '#2d6040', marginBottom: 8 }}>
                ✓ {resumeFile.name} ({(resumeFile.size / 1024).toFixed(0)} KB)
              </p>
            )}
            {resumeError && <p className="form-alert" style={{ marginBottom: 10 }}>{resumeError}</p>}

            <label>
              Why are you a strong fit? <span className="optional">optional</span>
              <textarea
                maxLength={1800}
                value={letter}
                onChange={(e) => setLetter(e.target.value)}
                placeholder="Briefly describe relevant skills, work, or motivation."
              />
            </label>
            <button className="button button-full" disabled={applyBusy} onClick={apply}>
              {applyBusy ? 'Submitting…' : 'Submit application'}
            </button>
          </section>
        </div>
      )}
      {/* ── ROLE PREVIEW MODAL (partner "Post a Role") ── */}
      {previewRole && (() => {
        const alreadyPosted = myPostedRoles.some(
          (r) => r.title.trim().toLowerCase() === previewRole.title.trim().toLowerCase()
        );

        const handlePost = async () => {
          if (!previewDeadline) return;
          setError(''); setPreviewBusy(true);
          try {
            const result = await api('/internships', {
              method: 'POST',
              body: {
                title: previewRole.title,
                description: previewRole.description,
                skills: previewRole.skills,
                location: previewRole.location,
                mode: previewRole.mode,
                durationWeeks: previewRole.durationWeeks,
                stipend: previewRole.stipend ?? 0,
                credits: previewRole.credits,
                capacity: previewRole.capacity ?? 1,
                deadline: previewDeadline,
              },
            });
            // Refresh partner's posted roles
            const myRolesData = await api('/internships/mine').catch(() => ({ internships: [] }));
            setMyPostedRoles(myRolesData.internships || []);
            setNotice(result.message || 'Role submitted.');
            setPreviewRole(null);
          } catch (err) { setError(err.message); }
          finally { setPreviewBusy(false); }
        };

        return (
          <div className="modal-backdrop" role="dialog" aria-modal="true"
               aria-labelledby="preview-title" onClick={() => setPreviewRole(null)}>
            <section className="modal" style={{ width: 'min(100%, 580px)', maxHeight: '90vh', overflowY: 'auto' }}
                     onClick={(e) => e.stopPropagation()}>
              <button className="modal-close" onClick={() => setPreviewRole(null)} aria-label="Close">×</button>

              <p className="eyebrow">Role details</p>
              <h2 id="preview-title" style={{ margin: '4px 0 4px', fontSize: 22 }}>
                {previewRole.title}
              </h2>
              <p className="muted" style={{ marginBottom: 16 }}>
                {previewRole.organization} · {previewRole.location}
                {' · '}<span style={{ textTransform: 'capitalize' }}>{previewRole.mode}</span>
                {' · '}{previewRole.durationWeeks} weeks · {previewRole.credits} credits
                {previewRole.stipend > 0 && ` · ₹${previewRole.stipend.toLocaleString('en-IN')}/mo`}
              </p>

              {/* Skills */}
              <div style={{ marginBottom: 14 }}>
                <p className="eyebrow" style={{ marginBottom: 6 }}>Required skills</p>
                <div className="skill-chips">
                  {previewRole.skills.map((s) => <span key={s}>{s}</span>)}
                </div>
              </div>

              {/* Description / responsibilities */}
              <div style={{ marginBottom: 16 }}>
                <p className="eyebrow" style={{ marginBottom: 6 }}>Description &amp; responsibilities</p>
                <p style={{ fontSize: 12, color: '#3a4e40', lineHeight: 1.7,
                             padding: '10px 14px', background: '#f8faf6',
                             borderRadius: 6, border: '1px solid #d9e8d0', margin: 0,
                             whiteSpace: 'pre-wrap' }}>
                  {previewRole.description}
                </p>
              </div>

              {/* Duplicate warning */}
              {alreadyPosted && (
                <div style={{ padding: '10px 14px', marginBottom: 14, borderRadius: 6,
                              background: '#fef9e8', border: '1px solid #f0d080',
                              fontSize: 12, color: '#7a5500' }}>
                  ⚠ You already have a posting for <strong>{previewRole.title}</strong>.
                  Submitting again will create a new listing for the deadline you choose.
                </div>
              )}

              {/* Verification gate */}
              {!user.isVerifiedPartner ? (
                <div style={{ padding: '12px 14px', borderRadius: 6,
                              background: '#fff3f3', border: '1px solid #f3c9c0',
                              fontSize: 12, color: '#943727', marginBottom: 14 }}>
                  ✕ Your organisation must be verified before you can post roles.
                  Visit your <a href="/partner" style={{ color: '#943727', fontWeight: 700 }}>Industry Workspace</a> to
                  request verification.
                </div>
              ) : (
                <>
                  <label style={{ marginBottom: 14 }}>
                    Application deadline
                    <input
                      type="date"
                      required
                      value={previewDeadline}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setPreviewDeadline(e.target.value)}
                      style={{ marginTop: 6 }}
                    />
                  </label>
                  <button
                    className="button button-full"
                    disabled={previewBusy || !previewDeadline}
                    onClick={handlePost}>
                    {previewBusy ? 'Posting…' : 'Post this role'}
                  </button>
                </>
              )}
            </section>
          </div>
        );
      })()}

    </div>
  );
}
