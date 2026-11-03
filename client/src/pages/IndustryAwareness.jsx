import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

// Simple SVG flow diagram
function FlowDiagram() {
  const steps = [
    { icon: '🎓', label: 'Academic\nLearning' },
    { icon: '📝', label: 'Skill\nAssessment' },
    { icon: '🔍', label: 'Identify\nSkill Gaps' },
    { icon: '📚', label: 'Recommended\nCourses' },
    { icon: '🏢', label: 'Internships &\nExperience' },
    { icon: '✅', label: 'Industry\nReadiness' },
  ];

  return (
    <div style={{
      display: 'flex', alignItems: 'center', flexWrap: 'wrap',
      gap: 6, margin: '28px 0', justifyContent: 'center',
    }}>
      {steps.map((step, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 6, padding: '12px 14px', borderRadius: 8,
            border: '1px solid #d5e4cf', background: '#f4faf1',
            minWidth: 80, textAlign: 'center',
          }}>
            <span style={{ fontSize: 22 }}>{step.icon}</span>
            <span style={{
              fontSize: 10, fontWeight: 800, color: '#2d4f39',
              whiteSpace: 'pre-line', lineHeight: 1.3,
            }}>{step.label}</span>
          </div>
          {i < steps.length - 1 && (
            <span style={{ fontSize: 16, color: '#6ea65b', fontWeight: 800, flexShrink: 0 }}>→</span>
          )}
        </div>
      ))}
    </div>
  );
}

export default function IndustryAwareness() {
  const navigate = useNavigate();
  const [showExplanation, setShowExplanation] = useState(false);

  if (showExplanation) {
    return (
      <div className="assessment-page page-width">
        <section className="assessment-intro">
          <div>
            <p className="eyebrow">Industry readiness</p>
            <h1>What the industry really looks for.</h1>
            <p>
              A degree is a great start — but employers today look for much more than
              academic knowledge alone. Here's what that means in practice.
            </p>
          </div>
          <div className="assessment-facts">
            <span>Practical skills matter</span>
            <span>Projects build credibility</span>
            <span>Prashikshan bridges the gap</span>
          </div>
        </section>

        <section className="skill-select" style={{ marginBottom: 18 }}>
          <h2>Beyond the classroom</h2>
          <p style={{ color: '#637166', fontSize: 13, lineHeight: 1.75, marginTop: 12 }}>
            When companies hire fresh graduates, they're looking for people who can
            <strong> apply</strong> what they know — not just recall it. Here are the key areas
            they evaluate:
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                        gap: 12, margin: '20px 0' }}>
            {[
              { icon: '⚙️', title: 'Practical skills', desc: 'Can you write real code, build something, or solve a problem end-to-end — not just answer theory questions?' },
              { icon: '📁', title: 'Projects & portfolio', desc: 'Have you built anything? Even a small personal project shows initiative and the ability to follow through.' },
              { icon: '🧩', title: 'Problem-solving', desc: 'Employers want people who break down ambiguous problems and find workable solutions, not just memorise formulas.' },
              { icon: '🤝', title: 'Teamwork & communication', desc: 'Most work happens in teams. Being able to explain your thinking and collaborate clearly is as important as technical ability.' },
            ].map((item) => (
              <div key={item.title} style={{
                padding: '16px', borderRadius: 7,
                border: '1px solid #d9e8d6', background: '#fbfdf9',
              }}>
                <div style={{ fontSize: 24, marginBottom: 8 }}>{item.icon}</div>
                <strong style={{ fontSize: 12, color: '#1e3829', display: 'block',
                                  marginBottom: 5 }}>{item.title}</strong>
                <p style={{ margin: 0, fontSize: 11, color: '#637166', lineHeight: 1.65 }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>

          <div style={{
            padding: '18px 20px', borderRadius: 7, marginTop: 4,
            border: '1px solid #c8dfc4', background: '#edf7ea',
          }}>
            <strong style={{ fontSize: 12, color: '#1e3829' }}>How Prashikshan helps</strong>
            <p style={{ margin: '6px 0 0', fontSize: 12, color: '#4a6453', lineHeight: 1.7 }}>
              Prashikshan's skill assessment identifies exactly where your gaps are. Based on
              your results, it recommends courses that target those gaps — and connects you with
              real internship opportunities to build the practical experience employers are looking for.
            </p>
          </div>

          <FlowDiagram />

          <button className="button button-large button-full" onClick={() => navigate('/assessment')}>
            I'm ready — start my assessment →
          </button>
        </section>
      </div>
    );
  }

  // ── Initial question screen ───────────────────────────────────────────────
  return (
    <div className="assessment-page page-width">
      <section className="assessment-intro">
        <div>
          <p className="eyebrow">Before you begin</p>
          <h1>A quick check-in.</h1>
          <p>
            Before jumping into your skill assessment, we want to make sure you have the
            right context to get the most out of it.
          </p>
        </div>
        <div className="assessment-facts">
          <span>Takes 30 seconds</span>
          <span>No right answer</span>
          <span>Helps personalise your path</span>
        </div>
      </section>

      <section className="skill-select">
        <div style={{ textAlign: 'center', padding: '10px 0 28px' }}>
          <h2 style={{ marginBottom: 10 }}>
            Are you familiar with what the industry expects from a graduate entering the workforce?
          </h2>
          <p style={{ color: '#637166', fontSize: 13, maxWidth: 520, margin: '0 auto 30px' }}>
            This helps us understand where you're starting from so we can guide you more effectively.
          </p>

          <div style={{
            display: 'grid', gridTemplateColumns: '1fr 1fr',
            gap: 14, maxWidth: 520, margin: '0 auto',
          }}>
            <button
              className="button button-large button-outline"
              style={{ flexDirection: 'column', gap: 8, minHeight: 100, alignItems: 'center' }}
              onClick={() => navigate('/assessment')}
            >
              <span style={{ fontSize: 28 }}>👍</span>
              <span>Yes, I'm familiar</span>
              <small style={{ fontWeight: 500, fontSize: 10, opacity: 0.8 }}>
                Take me to the assessment
              </small>
            </button>

            <button
              className="button button-large"
              style={{ flexDirection: 'column', gap: 8, minHeight: 100, alignItems: 'center' }}
              onClick={() => setShowExplanation(true)}
            >
              <span style={{ fontSize: 28 }}>📖</span>
              <span>No, I'd like to learn</span>
              <small style={{ fontWeight: 500, fontSize: 10, opacity: 0.8 }}>
                Show me a quick overview
              </small>
            </button>
          </div>
        </div>
      </section>

      <p style={{ textAlign: 'center', marginTop: 18 }}>
        <Link to="/assessment" className="text-action" style={{ fontSize: 11 }}>
          Skip this step <span>→</span>
        </Link>
      </p>
    </div>
  );
}
