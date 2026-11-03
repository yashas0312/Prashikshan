import { useEffect, useState } from 'react';
import { api } from '../services/api';

export default function CoordinatorDashboard() {
  const [data, setData] = useState(null);
  const [approvedPartners, setApprovedPartners] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [courseForm, setCourseForm] = useState({
    code: '', title: '', summary: '', skills: '', level: 'beginner', hours: 24, credits: 2, courseUrl: '',
  });
  const load = async () => {
    try {
      const [overview, approved] = await Promise.all([
        api('/coordination/overview'),
        api('/coordination/partners/approved').catch(() => ({ partners: [] })),
      ]);
      setData(overview);
      setApprovedPartners(approved.partners || []);
    } catch (requestError) { setError(requestError.message); }
  };
  useEffect(() => {
    let active = true;
    load().finally(() => { if (!active) return; });
    return () => { active = false; };
  }, []);
  const reviewPartner = async (partner, verified) => { try { await api(`/coordination/partners/${partner._id}/verify`, { method: 'PATCH', body: { verified } }); setNotice(`${partner.organization} ${verified ? 'verified' : 'rejected'}.`); await load(); } catch (requestError) { setError(requestError.message); } };
  const reviewInternship = async (internship, approved) => { try { await api(`/coordination/internships/${internship._id}/review`, { method: 'PATCH', body: { approved } }); setNotice(`${internship.title} ${approved ? 'published and visible to students' : 'rejected'}.`); await load(); } catch (requestError) { setError(requestError.message); } };
  const createCourse = async (event) => {
    event.preventDefault();
    try {
      await api('/courses', { method: 'POST', body: {
        ...courseForm,
        skills: courseForm.skills.split(',').map((item) => item.trim()).filter(Boolean),
        hours: Number(courseForm.hours),
        credits: Number(courseForm.credits),
        modules: [],
        courseUrl: courseForm.courseUrl || '',
      }});
      setCourseForm({ code: '', title: '', summary: '', skills: '', level: 'beginner', hours: 24, credits: 2, courseUrl: '' });
      setNotice('Course added to the learning catalogue.');
      await load();
    } catch (requestError) { setError(requestError.message); }
  };
  if (!data) return <div className="page-loader">Loading coordination workspace…</div>;

  return (
    <div className="workspace page-width">
      <section className="workspace-hero">
        <div>
          <p className="eyebrow">Coordinator workspace</p>
          <h1>Keep experiential learning accountable.</h1>
          <p>Verify industry partners and opportunities while monitoring the activity that counts toward student records.</p>
        </div>
      </section>

      {(error || notice) && <p className={error ? 'form-alert' : 'form-success'}>{error || notice}</p>}

      <div className="metric-grid">
        <div className="metric-card"><span>Students</span><strong>{data.metrics.students}</strong><small>Registered learners</small></div>
        <div className="metric-card"><span>Industry partners</span><strong>{data.metrics.partners}</strong><small>Organisations in ecosystem</small></div>
        <div className="metric-card"><span>Total internships</span><strong>{data.metrics.totalInternships}</strong><small>Posted on platform</small></div>
        <div className="metric-card"><span>Course catalogue</span><strong>{data.metrics.courses}</strong><small>Structured learning modules</small></div>
        <div className="metric-card metric-card-accent"><span>Pending approval</span><strong>{data.metrics.pendingInternships}</strong><small>Internship submissions</small></div>
        <div className="metric-card metric-card-accent"><span>Pending verification</span><strong>{data.metrics.pendingVerifications}</strong><small>Company requests</small></div>
      </div>

      <div className="review-layout">
        {/* Organisation verification */}
        <section className="panel">
          <div className="panel-heading">
            <div><p className="eyebrow">Partner due diligence</p><h2>Organisation verification</h2></div>
          </div>
          {data.pendingPartners.length ? (
            <div className="review-list">
              {data.pendingPartners.map((partner) => (
                <div key={partner._id}>
                  <div style={{ flex: 1 }}>
                    <h3 style={{ margin: '0 0 2px' }}>{partner.organization}</h3>
                    <p style={{ margin: '0 0 6px', color: '#5a6a5c', fontSize: 13 }}>
                      {partner.name} · {partner.email}
                    </p>
                    {/* Partner profile identity details */}
                    {partner.isProfileComplete ? (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '4px 16px',
                                    fontSize: 11, color: '#3a4e40', margin: '8px 0' }}>
                        {partner.jobTitle && <span><b>Title:</b> {partner.jobTitle}</span>}
                        {partner.department && <span><b>Dept:</b> {partner.department}</span>}
                        {partner.employeeId && <span><b>Employee / CIN:</b> {partner.employeeId}</span>}
                        {partner.companyEmail && <span><b>Company email:</b> {partner.companyEmail}</span>}
                        {partner.contactNumber && <span><b>Contact:</b> {partner.contactNumber}</span>}
                        {partner.companyAddress && (
                          <span style={{ gridColumn: '1 / -1' }}><b>Address:</b> {partner.companyAddress}</span>
                        )}
                      </div>
                    ) : (
                      <small style={{ color: '#946914', fontSize: 10 }}>
                        ⚠ Profile incomplete — partner has not finished onboarding.
                      </small>
                    )}
                    {partner.verificationRequested && (
                      <span style={{ display: 'inline-block', marginTop: 6, fontSize: 9,
                                     fontWeight: 800, color: '#1c563e',
                                     background: '#e1f1df', padding: '2px 6px', borderRadius: 4 }}>
                        Verification requested
                      </span>
                    )}
                  </div>
                  <div className="review-actions">
                    <button className="button button-small" onClick={() => reviewPartner(partner, true)}>Verify</button>
                    <button className="button button-small button-outline" onClick={() => reviewPartner(partner, false)}>Reject</button>
                  </div>
                </div>
              ))}
            </div>
          ) : <p className="empty-inline">No partner accounts are awaiting review.</p>}
        </section>

        {/* Internship review */}
        <section className="panel">
          <div className="panel-heading">
            <div><p className="eyebrow">Opportunity review</p><h2>Internship submissions</h2></div>
          </div>
          {data.pendingInternships.length ? (
            <div className="review-list">
              {data.pendingInternships.map((internship) => {
                const partner = internship.postedBy;
                return (
                  <div key={internship._id} style={{ flexDirection: 'column', alignItems: 'stretch', gap: 14 }}>
                    {/* Submitting partner identity */}
                    <div style={{ padding: '10px 12px', background: '#f4f8f2',
                                  borderRadius: 6, border: '1px solid #d4e8c8' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                        <p className="eyebrow" style={{ margin: 0 }}>Submitted by</p>
                        {partner?.isVerifiedPartner
                          ? <span style={{ fontSize: 9, fontWeight: 800, color: '#1c563e',
                                           background: '#e1f1df', padding: '2px 6px', borderRadius: 4 }}>
                              ✓ Verified partner
                            </span>
                          : <span style={{ fontSize: 9, fontWeight: 800, color: '#946914',
                                           background: '#fef9e8', padding: '2px 6px', borderRadius: 4 }}>
                              Unverified
                            </span>
                        }
                      </div>
                      {partner ? (
                        <>
                          <strong style={{ fontSize: 13, color: '#1e3829' }}>{partner.organization}</strong>
                          <p style={{ margin: '2px 0 6px', fontSize: 11, color: '#5a6a5c' }}>
                            {partner.name} · {partner.email}
                          </p>
                          {partner.isProfileComplete && (
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr',
                                          gap: '3px 14px', fontSize: 10, color: '#3a4e40' }}>
                              {partner.jobTitle && <span><b>Title:</b> {partner.jobTitle}</span>}
                              {partner.department && <span><b>Dept:</b> {partner.department}</span>}
                              {partner.employeeId && <span><b>Employee / CIN:</b> {partner.employeeId}</span>}
                              {partner.companyEmail && <span><b>Company email:</b> {partner.companyEmail}</span>}
                              {partner.contactNumber && <span><b>Contact:</b> {partner.contactNumber}</span>}
                              {partner.companyAddress && (
                                <span style={{ gridColumn: '1 / -1' }}><b>Address:</b> {partner.companyAddress}</span>
                              )}
                            </div>
                          )}
                        </>
                      ) : (
                        <p style={{ margin: 0, fontSize: 11, color: '#946914' }}>Partner account not found.</p>
                      )}
                    </div>

                    {/* Internship details */}
                    <div>
                      <h3 style={{ margin: '0 0 4px' }}>{internship.title}</h3>
                      <p style={{ margin: '0 0 6px', fontSize: 12, color: '#3a4e40' }}>
                        {internship.location} · <span style={{ textTransform: 'capitalize' }}>{internship.mode}</span>
                        {' · '}{internship.durationWeeks} weeks · {internship.credits} credits
                        {internship.stipend > 0 && ` · ₹${internship.stipend.toLocaleString('en-IN')}/mo`}
                        {' · '}{internship.capacity} seat{internship.capacity !== 1 ? 's' : ''}
                      </p>
                      <div className="skill-chips" style={{ margin: '4px 0 8px' }}>
                        {internship.skills.map((s) => <span key={s}>{s}</span>)}
                      </div>
                      <p style={{ margin: '0 0 6px', fontSize: 12, color: '#3a4e40', lineHeight: 1.6 }}>
                        {internship.description}
                      </p>
                      <small style={{ color: '#7a8a7c', fontSize: 10 }}>
                        Application deadline: {new Date(internship.deadline).toLocaleDateString('en-IN')}
                      </small>
                    </div>

                    <div className="review-actions" style={{ borderTop: '1px solid #e4ede0', paddingTop: 10 }}>
                      <button className="button button-small" onClick={() => reviewInternship(internship, true)}>Approve</button>
                      <button className="button button-small button-outline" onClick={() => reviewInternship(internship, false)}>Reject</button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : <p className="empty-inline">No internships are awaiting review.</p>}
        </section>
      </div>

      {/* Approved Partners */}
      <section className="panel" style={{ marginBottom: 18 }}>
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Verified industry partners</p>
            <h2>Approved Partners</h2>
          </div>
          <span style={{ fontSize: 11, fontWeight: 700, color: '#2d6040' }}>
            {approvedPartners.length} verified
          </span>
        </div>
        {approvedPartners.length ? (
          <div className="role-list">
            {approvedPartners.map((partner) => (
              <div key={partner._id}>
                <div>
                  <h3>{partner.organization}</h3>
                  <p>{partner.name} · {partner.email}</p>
                  {partner.jobTitle && (
                    <small style={{ color: '#5a6a5c', fontSize: 10 }}>{partner.jobTitle}{partner.companyEmail ? ` · ${partner.companyEmail}` : ''}</small>
                  )}
                </div>
                <span className="verification-status verified">✓ Verified</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="empty-inline">No partners have been verified yet.</p>
        )}
      </section>

      <div className="review-layout">
        {/* Course management */}
        <section className="panel">
          <p className="eyebrow">Course management</p>
          <h2>Add a structured course</h2>
          <form className="stack-form" onSubmit={createCourse}>
            <div className="field-grid">
              <label>Course code<input required value={courseForm.code} onChange={(event) => setCourseForm({ ...courseForm, code: event.target.value })} placeholder="WEB-101" /></label>
              <label>Course title<input required value={courseForm.title} onChange={(event) => setCourseForm({ ...courseForm, title: event.target.value })} /></label>
            </div>
            <label>Summary<textarea required value={courseForm.summary} onChange={(event) => setCourseForm({ ...courseForm, summary: event.target.value })} /></label>
            <div className="field-grid three">
              <label>Skills<input required value={courseForm.skills} onChange={(event) => setCourseForm({ ...courseForm, skills: event.target.value })} placeholder="react, javascript" /></label>
              <label>Hours<input min="1" type="number" value={courseForm.hours} onChange={(event) => setCourseForm({ ...courseForm, hours: event.target.value })} /></label>
              <label>Credits<input min="1" type="number" value={courseForm.credits} onChange={(event) => setCourseForm({ ...courseForm, credits: event.target.value })} /></label>
            </div>
            <label>Level
              <select value={courseForm.level} onChange={(event) => setCourseForm({ ...courseForm, level: event.target.value })}>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="advanced">Advanced</option>
              </select>
            </label>
            <label>Course URL <span className="optional">optional</span>
              <input type="url" value={courseForm.courseUrl}
                     onChange={(event) => setCourseForm({ ...courseForm, courseUrl: event.target.value })}
                     placeholder="https://example.com/course" />
            </label>
            <button className="button button-full">Publish course</button>
          </form>
        </section>

        {/* Recent applications */}
        <section className="panel">
          <div className="panel-heading">
            <div><p className="eyebrow">Platform activity</p><h2>Recent applications</h2></div>
          </div>
          {data.recentApplications.length ? (
            <div className="application-list">
              {data.recentApplications.map((application) => (
                <article className="application-row" key={application._id}>
                  <div>
                    <h3>{application.student?.name} <span className="muted">applied for</span> {application.internship?.title}</h3>
                    <p>{application.internship?.organization} · {application.student?.email}</p>
                  </div>
                  <span className={`status status-${application.status}`}>{application.status}</span>
                </article>
              ))}
            </div>
          ) : <p className="empty-inline">Application activity will appear here.</p>}
        </section>
      </div>
    </div>
  );
}
