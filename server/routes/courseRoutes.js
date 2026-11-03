'use strict';

const express    = require('express');
const Course     = require('../models/Course');
const Enrollment = require('../models/Enrollment');
const User       = require('../models/User');
const { requireAuth, allowRoles } = require('../lib/auth');
const requireAssessment = require('../middleware/requireAssessment');
const { getCourseVideos } = require('../services/youtubeService');
const { issueCertificate } = require('../services/certificateService');

const router    = express.Router();
const normalize = (v) => String(v || '').trim().toLowerCase();

// ─── GET /api/courses ──────────────────────────────────────────────────────
router.get('/', async (req, res, next) => {
  try {
    const query = { published: true };
    if (req.query.level) query.level = req.query.level;
    if (req.query.skill) query.skills = normalize(req.query.skill);
    const courses = await Course.find(query).sort({ level: 1, title: 1 });
    return res.json({ courses });
  } catch (e) { next(e); }
});

// ─── GET /api/courses/assessment-recommendations ──────────────────────────
// Returns courses that match the student's MOST RECENT assessment results only.
// Uses Assessment.results (the actual skills selected + proficiency levels from
// the latest completed assessment), not the full cumulative skillProfile.
router.get('/assessment-recommendations', requireAuth, allowRoles('student'), async (req, res, next) => {
  try {
    // Fetch the most recent completed assessment for this student
    const Assessment = require('../models/Assessment');
    const latestAssessment = await Assessment.findOne({
      student: req.auth.sub,
      status: 'completed',
    }).sort({ completedAt: -1 });

    if (!latestAssessment || !latestAssessment.results || !latestAssessment.results.length) {
      return res.json({ courses: [] });
    }

    const enrollmentIds = new Set(
      (await Enrollment.find({ student: req.auth.sub }).select('course'))
        .map((e) => String(e.course))
    );

    // Normalize level: ML uses 'legend', course data uses 'advanced'
    const normLevel = (l) => {
      const v = normalize(l || 'beginner');
      return v === 'legend' ? 'advanced' : v;
    };

    const allCourses = await Course.find({ published: true });
    const results = [];

    for (const sp of latestAssessment.results) {
      const targetSkill = normalize(sp.skill);
      const targetLevel = normLevel(sp.level);

      // Exact match: course covers this skill at this proficiency level
      const exact = allCourses.filter(
        (c) =>
          (c.skills || []).map(normalize).includes(targetSkill) &&
          normalize(c.level) === targetLevel
      );

      // Adjacent level fallback (one step up) when no exact match
      const adjacent = exact.length ? [] : allCourses.filter((c) => {
        const lvl = normalize(c.level);
        const cs  = (c.skills || []).map(normalize);
        if (!cs.includes(targetSkill)) return false;
        if (targetLevel === 'beginner')     return lvl === 'intermediate';
        if (targetLevel === 'intermediate') return lvl === 'advanced';
        return false;
      });

      const pool = exact.length ? exact : adjacent;

      // Prefer not-yet-enrolled; take up to 2 per skill
      const sorted = [...pool].sort(
        (a, b) =>
          (enrollmentIds.has(String(a._id)) ? 1 : 0) -
          (enrollmentIds.has(String(b._id)) ? 1 : 0)
      );

      for (const course of sorted.slice(0, 2)) {
        if (!results.find((r) => String(r._id) === String(course._id))) {
          results.push({
            ...course.toJSON(),
            enrolled: enrollmentIds.has(String(course._id)),
            matchedSkill: sp.skill,
            matchedLevel: sp.level,
            explainabilityTag: `Matched to your ${sp.level} level in ${sp.skill}`,
          });
        }
      }
    }

    return res.json({ courses: results });
  } catch (e) { next(e); }
});

// ─── GET /api/courses/recommended ─────────────────────────────────────────
router.get('/recommended', requireAuth, allowRoles('student'), async (req, res, next) => {
  try {
    const Assessment = require('../models/Assessment');
    const user          = await User.findById(req.auth.sub);
    const courses       = await Course.find({ published: true });
    const enrollmentIds = new Set(
      (await Enrollment.find({ student: user._id }).select('course'))
        .map((e) => String(e.course))
    );
    const profile   = new Map(user.skillProfile.map((item) => [normalize(item.skill), item]));
    const interests = user.interests.map(normalize);

    // Skills covered by the latest assessment — exclude from general recommendations
    const latestAssessment = await Assessment.findOne({
      student: req.auth.sub,
      status: 'completed',
    }).sort({ completedAt: -1 });
    const latestSkills = new Set(
      (latestAssessment?.results || []).map((r) => normalize(r.skill))
    );

    const ranked = courses.map((course) => {
      const cs = (course.skills || []).map(normalize);
      let gapSum = 0;
      let primarySkill = '', primaryLevel = 'beginner';

      if (!cs.length) {
        gapSum = 50;
      } else {
        for (const skill of cs) {
          const up = profile.get(skill);
          const sl = up?.level || 'beginner';
          const cl = normalize(course.level || 'beginner') === 'advanced' ? 'legend' : normalize(course.level || 'beginner');
          if (!primarySkill && up) { primarySkill = skill; primaryLevel = sl; }
          if      (sl === 'beginner')     gapSum += cl === 'beginner' ? 100 : cl === 'intermediate' ? 55 : 15;
          else if (sl === 'intermediate') gapSum += cl === 'intermediate' ? 100 : cl === 'beginner' ? 60 : 45;
          else                            gapSum += cl === 'legend' ? 100 : cl === 'intermediate' ? 50 : 10;
        }
        gapSum /= cs.length;
      }
      const phaseGapWeight = Math.min(100, Math.max(0, gapSum));
      const interestHits   = cs.filter((s) => interests.includes(s)).length;
      const intAlign       = cs.length ? Math.min(100, Math.round((interestHits / cs.length) * 100)) : 0;
      const creditEff      = Math.min(100, Math.round((course.hours ? course.credits / course.hours : 0.1) * 500));

      // Deprioritize courses whose skills are all covered by the latest assessment
      // so they appear in the assessment section instead
      const allSkillsInLatest = cs.length > 0 && cs.every((s) => latestSkills.has(s));
      const latestPenalty = allSkillsInLatest ? -40 : 0;

      const rankScore = Math.round(phaseGapWeight * 0.45 + intAlign * 0.35 + creditEff * 0.20) + latestPenalty;

      let tag = '';
      if (primarySkill) {
        const dl = primaryLevel === 'legend' ? 'Legend' : primaryLevel.charAt(0).toUpperCase() + primaryLevel.slice(1);
        tag = `Recommended for your ${dl} status in ${primarySkill}`;
      } else if (interestHits > 0) {
        tag = `Matches your interest in ${cs.find((s) => interests.includes(s)) || 'this domain'}`;
      } else if (course.credits >= 3) {
        tag = `High credit efficiency course (${course.credits} credits)`;
      } else {
        tag = 'Foundational module to expand your skill set';
      }

      return { ...course.toJSON(), matchScore: rankScore, explainabilityTag: tag, enrolled: enrollmentIds.has(course.id) };
    }).sort((a, b) => b.matchScore - a.matchScore);

    return res.json({ courses: ranked });
  } catch (e) { next(e); }
});

// ─── GET /api/courses/me/enrollments ──────────────────────────────────────
router.get('/me/enrollments', requireAuth, allowRoles('student'), async (req, res, next) => {
  try {
    const enrollments = await Enrollment.find({ student: req.auth.sub }).populate('course').sort({ updatedAt: -1 });
    return res.json({ enrollments });
  } catch (e) { next(e); }
});

// ─── GET /api/courses/:courseId/videos ────────────────────────────────────
// Returns structured video modules from the course document (if already
// seeded) and falls back to the youtubeService curated library.
router.get('/:courseId/videos', async (req, res, next) => {
  try {
    const course = await Course.findById(req.params.courseId).select('code skills title videos');
    if (!course) return res.status(404).json({ error: 'Course not found.' });
    // Prefer embedded videos array; fall back to curated library
    const videos = (course.videos && course.videos.length)
      ? course.videos
      : getCourseVideos(course.code, course.skills);
    return res.json({ videos, courseTitle: course.title });
  } catch (e) { next(e); }
});

// ─── POST /api/courses ────────────────────────────────────────────────────
router.post('/', requireAuth, allowRoles('coordinator'), async (req, res, next) => {
  try {
    const course = await Course.create({ ...req.body, skills: (req.body.skills || []).map(normalize) });
    return res.status(201).json({ course });
  } catch (e) { next(e); }
});

// ─── POST /api/courses/:courseId/enroll ───────────────────────────────────
router.post('/:courseId/enroll', requireAuth, allowRoles('student'), requireAssessment, async (req, res, next) => {
  try {
    const course = await Course.findOne({ _id: req.params.courseId, published: true });
    if (!course) return res.status(404).json({ error: 'Course not found.' });
    const enrollment = await Enrollment.create({
      student:        req.auth.sub,
      course:         course._id,
      estimatedHours: course.hours || 0,
      startedAt:      new Date(),
    });
    return res.status(201).json({ enrollment: await enrollment.populate('course') });
  } catch (e) {
    if (e?.code === 11000) return res.status(409).json({ error: 'You are already enrolled in this course.' });
    return next(e);
  }
});

// ─── PATCH /api/courses/enrollments/:id ───────────────────────────────────
// Lightweight progress-only update (used by legacy UI paths).
// Credit awarding is handled exclusively by /complete and /track-video.
router.patch('/enrollments/:id', requireAuth, allowRoles('student'), async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findOne({ _id: req.params.id, student: req.auth.sub }).populate('course');
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found.' });
    const progress = Number(req.body.progress);
    if (!Number.isFinite(progress) || progress < 0 || progress > 100)
      return res.status(400).json({ error: 'Progress must be between 0 and 100.' });
    enrollment.progress = progress;
    if (Number.isFinite(Number(req.body.hoursSpent)))
      enrollment.actualHoursSpent = Math.max(enrollment.actualHoursSpent, Number(req.body.hoursSpent));
    await enrollment.save();
    return res.json({ enrollment });
  } catch (e) { next(e); }
});

// ─── POST /api/courses/enrollments/:id/track-video ────────────────────────
//
// Called automatically by the YT IFrame player when ≥90% of a video has
// been watched.  The backend is the sole source of truth — it verifies that:
//   1. The enrollment belongs to this student.
//   2. The videoId exists in the course's video list (anti-stuffing).
//   3. watchTimeSeconds ≥ 90% of the video's durationSeconds (if known).
//   4. The video has not already been recorded as watched.
//
// Completion chain:
//   All videos watched  →  enrollment.status = 'completed'
//                       →  NEP credits awarded to user.credits
//                       →  Certificate PDF generated + Certificate document saved
//
router.post('/enrollments/:id/track-video', requireAuth, allowRoles('student'), async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findOne({ _id: req.params.id, student: req.auth.sub })
      .populate('course');
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found.' });
    if (enrollment.status === 'completed')
      return res.json({ alreadyCompleted: true, certificateId: enrollment.certificateId || null });

    const { videoId, watchTimeSeconds } = req.body;
    if (!videoId) return res.status(400).json({ error: 'videoId is required.' });

    // ── Validate videoId belongs to this course ──────────────────────────
    const course = enrollment.course;
    // Source of truth: course.videos (seeded) → fallback to youtubeService library
    const courseVideos = (course.videos && course.videos.length)
      ? course.videos
      : getCourseVideos(course.code, course.skills);

    const videoMeta = courseVideos.find((v) => v.videoId === videoId);
    if (!videoMeta) return res.status(400).json({ error: 'This video is not part of the course.' });

    // ── 90% watch-time gate ──────────────────────────────────────────────
    if (Number.isFinite(Number(watchTimeSeconds)) && videoMeta.durationSeconds > 0) {
      const pct = Number(watchTimeSeconds) / videoMeta.durationSeconds;
      if (pct < 0.90) {
        return res.status(400).json({
          error: `Watch-time insufficient. Watched ${Math.round(pct * 100)}% — need ≥90%.`,
          watchedPct: Math.round(pct * 100),
        });
      }
    }

    // ── Idempotency: skip if already logged ──────────────────────────────
    const alreadyWatched = enrollment.watchedVideos.some((w) => w.videoId === videoId);
    if (!alreadyWatched) {
      enrollment.watchedVideos.push({ videoId, completedAt: new Date() });
    }

    // ── Recompute progress ───────────────────────────────────────────────
    const totalVideos   = courseVideos.length;
    const watchedCount  = enrollment.watchedVideos.length;
    enrollment.progress = totalVideos > 0
      ? Math.round((watchedCount / totalVideos) * 100)
      : 0;

    const allDone = watchedCount >= totalVideos && totalVideos > 0;

    let certificate  = null;
    let creditAwarded = 0;

    if (allDone && enrollment.status !== 'completed') {
      // ── Mark completed ────────────────────────────────────────────────
      enrollment.status      = 'completed';
      enrollment.completedAt = new Date();
      enrollment.progress    = 100;

      // ── Award NEP credits ────────────────────────────────────────────
      if (!enrollment.creditAwarded) {
        const user = await User.findById(req.auth.sub);
        creditAwarded = course.credits;
        user.credits.push({
          sourceType: 'course',
          sourceId:   course._id,
          title:      course.title,
          credits:    creditAwarded,
          grade:      'Completed',
        });
        await user.save();
        enrollment.creditAwarded = true;
      }

      await enrollment.save();   // save before cert so certificateId can be set

      // ── Generate certificate ─────────────────────────────────────────
      try {
        const user    = await User.findById(req.auth.sub).select('name');
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        certificate = await issueCertificate({
          studentName:   user.name,
          courseName:    course.title,
          courseCode:    course.code,
          credits:       course.credits,
          studentId:     req.auth.sub,
          courseId:      course._id,
          enrollmentDoc: enrollment,
          baseUrl,
        });
      } catch (certErr) {
        // Certificate generation failure must NOT roll back the completion —
        // log it and continue; the student can regenerate later.
        console.error('[Certificate] Generation error (non-fatal):', certErr.message);
      }
    } else {
      await enrollment.save();
    }

    return res.json({
      watchedCount,
      totalVideos,
      progress: enrollment.progress,
      completed: allDone,
      creditAwarded,
      certificateId:  certificate?.certificateId || enrollment.certificateId || null,
      pdfUrl:         certificate?.pdfUrl || null,
    });
  } catch (e) { next(e); }
});

// ─── POST /api/courses/enrollments/:id/complete ───────────────────────────
// Legacy certificate-URL proof path (kept for Dashboard.jsx CertificateModal).
router.post('/enrollments/:id/complete', requireAuth, allowRoles('student'), async (req, res, next) => {
  try {
    const enrollment = await Enrollment.findOne({ _id: req.params.id, student: req.auth.sub }).populate('course');
    if (!enrollment) return res.status(404).json({ error: 'Enrollment not found.' });
    if (enrollment.status === 'completed') return res.status(409).json({ error: 'This course is already marked as completed.' });

    const certInput = String(req.body.certificateFile || '').trim();
    if (!certInput) return res.status(400).json({ error: 'Please provide a certificate URL or proof of completion link.' });

    const estimatedHours = enrollment.estimatedHours || enrollment.course?.hours || 1;
    const elapsedMs      = Date.now() - new Date(enrollment.startedAt || enrollment.createdAt);
    const elapsedHours   = elapsedMs / 3_600_000;
    const MIN_RATIO      = 0.30;
    const elapsedRatio   = elapsedHours / estimatedHours;
    const isSuspicious   = elapsedRatio < MIN_RATIO;
    const fullCredits    = enrollment.course?.credits || 1;
    let creditsToAward   = fullCredits;
    let completionNote   = '';
    let penaltyApplied   = false;

    if (isSuspicious) {
      const raw      = Math.round(fullCredits * (elapsedRatio / MIN_RATIO) * 0.75);
      creditsToAward = Math.min(fullCredits - 1, Math.max(1, raw));
      penaltyApplied = true;
      completionNote = `Accelerated completion: ${elapsedHours.toFixed(1)}h of ${estimatedHours}h ` +
                       `(${Math.round(elapsedRatio*100)}%). ${creditsToAward}/${fullCredits} credits awarded.`;
    }

    enrollment.progress        = 100;
    enrollment.status          = 'completed';
    enrollment.completedAt     = new Date();
    enrollment.certificateFile = certInput;
    enrollment.completionNote  = completionNote;
    if (Number.isFinite(Number(req.body.hoursSpent))) enrollment.actualHoursSpent = Number(req.body.hoursSpent);

    if (!enrollment.creditAwarded) {
      const user = await User.findById(req.auth.sub);
      user.credits.push({
        sourceType: 'course', sourceId: enrollment.course._id,
        title:  penaltyApplied ? `${enrollment.course.title} (accelerated — ${creditsToAward}/${fullCredits} cr)` : enrollment.course.title,
        credits: creditsToAward, grade: penaltyApplied ? 'Accelerated' : 'Completed',
      });
      await user.save();
      enrollment.creditAwarded = true;
    }
    await enrollment.save();

    return res.json({ enrollment, creditsAwarded: creditsToAward, penaltyApplied, completionNote,
                      elapsedHours: Math.round(elapsedHours * 10) / 10, estimatedHours });
  } catch (e) { next(e); }
});

module.exports = router;
