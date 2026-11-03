import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';

const LEVELS = ['all', 'beginner', 'intermediate', 'advanced'];

// ─── Helpers ──────────────────────────────────────────────────────────────
const levelColor = (lvl) =>
  lvl === 'advanced' || lvl === 'legend'
    ? { bg: '#e1f1df', color: '#1f663c' }
    : lvl === 'intermediate'
    ? { bg: '#dceaf8', color: '#295b91' }
    : { bg: '#fff0ce', color: '#946914' };

function Tick({ done, pct }) {
  // Shows a percentage ring while in progress, solid tick when done
  if (done) {
    return (
      <span style={{
        display:'inline-flex', alignItems:'center', justifyContent:'center',
        width:22, height:22, borderRadius:'50%', flexShrink:0,
        background:'#1c563e', border:'2px solid #1c563e',
      }}>
        <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4l3 3 5-6" stroke="#fff" strokeWidth="1.8"
                strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </span>
    );
  }
  if (pct > 0) {
    // Partial ring — SVG circle with stroke-dasharray
    const r = 8, circ = 2 * Math.PI * r;
    const dash = (pct / 100) * circ;
    return (
      <svg width="22" height="22" viewBox="0 0 22 22" style={{ flexShrink:0 }}>
        <circle cx="11" cy="11" r={r} fill="none" stroke="#d8e8d0" strokeWidth="2.5"/>
        <circle cx="11" cy="11" r={r} fill="none" stroke="#4d8b52" strokeWidth="2.5"
                strokeDasharray={`${dash} ${circ - dash}`}
                strokeDashoffset={circ * 0.25}
                strokeLinecap="round"/>
        <text x="11" y="15" textAnchor="middle" fontSize="6" fill="#3a6040"
              fontWeight="bold">{Math.round(pct)}%</text>
      </svg>
    );
  }
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', justifyContent:'center',
      width:22, height:22, borderRadius:'50%', flexShrink:0,
      background:'transparent', border:'2px solid #c5d3c1',
    }}/>
  );
}

// ─── Learning Player Modal ─────────────────────────────────────────────────
function LearningPlayer({ course, enrollment, onClose, onProgressUpdate }) {
  const enrollmentId = enrollment?._id;

  const [videos, setVideos]         = useState([]);
  const [activeIdx, setActiveIdx]   = useState(0);
  const [loadingVids, setLoadingVids] = useState(true);
  const [notice, setNotice]         = useState('');
  const [completing, setCompleting] = useState(false);
  const [certResult, setCertResult] = useState(null);

  const [watchedIds, setWatchedIds] = useState(
    () => new Set((enrollment?.watchedVideos || []).map((w) => w.videoId))
  );
  const [watchPct, setWatchPct] = useState({});

  const iframeRef   = useRef(null);
  const pollRef     = useRef(null);
  const reportedRef = useRef(new Set());
  // track current video for postMessage polling
  const activeVideoRef = useRef(null);

  useEffect(() => {
    setLoadingVids(true);
    api(`/courses/${course._id}/videos`)
      .then((d) => setVideos(d.videos || []))
      .catch(() => setVideos([]))
      .finally(() => setLoadingVids(false));
  }, [course._id]);

  // Poll the iframe via postMessage every 2s to get currentTime
  function startPolling(video) {
    stopPolling();
    activeVideoRef.current = video;
    pollRef.current = setInterval(() => {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({ event: 'command', func: 'getPlayerState', args: [] }),
          '*'
        );
      }
    }, 2000);
  }

  function stopPolling() {
    if (pollRef.current) { clearInterval(pollRef.current); pollRef.current = null; }
  }

  // Listen for YT postMessage events to track watch time
  useEffect(() => {
    const onMessage = (evt) => {
      let data;
      try { data = typeof evt.data === 'string' ? JSON.parse(evt.data) : evt.data; }
      catch { return; }

      if (data?.event !== 'infoDelivery' || !data.info) return;
      const video = activeVideoRef.current;
      if (!video) return;

      const current  = data.info.currentTime;
      const duration = data.info.duration;
      if (!duration || duration <= 0 || current == null) return;

      const pct = (current / duration) * 100;
      setWatchPct((prev) => ({ ...prev, [video.videoId]: Math.min(pct, 100) }));

      if (pct >= 90 && !reportedRef.current.has(video.videoId) && !watchedIds.has(video.videoId)) {
        reportedRef.current.add(video.videoId);
        stopPolling();
        reportWatched(video, Math.round(current));
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [watchedIds]); // eslint-disable-line

  // Start polling when iframe loads a new video
  const handleIframeLoad = (video) => {
    startPolling(video);
  };

  async function reportWatched(video, watchTimeSeconds) {
    if (!enrollmentId) return;
    try {
      const resp = await api(`/courses/enrollments/${enrollmentId}/track-video`, {
        method: 'POST',
        body: { videoId: video.videoId, watchTimeSeconds },
      });
      setWatchedIds((prev) => new Set([...prev, video.videoId]));
      onProgressUpdate(enrollmentId, resp.progress);
      if (resp.completed) { setCompleting(true); setCertResult(resp); setNotice(''); }
      else setNotice(`Module "${video.topic}" marked complete. ${resp.watchedCount}/${resp.totalVideos} done.`);
    } catch (e) {
      reportedRef.current.delete(video.videoId);
      console.warn('[Player] track-video error:', e.message);
    }
  }

  // Reset polling when active video changes
  useEffect(() => {
    stopPolling();
    activeVideoRef.current = null;
    // iframe will call handleIframeLoad on load
  }, [activeIdx]);

  // Cleanup
  useEffect(() => () => stopPolling(), []);

  // Escape key
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') { stopPolling(); onClose(); } };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  const totalVideos  = videos.length;
  const watchedCount = watchedIds.size;
  const progress     = totalVideos > 0 ? Math.round((watchedCount / totalVideos) * 100) : 0;
  const activeVideo  = videos[activeIdx];
  const lc           = levelColor(course.level);

  return (
    /* Backdrop — clicking it closes the modal */
    <div
      className="modal-backdrop"
      role="dialog" aria-modal="true"
      aria-label={`Learning: ${course.title}`}
      style={{ alignItems: 'flex-start', paddingTop: '3vh' }}
      onClick={onClose}
    >
      {/* Close button rendered OUTSIDE the modal box so the iframe can never intercept it */}
      <button
        onClick={(e) => { e.stopPropagation(); stopPolling(); onClose(); }}
        aria-label="Close player"
        style={{
          position: 'fixed', top: 14, right: 18, zIndex: 9999,
          border: 'none', background: 'rgba(255,255,255,0.92)',
          borderRadius: '50%', width: 36, height: 36,
          fontSize: 22, lineHeight: '34px', textAlign: 'center',
          cursor: 'pointer', color: '#1c3a28', boxShadow: '0 2px 8px rgba(0,0,0,.18)',
        }}
      >×</button>

      <div
        style={{
          position: 'relative', width: 'min(100%, 1020px)', maxHeight: '94vh',
          background: '#fdfefb', borderRadius: 10,
          boxShadow: '0 30px 80px rgba(7,24,14,.32)',
          display: 'flex', flexDirection: 'column', overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── HEADER ── */}
        <div style={{
          display:'flex', alignItems:'center', justifyContent:'space-between',
          padding:'14px 22px', borderBottom:'1px solid #e2ebe0',
          background:'#f8faf6', flexShrink:0,
        }}>
          <div style={{ display:'flex', alignItems:'center', gap:12, minWidth:0 }}>
            <div className="course-code" style={{ width:44, height:44, fontSize:'10px' }}>
              {course.code.split('-')[0]}
            </div>
            <div style={{ minWidth:0 }}>
              <p className="eyebrow" style={{ marginBottom:2 }}>Interactive Learning Player</p>
              <h2 style={{
                margin:0, fontSize:17, color:'#1b3828',
                fontFamily:"'Playfair Display', serif",
                overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap',
              }}>
                {course.title}
              </h2>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10, flexShrink:0 }}>
            <span style={{
              padding:'3px 8px', borderRadius:12, fontSize:9, fontWeight:800,
              background:lc.bg, color:lc.color, textTransform:'capitalize',
            }}>{course.level}</span>
            <span style={{ fontSize:11, fontWeight:700, color:'#387352' }}>
              {watchedCount}/{totalVideos} modules
            </span>
          </div>
        </div>

        {/* ── OVERALL PROGRESS BAR ── */}
        <div style={{ height:4, background:'#e8eee7', flexShrink:0 }}>
          <div style={{
            height:'100%', width:`${progress}%`,
            background: progress === 100 ? '#2b7550' : '#6ea65b',
            transition:'width .4s ease',
          }}/>
        </div>

        {/* ── COMPLETION BANNER ── */}
        {completing && certResult && (
          <div style={{
            padding:'14px 22px', background:'linear-gradient(135deg,#1c4d37,#2d6a4f)',
            color:'white', flexShrink:0,
            display:'flex', alignItems:'center', justifyContent:'space-between',
            flexWrap:'wrap', gap:10,
          }}>
            <div>
              <strong style={{ fontSize:14 }}>🎓 Course Completed — Certificate Issued!</strong>
              <p style={{ margin:'2px 0 0', fontSize:11, color:'#c5ded0' }}>
                Certificate ID: <code style={{ background:'rgba(255,255,255,.15)', padding:'1px 6px',
                                               borderRadius:4 }}>{certResult.certificateId}</code>
                {' '}· +{certResult.creditAwarded} NEP credits awarded.
              </p>
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {certResult.pdfUrl && (
                <a href={certResult.pdfUrl} target="_blank" rel="noopener noreferrer"
                   className="button button-light" style={{ fontSize:11 }}>
                  ↓ Download Certificate
                </a>
              )}
              <Link to={`/verify/${certResult.certificateId}`} target="_blank"
                    className="button button-light" style={{ fontSize:11 }}>
                🔍 Verify
              </Link>
            </div>
          </div>
        )}

        {/* ── BODY ── */}
        <div style={{
          display:'grid', gridTemplateColumns:'1fr 310px',
          flex:1, overflow:'hidden',
        }}>
          {/* LEFT — Video player area */}
          <div style={{
            display:'flex', flexDirection:'column',
            padding:'18px 18px 14px', overflow:'auto',
          }}>
            {/* Player container */}
            {loadingVids ? (
              <div style={{
                aspectRatio:'16/9', background:'#e8f0e4', borderRadius:8,
                display:'grid', placeItems:'center', color:'#6a7d6e',
                fontSize:13, fontWeight:700,
              }}>Loading modules…</div>
            ) : activeVideo ? (
              <div style={{
                position:'relative', paddingBottom:'56.25%',
                height:0, borderRadius:8, overflow:'hidden',
                boxShadow:'0 4px 20px rgba(0,0,0,.12)',
              }}>
                <iframe
                  ref={iframeRef}
                  key={activeVideo.videoId}
                  src={`https://www.youtube-nocookie.com/embed/${activeVideo.videoId}?enablejsapi=1&rel=0&modestbranding=1&origin=${encodeURIComponent(window.location.origin)}`}
                  title={activeVideo.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  onLoad={() => handleIframeLoad(activeVideo)}
                  style={{
                    position:'absolute', top:0, left:0,
                    width:'100%', height:'100%', border:'none',
                  }}
                />
              </div>
            ) : (
              <div style={{
                aspectRatio:'16/9', background:'#e8f0e4', borderRadius:8,
                display:'grid', placeItems:'center', color:'#6a7d6e',
              }}>No videos available for this course.</div>
            )}

            {/* Now-playing info */}
            {activeVideo && (
              <div style={{ marginTop:12 }}>
                <p className="eyebrow" style={{ marginBottom:3 }}>
                  Module {activeVideo.id} · {activeVideo.topic}
                </p>
                <h3 style={{ margin:'0 0 4px', fontSize:14, color:'#1e3829', lineHeight:1.35 }}>
                  {activeVideo.title}
                </h3>
                <small style={{ color:'#7a8a7c', fontSize:10 }}>
                  {activeVideo.channel} · {activeVideo.duration}
                  {activeVideo.durationSeconds > 0 &&
                    ` · Watch ≥90% to mark complete`}
                </small>
              </div>
            )}

            {/* Notice */}
            {notice && (
              <p className="form-success" style={{ margin:'10px 0 0', fontSize:11 }}>{notice}</p>
            )}

            {/* Footer info */}
            <div style={{ marginTop:'auto', paddingTop:14,
                          borderTop:'1px solid #e8ede7', marginTop:14 }}>
              <div style={{
                display:'flex', justifyContent:'space-between',
                alignItems:'center', marginBottom:6,
              }}>
                <span style={{ fontSize:11, fontWeight:700, color:'#3a5443' }}>
                  Overall completion
                </span>
                <strong style={{ fontSize:13, color:'#254a36' }}>{progress}%</strong>
              </div>
              <div className="progress" style={{ height:8, marginBottom:8 }}>
                <i style={{ width:`${progress}%`,
                            background: progress === 100 ? '#2b7550' : '#6ea65b' }}/>
              </div>
              <p style={{ margin:0, fontSize:10, color:'#8a968c', textAlign:'center' }}>
                {course.credits} NEP credits · {course.hours}h estimated ·{' '}
                {course.provider || 'Prashikshan Learning Hub'}
              </p>
              <p style={{ margin:'4px 0 0', fontSize:9, color:'#a0afa2', textAlign:'center' }}>
                Watch ≥90% of each video — the backend marks it complete automatically.
              </p>
            </div>
          </div>

          {/* RIGHT — Playlist sidebar */}
          <div style={{
            borderLeft:'1px solid #e2ebe0', overflowY:'auto',
            background:'#f8faf6', display:'flex', flexDirection:'column',
          }}>
            <div style={{
              padding:'13px 15px 9px', borderBottom:'1px solid #e2ebe0', flexShrink:0,
            }}>
              <p className="eyebrow" style={{ margin:0 }}>Course Modules</p>
              <small style={{ color:'#7a8a7c', fontSize:10 }}>
                {totalVideos} videos · auto-tracked at ≥90%
              </small>
            </div>

            <div style={{ flex:1, overflowY:'auto' }}>
              {loadingVids ? (
                <div style={{ padding:20, color:'#8a968c', fontSize:12 }}>Loading…</div>
              ) : (
                videos.map((video, idx) => {
                  const isActive = idx === activeIdx;
                  const isDone   = watchedIds.has(video.videoId);
                  const pct      = watchPct[video.videoId] || 0;
                  return (
                    <button
                      key={video.videoId}
                      onClick={() => setActiveIdx(idx)}
                      style={{
                        width:'100%', textAlign:'left', border:'none',
                        cursor:'pointer', padding:'11px 13px',
                        borderBottom:'1px solid #eaf0e7',
                        background: isActive ? '#edf5e9' : 'transparent',
                        transition:'background .15s',
                        display:'flex', gap:9, alignItems:'flex-start',
                      }}>
                      <div style={{ paddingTop:2 }}>
                        <Tick done={isDone} pct={isDone ? 100 : pct} />
                      </div>
                      <div style={{ minWidth:0 }}>
                        <p style={{
                          margin:'0 0 1px', fontSize:11, fontWeight:800,
                          color: isDone ? '#2b7550' : isActive ? '#1c563e' : '#2e4437',
                          overflow:'hidden', textOverflow:'ellipsis',
                          display:'-webkit-box', WebkitLineClamp:2,
                          WebkitBoxOrient:'vertical',
                        }}>
                          {video.id}. {video.title}
                        </p>
                        <span style={{ fontSize:9, color:'#7a8a7c' }}>
                          {video.topic} · {video.duration}
                        </span>
                      </div>
                    </button>
                  );
                })
              )}
            </div>

            {/* Sidebar footer */}
            <div style={{
              padding:'11px 13px', borderTop:'1px solid #e2ebe0',
              flexShrink:0, background:'#f2f7f0',
            }}>
              <div style={{
                display:'flex', justifyContent:'space-between',
                fontSize:10, fontWeight:700, color:'#3a5443', marginBottom:5,
              }}>
                <span>Watched</span>
                <span>{watchedCount} / {totalVideos}</span>
              </div>
              <div className="progress" style={{ height:5, marginBottom:8 }}>
                <i style={{ width:`${progress}%`, background:'#4d8b52' }}/>
              </div>
              {enrollment?.certificateId && !completing && (
                <div style={{ marginTop:6 }}>
                  <Link
                    to={`/verify/${enrollment.certificateId}`}
                    target="_blank"
                    className="button button-small button-outline"
                    style={{ width:'100%', fontSize:10, justifyContent:'center' }}>
                    🔍 View Certificate
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Courses Page ─────────────────────────────────────────────────────
export default function Courses() {
  const { user } = useAuth();
  const location = useLocation();

  const [courses, setCourses]       = useState([]);
  const [enrollments, setEnrollments] = useState([]);
  const [filter, setFilter]         = useState('all');
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [notice, setNotice]         = useState('');

  const [playerCourse, setPlayerCourse]     = useState(null);
  const [playerEnrollment, setPlayerEnrollment] = useState(null);

  // courseId → enrollment object
  const enrollmentMap = new Map(
    enrollments.map((e) => [String(e.course?._id || e.course), e])
  );

  const loadData = async () => {
    setLoading(true);
    try {
      const [courseData, enrollData] = await Promise.all([
        api('/courses'),
        user?.role === 'student'
          ? api('/courses/me/enrollments')
          : Promise.resolve({ enrollments: [] }),
      ]);
      setCourses(courseData.courses || []);
      setEnrollments(enrollData.enrollments || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []); // eslint-disable-line

  // Auto-open player when navigated here with a specific courseId (from Dashboard "Learn" button).
  // Use a ref so this fires only ONCE per navigation — not on every loadData re-render.
  const autoOpenFiredRef = useRef(false);
  useEffect(() => {
    const openCourseId = location.state?.openCourseId;
    if (!openCourseId || loading || courses.length === 0) return;
    if (autoOpenFiredRef.current) return; // already fired — don't reopen after loadData
    const course = courses.find((c) => String(c._id) === String(openCourseId));
    if (course) {
      autoOpenFiredRef.current = true;
      const enrollment = enrollmentMap.get(String(openCourseId)) || null;
      setPlayerCourse(course);
      setPlayerEnrollment(enrollment);
    }
  }, [loading, courses, location.state?.openCourseId]); // eslint-disable-line

  const enroll = async (id, e) => {
    e.stopPropagation();
    setError(''); setNotice('');
    try {
      const { enrollment } = await api(`/courses/${id}/enroll`, { method:'POST' });
      setEnrollments((prev) => [...prev, enrollment]);
      setNotice('Course added to your learning plan.');
    } catch (err) { setError(err.message); }
  };

  const openPlayer = (course) => {
    setPlayerCourse(course);
    setPlayerEnrollment(enrollmentMap.get(String(course._id)) || null);
  };

  const handleProgressUpdate = (enrollId, newProgress) => {
    setEnrollments((prev) =>
      prev.map((e) => String(e._id) === String(enrollId)
        ? { ...e, progress: newProgress } : e)
    );
  };

  const shown = filter === 'mine'
    ? courses.filter((c) => enrollmentMap.has(String(c._id)))
    : courses.filter((c) => filter === 'all' || c.level === filter);

  return (
    <div className="catalogue page-width">
      <section className="catalogue-heading">
        <div>
          <p className="eyebrow">Structured learning</p>
          <h1>Courses with a clear<br />career purpose.</h1>
          <p>
            Build relevant capabilities through guided, credit-bearing learning modules.
            Click any enrolled course to open the interactive video player.
          </p>
        </div>
        <div className="catalogue-note">
          <b>Every course includes</b>
          <span>7 curated video modules, auto-tracked</span>
          <span>Backend-verified 90% watch-time gate</span>
          <span>Auto-issued PDF certificate on completion</span>
        </div>
      </section>

      {(error || notice) && (
        <p className={error ? 'form-alert' : 'form-success'}>{error || notice}</p>
      )}

      <div className="filter-bar">
        <span>Filter by level</span>
        {LEVELS.map((level) => (
          <button key={level}
                  className={filter === level ? 'active' : ''}
                  onClick={() => setFilter(level)}>
            {level}
          </button>
        ))}
        <button
          className={filter === 'mine' ? 'active' : ''}
          onClick={() => setFilter('mine')}>
          My Courses
        </button>
      </div>

      {loading ? (
        <div className="page-loader">Loading courses…</div>
      ) : (
        <div className="course-grid">
          {shown.map((course) => {
            const enrollment  = enrollmentMap.get(String(course._id));
            const isEnrolled  = !!enrollment;
            const progress    = enrollment?.progress ?? 0;
            const isCompleted = enrollment?.status === 'completed';
            const certId      = enrollment?.certificateId;
            const lc          = levelColor(course.level);

            return (
              <article
                key={course._id}
                className="catalogue-card"
                style={{ position:'relative', cursor: isEnrolled ? 'pointer' : 'default' }}
                onClick={isEnrolled ? () => openPlayer(course) : undefined}>

                <div className="catalogue-card-top">
                  <span className="course-code">{course.code}</span>
                  <span style={{
                    padding:'3px 7px', borderRadius:12, fontSize:9,
                    fontWeight:800, background:lc.bg, color:lc.color,
                    textTransform:'capitalize',
                  }}>
                    {course.level}
                  </span>
                </div>

                <h2>{course.title}</h2>
                <p>{course.summary}</p>

                <div className="skill-chips">
                  {course.skills.map((s) => <span key={s}>{s}</span>)}
                </div>

                {isEnrolled && (
                  <div style={{ margin:'10px 0 6px' }}>
                    <div style={{
                      display:'flex', justifyContent:'space-between',
                      fontSize:9, fontWeight:700, color:'#3a5443', marginBottom:4,
                    }}>
                      <span>{isCompleted ? '✓ Completed' : 'In progress'}</span>
                      <span>{progress}%</span>
                    </div>
                    <div className="progress" style={{ height:5 }}>
                      <i style={{
                        width:`${progress}%`,
                        background: isCompleted ? '#2b7550' : '#6ea65b',
                      }}/>
                    </div>
                  </div>
                )}

                <div style={{ display:'flex', gap:6, flexWrap:'wrap',
                              marginBottom:10, fontSize:10, color:'#587060' }}>
                  <span style={{
                    padding:'2px 6px', background:'#e9f2e5',
                    borderRadius:4, fontWeight:700,
                  }}>▶ 7 video modules</span>
                  {isCompleted && !certId && (
                    <span style={{
                      padding:'2px 6px', background:'#e1f1df',
                      borderRadius:4, fontWeight:700, color:'#1f663c',
                    }}>🎓 Certified</span>
                  )}
                  {certId && (
                    <Link
                      to={`/verify/${certId}`}
                      target="_blank"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        padding:'2px 6px', background:'#e1f1df',
                        borderRadius:4, fontWeight:700, color:'#1f663c',
                        fontSize:10, textDecoration:'none',
                      }}>
                      🔍 Verify Certificate
                    </Link>
                  )}
                </div>

                <div className="course-card-footer">
                  <div>
                    <b>{course.credits} credits</b>
                    <small>{course.hours} guided hours</small>
                  </div>
                  {user?.role === 'student' ? (
                    isEnrolled ? (
                      <button
                        className="button button-small"
                        onClick={(e) => { e.stopPropagation(); openPlayer(course); }}>
                        {isCompleted ? '▶ Review' : '▶ Continue'}
                      </button>
                    ) : (
                      <button
                        className="button button-small button-outline"
                        onClick={(e) => enroll(course._id, e)}>
                        Add to plan
                      </button>
                    )
                  ) : (
                    <span className="muted">{course.provider}</span>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      )}

      {playerCourse && (
        <LearningPlayer
          course={playerCourse}
          enrollment={playerEnrollment}
          onClose={() => {
            setPlayerCourse(null);
            setPlayerEnrollment(null);
          }}
          onProgressUpdate={handleProgressUpdate}
        />
      )}
    </div>
  );
}
