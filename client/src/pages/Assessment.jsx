import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getSession } from '../services/api';
import { useAuth } from '../context/AuthContext';

const ALL_SKILLS = ['html', 'css', 'javascript', 'react', 'nodejs', 'python', 'mongodb', 'sql', 'git', 'dsa', 'java', 'cloud', 'os', 'dbms'];
const MAX_SKILLS = 7;

// ─── Results screen ──────────────────────────────────────────────────────────
function ResultsScreen({ results, onReset }) {
  return (
    <div className="assessment-page page-width">
      <section className="result-card">
        <p className="eyebrow">Assessment complete</p>
        <h1>Your current skill baseline</h1>
        <p>We've added 1 credit to your academic record and shaped your recommendations around these results.</p>
        <div className="result-grid">
          {results.map((result) => (
            <div key={result.skill}>
              <span>{result.skill}</span>
              <strong>{result.percentage}%</strong>
              <small className={`level level-${result.level}`}>{result.level}</small>
            </div>
          ))}
        </div>
        <div className="hero-actions">
          <Link className="button" to="/dashboard">View my pathway</Link>
          <button className="button button-outline" onClick={onReset}>Assess again</button>
        </div>
      </section>
    </div>
  );
}

// ─── Quiz screen ─────────────────────────────────────────────────────────────
function QuizScreen({ attempt, onSubmit, busy, error }) {
  const [answers, setAnswers] = useState({});

  const handleSubmit = () => onSubmit(answers);

  return (
    <div className="assessment-page page-width">
      <section className="assessment-header">
        <div>
          <p className="eyebrow">Skill assessment</p>
          <h1>Show what you know.</h1>
        </div>
        <span>{Object.keys(answers).length}/{attempt.questions.length} answered</span>
      </section>
      {error && <p className="form-alert">{error}</p>}
      <div className="quiz-list">
        {attempt.questions.map((question, index) => (
          <article className="quiz-card" key={question.id}>
            <div className="question-number">{index + 1}</div>
            <div>
              <p className="tag">{question.skill}</p>
              <h2>{question.prompt}</h2>
              <div className="answer-options">
                {question.options.map((option) => (
                  <button
                    key={option}
                    className={answers[question.id] === option ? 'chosen' : ''}
                    onClick={() => setAnswers({ ...answers, [question.id]: option })}
                  >
                    <span>{String.fromCharCode(65 + question.options.indexOf(option))}</span>
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
      <button
        className="button button-large assessment-submit"
        disabled={busy || Object.keys(answers).length !== attempt.questions.length}
        onClick={handleSubmit}
      >
        {busy ? 'Evaluating…' : 'Submit assessment'}
      </button>
    </div>
  );
}

// ─── Skill confirm screen (after resume parse or before manual start) ─────────
function SkillConfirmScreen({ initialSkills, onStart, onBack, busy, error }) {
  const [selected, setSelected] = useState(initialSkills);

  const toggle = (skill) =>
    setSelected((curr) =>
      curr.includes(skill)
        ? curr.filter((s) => s !== skill)
        : curr.length >= MAX_SKILLS
        ? curr
        : [...curr, skill]
    );

  return (
    <div className="assessment-page page-width">
      <section className="assessment-intro">
        <div>
          <p className="eyebrow">Skill assessment</p>
          <h1>Confirm your skills.</h1>
          <p>
            Review the skills below. Remove any that don't apply and add any that are missing.
            We'll assess up to {MAX_SKILLS} topics — 3 questions each.
          </p>
        </div>
        <div className="assessment-facts">
          <span>3 questions per skill</span>
          <span>Up to {MAX_SKILLS} skills</span>
          <span>1 academic credit</span>
        </div>
      </section>
      {error && <p className="form-alert">{error}</p>}
      <section className="skill-select">
        <div className="panel-heading">
          <div>
            <h2>Your skills</h2>
            <p>
              {selected.length
                ? `${selected.length} of ${MAX_SKILLS} selected.`
                : `Select at least 1 skill.`}
            </p>
          </div>
          <button className="button button-ghost button-small" onClick={onBack}>← Change method</button>
        </div>
        <div className="skill-choice-grid">
          {ALL_SKILLS.map((skill) => (
            <button
              key={skill}
              className={selected.includes(skill) ? 'selected' : ''}
              onClick={() => toggle(skill)}
              disabled={!selected.includes(skill) && selected.length >= MAX_SKILLS}
            >
              <span>{selected.includes(skill) ? '✓' : '+'}</span>
              {skill}
            </button>
          ))}
        </div>
        <button
          className="button button-large"
          disabled={!selected.length || busy}
          onClick={() => onStart(selected)}
        >
          {busy ? 'Preparing assessment…' : `Assess ${selected.length} skill${selected.length === 1 ? '' : 's'}`}
        </button>
      </section>
    </div>
  );
}

// ─── Onboarding choice screen ─────────────────────────────────────────────────
function OnboardingScreen({ onManual, onResumeSkills, busy, error }) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setUploadError('');
    try {
      const session = getSession();
      const formData = new FormData();
      formData.append('resume', file);

      const res = await fetch(
        `${(import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')}/assessments/parse-resume`,
        {
          method: 'POST',
          headers: session?.token ? { Authorization: `Bearer ${session.token}` } : {},
          body: formData,
        }
      );

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to parse resume.');

      const detected = (data.skills || []).filter((s) => ALL_SKILLS.includes(s));
      onResumeSkills(detected.length ? detected : []);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
      // reset input so same file can be re-uploaded if needed
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="assessment-page page-width">
      <section className="assessment-intro">
        <div>
          <p className="eyebrow">Skill assessment</p>
          <h1>Start with an honest baseline.</h1>
          <p>
            Upload your resume to auto-detect skills, or pick them manually.
            You'll get tailored course and internship recommendations based on your results.
          </p>
        </div>
        <div className="assessment-facts">
          <span>3 questions per skill</span>
          <span>Up to {MAX_SKILLS} skills</span>
          <span>1 academic credit</span>
        </div>
      </section>

      {(error || uploadError) && (
        <p className="form-alert">{error || uploadError}</p>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
        {/* Upload resume option */}
        <section className="skill-select" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <h2>Upload Resume</h2>
            <p>We'll extract your technical skills automatically from a PDF or DOCX file.</p>
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '28px',
            border: '2px dashed #c5d4c2',
            borderRadius: '6px',
            background: '#f8fbf7',
            flex: 1,
          }}>
            <span style={{ fontSize: '32px' }}>📄</span>
            <p style={{ margin: 0, color: '#7b887e', fontSize: '11px', textAlign: 'center' }}>
              PDF or DOCX · max 5 MB
            </p>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <button
              className="button button-outline"
              disabled={uploading || busy}
              onClick={() => fileRef.current?.click()}
            >
              {uploading ? 'Parsing resume…' : 'Choose file'}
            </button>
          </div>
        </section>

        {/* Manual selection option */}
        <section className="skill-select" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <h2>Select Manually</h2>
            <p>Know exactly what you want assessed? Pick up to {MAX_SKILLS} skills yourself.</p>
          </div>
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            padding: '28px',
            border: '2px dashed #c5d4c2',
            borderRadius: '6px',
            background: '#f8fbf7',
            flex: 1,
          }}>
            <span style={{ fontSize: '32px' }}>🎯</span>
            <p style={{ margin: 0, color: '#7b887e', fontSize: '11px', textAlign: 'center' }}>
              Choose from {ALL_SKILLS.length} available topics
            </p>
            <button
              className="button button-outline"
              disabled={busy}
              onClick={onManual}
            >
              Select skills
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────
export default function Assessment() {
  const { updateUser } = useAuth();

  // 'choose' | 'manual' | 'confirm' | 'quiz' | 'results'
  const [screen, setScreen] = useState('choose');
  const [resumeSkills, setResumeSkills] = useState([]);
  const [attempt, setAttempt] = useState(null);
  const [results, setResults] = useState(null);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const reset = () => {
    setScreen('choose');
    setResumeSkills([]);
    setAttempt(null);
    setResults(null);
    setError('');
    setBusy(false);
  };

  // Called when resume is parsed — go to confirm screen with detected skills
  const handleResumeSkills = (skills) => {
    setResumeSkills(skills);
    setScreen('confirm');
  };

  // Start the actual assessment
  const startAssessment = async (skills) => {
    setBusy(true);
    setError('');
    try {
      const data = await api('/assessments/start', { method: 'POST', body: { skills } });
      setAttempt(data);
      setScreen('quiz');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  // Submit answers
  const submitAssessment = async (answers) => {
    if (!attempt) return;
    if (Object.keys(answers).length !== attempt.questions.length) {
      setError('Please answer every question before submitting.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const data = await api(`/assessments/${attempt.assessmentId}/submit`, {
        method: 'POST',
        body: { answers: Object.entries(answers).map(([id, value]) => ({ id: Number(id), value })) },
      });
      setResults(data.results);
      const me = await api('/auth/me');
      updateUser(me.user);
      setScreen('results');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (screen === 'results') {
    return <ResultsScreen results={results} onReset={reset} />;
  }

  if (screen === 'quiz') {
    return (
      <QuizScreen
        attempt={attempt}
        onSubmit={submitAssessment}
        busy={busy}
        error={error}
      />
    );
  }

  if (screen === 'confirm' || screen === 'manual') {
    return (
      <SkillConfirmScreen
        initialSkills={screen === 'confirm' ? resumeSkills : []}
        onStart={startAssessment}
        onBack={() => setScreen('choose')}
        busy={busy}
        error={error}
      />
    );
  }

  // Default: 'choose'
  return (
    <OnboardingScreen
      onManual={() => setScreen('manual')}
      onResumeSkills={handleResumeSkills}
      busy={busy}
      error={error}
    />
  );
}
