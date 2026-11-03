const express = require('express');
const Assessment = require('../models/Assessment');
const DailyRevision = require('../models/DailyRevision');
const Enrollment = require('../models/Enrollment');
const User = require('../models/User');
const { getMixedQuiz } = require('../services/quizService');
const { generateQuizForSkills } = require('../services/geminiService');
const { predictSkillLevels, localFallbackTier } = require('../services/mlClient');
const { requireAuth, allowRoles } = require('../lib/auth');
const { parseResume } = require('../services/resumeParser');
const multer = require('multer');

const router = express.Router();
const normalizeSkill = (skill) => String(skill || '').trim().toLowerCase();

// Multer: memory storage, 5 MB limit, PDF/DOCX only
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const allowed = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword',
    ];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only PDF and DOCX files are accepted.'));
  },
});

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

// POST /api/assessments/parse-resume
router.post('/parse-resume', requireAuth, allowRoles('student'), upload.single('resume'), async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Please upload a PDF or DOCX resume file.' });
    const { skills } = await parseResume(req.file.buffer, req.file.mimetype);
    return res.json({ skills });
  } catch (error) {
    next(error);
  }
});

router.post('/start', requireAuth, allowRoles('student'), async (req, res, next) => {
  try {
    const skills = [...new Set((req.body.skills || []).map(normalizeSkill).filter(Boolean))].slice(0, 7);
    if (!skills.length) return res.status(400).json({ error: 'Select at least one skill to begin the assessment.' });
    const questions = skills.flatMap((skill) => getMixedQuiz(skill).map((question) => ({ skill, prompt: question.question, options: question.options, answer: question.answer })));
    if (!questions.length) return res.status(400).json({ error: 'Questions are not available for the selected skills.' });
    const assessment = await Assessment.create({ student: req.auth.sub, questions, expiresAt: new Date(Date.now() + 30 * 60 * 1000) });
    return res.status(201).json({ assessmentId: assessment.id, expiresAt: assessment.expiresAt, questions: assessment.questions.map((question, index) => ({ id: index, skill: question.skill, prompt: question.prompt, options: question.options })) });
  } catch (error) { next(error); }
});

router.post('/:id/submit', requireAuth, allowRoles('student'), async (req, res, next) => {
  try {
    const assessment = await Assessment.findOne({ _id: req.params.id, student: req.auth.sub });
    if (!assessment) return res.status(404).json({ error: 'Assessment not found.' });
    if (assessment.status === 'completed') return res.status(409).json({ error: 'This assessment has already been submitted.' });
    if (assessment.expiresAt < new Date()) return res.status(410).json({ error: 'This assessment has expired. Please start again.' });

    const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
    const answerById = new Map(answers.map((answer) => [Number(answer.id), answer.value]));
    if (assessment.questions.some((_question, index) => !answerById.has(index))) return res.status(400).json({ error: 'Answer every question before submitting.' });

    const buckets = new Map();
    assessment.questions.forEach((question, index) => {
      const current = buckets.get(question.skill) || { skill: question.skill, score: 0, total: 0 };
      current.total += 1;
      if (answerById.get(index) === question.answer) current.score += 1;
      buckets.set(question.skill, current);
    });

    const rawResults = [...buckets.values()].map((item) => {
      const percentage = Math.round((item.score / item.total) * 100);
      return { ...item, percentage };
    });

    // ML Microservice evaluation with Node resiliency
    const scoreMap = {};
    rawResults.forEach((item) => { scoreMap[item.skill] = item.percentage / 100.0; });
    const mlPredictedLevels = await predictSkillLevels(scoreMap);

    const results = rawResults.map((item) => {
      const rawLevel = mlPredictedLevels[item.skill] || localFallbackTier(item.percentage);
      // Coerce to canonical 3-tier value — guards against any unexpected ML output
      const validLevels = ['beginner', 'intermediate', 'legend'];
      const level = validLevels.includes(rawLevel) ? rawLevel : localFallbackTier(item.percentage);
      return { ...item, level };
    });

    assessment.results = results;
    assessment.status = 'completed';
    assessment.completedAt = new Date();
    await assessment.save();

    const user = await User.findById(req.auth.sub);
    for (const result of results) {
      const existing = user.skillProfile.find((skill) => skill.skill === result.skill);
      if (existing) Object.assign(existing, { level: result.level, score: result.percentage, assessedAt: new Date() });
      else user.skillProfile.push({ skill: result.skill, level: result.level, score: result.percentage });
    }

    user.skills = [...new Set([...user.skills.map(normalizeSkill), ...results.map((result) => result.skill)])];
    user.isAssessed = true;
    user.credits.push({ sourceType: 'assessment', sourceId: assessment._id, title: 'Skill assessment', credits: 1, grade: 'Completed' });
    await user.save();

    return res.json({ results, creditAwarded: 1, user: { isAssessed: user.isAssessed, skillProfile: user.skillProfile } });
  } catch (error) { next(error); }
});

router.get('/history/me', requireAuth, allowRoles('student'), async (req, res, next) => {
  try {
    const assessments = await Assessment.find({ student: req.auth.sub, status: 'completed' }).select('results completedAt').sort({ completedAt: -1 }).limit(12);
    return res.json({ assessments });
  } catch (error) { next(error); }
});

// GET /api/assessments/daily-revision
router.get('/daily-revision', requireAuth, allowRoles('student'), async (req, res, next) => {
  try {
    const today = getTodayString();
    let revision = await DailyRevision.findOne({ student: req.auth.sub, date: today }).populate('courses', 'title code');

    if (revision) {
      return res.json({
        dailyRevision: {
          id: revision._id,
          date: revision.date,
          completed: revision.completed,
          score: revision.score,
          percentage: revision.percentage,
          questions: revision.questions.map((q, idx) => ({ id: idx, skill: q.skill, prompt: q.prompt, options: q.options })),
        },
        completed: revision.completed
      });
    }

    // Generate fresh daily questions based on the user's assessed skills and proficiency levels
    const user = await User.findById(req.auth.sub);

    // Use skills from the user's skill profile (set by the most recent assessment).
    // Fall back to a default set only if no assessment has been completed yet.
    let assessedSkills = (user.skillProfile || [])
      .filter(sp => sp.skill && sp.level)
      .map(sp => ({ skill: normalizeSkill(sp.skill), level: sp.level }));

    if (!assessedSkills.length) {
      assessedSkills = ['javascript', 'react', 'python', 'html', 'css']
        .map(s => ({ skill: s, level: 'beginner' }));
    }

    // Build 5 questions distributed across assessed skills.
    // Pick questions matching each skill's assessed proficiency level.
    let questions = [];
    const skillCount = assessedSkills.length;

    for (let i = 0; i < assessedSkills.length && questions.length < 5; i++) {
      const { skill, level } = assessedSkills[i];
      const local = getMixedQuiz(skill); // already returns 1 per level tier (3 total)
      if (local.length > 0) {
        // Pick one question; rotate through pool to spread coverage
        const pick = local[i % local.length];
        questions.push({ skill, prompt: pick.question, options: pick.options, answer: pick.answer });
      }
    }

    // If we still need more questions to reach 5, cycle through assessed skills again
    let cycle = 0;
    while (questions.length < 5 && assessedSkills.length > 0) {
      const { skill } = assessedSkills[cycle % skillCount];
      const local = getMixedQuiz(skill);
      if (local.length > 0) {
        const pick = local[Math.floor(Math.random() * local.length)];
        // avoid exact duplicate prompts
        if (!questions.find(q => q.prompt === pick.question)) {
          questions.push({ skill, prompt: pick.question, options: pick.options, answer: pick.answer });
        }
      }
      cycle++;
      if (cycle > skillCount * 10) break; // safety exit
    }

    questions = questions.slice(0, 5);

    // Collect course IDs for enrolled courses (kept for DailyRevision schema compatibility)
    const enrollments = await Enrollment.find({ student: req.auth.sub, status: 'enrolled' }).select('course');
    const activeCourseIds = enrollments.map(e => e.course).filter(Boolean);

    try {
      revision = await DailyRevision.create({
        student: req.auth.sub,
        date: today,
        courses: activeCourseIds,
        questions,
        completed: false
      });
    } catch (createErr) {
      if (createErr?.code === 11000) {
        revision = await DailyRevision.findOne({ student: req.auth.sub, date: today });
      } else {
        throw createErr;
      }
    }

    return res.json({
      dailyRevision: {
        id: revision._id,
        date: revision.date,
        completed: false,
        score: 0,
        percentage: 0,
        questions: revision.questions.map((q, idx) => ({ id: idx, skill: q.skill, prompt: q.prompt, options: q.options })),
      },
      completed: false
    });
  } catch (error) { next(error); }
});

// POST /api/assessments/daily-revision/submit
router.post('/daily-revision/submit', requireAuth, allowRoles('student'), async (req, res, next) => {
  try {
    const today = getTodayString();
    const revision = await DailyRevision.findOne({ student: req.auth.sub, date: today });
    if (!revision) return res.status(404).json({ error: 'Daily revision test for today was not found.' });
    if (revision.completed) return res.status(409).json({ error: 'You have already completed today\'s revision test.' });

    const answers = Array.isArray(req.body.answers) ? req.body.answers : [];
    const answerMap = new Map(answers.map(a => [Number(a.id), a.value]));

    let correctCount = 0;
    revision.questions.forEach((q, idx) => {
      if (answerMap.get(idx) === q.answer) correctCount += 1;
    });

    const percentage = Math.round((correctCount / Math.max(revision.questions.length, 1)) * 100);
    revision.score = correctCount;
    revision.percentage = percentage;
    revision.completed = true;
    revision.completedAt = new Date();

    let creditAwarded = 0;
    if (!revision.creditAwarded) {
      const user = await User.findById(req.auth.sub);
      user.credits.push({
        sourceType: 'daily_revision',
        sourceId: revision._id,
        title: `Daily Revision (${today})`,
        credits: 0.1,
        grade: 'Completed'
      });
      await user.save();
      revision.creditAwarded = true;
      creditAwarded = 0.1;
    }

    await revision.save();

    return res.json({
      message: 'Daily revision completed successfully!',
      score: correctCount,
      total: revision.questions.length,
      percentage,
      creditAwarded,
      completedAt: revision.completedAt
    });
  } catch (error) { next(error); }
});

// GET /api/assessments/analytics/me
router.get('/analytics/me', requireAuth, allowRoles('student'), async (req, res, next) => {
  try {
    const studentId = req.auth.sub;
    const [user, assessments, revisions] = await Promise.all([
      User.findById(studentId),
      Assessment.find({ student: studentId, status: 'completed' }).sort({ completedAt: 1 }).limit(30),
      DailyRevision.find({ student: studentId, completed: true }).sort({ completedAt: 1 }).limit(30)
    ]);

    // Build Growth Velocity Timeline (last 14-30 days)
    const pointsMap = new Map();

    assessments.forEach(a => {
      if (!a.completedAt) return;
      const day = a.completedAt.toISOString().slice(0, 10);
      const avgScore = a.results.length ? Math.round(a.results.reduce((s, r) => s + r.percentage, 0) / a.results.length) : 0;
      pointsMap.set(day, { date: day, assessmentScore: avgScore, revisionScore: pointsMap.get(day)?.revisionScore || 0 });
    });

    revisions.forEach(r => {
      if (!r.completedAt && !r.date) return;
      const day = r.date || r.completedAt.toISOString().slice(0, 10);
      const current = pointsMap.get(day) || { date: day, assessmentScore: 0, revisionScore: 0 };
      current.revisionScore = r.percentage;
      pointsMap.set(day, current);
    });

    const timeline = Array.from(pointsMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    // Skill Matrix — show ALL skills the user has actually been assessed on,
    // plus any from the standard platform list that haven't been assessed yet.
    const allPlatformSkills = ['html', 'css', 'javascript', 'react', 'nodejs', 'python', 'mongodb', 'sql', 'git', 'dsa', 'java', 'cloud', 'os', 'dbms'];
    const userProfileMap = new Map((user.skillProfile || []).map(sp => [sp.skill.toLowerCase(), sp]));

    // Start with all assessed skills (so nothing the user tested is missing)
    const assessedSkillKeys = [...userProfileMap.keys()];
    const allSkillKeys = [...new Set([...assessedSkillKeys, ...allPlatformSkills])];

    const skillMatrix = allSkillKeys
      .filter(skill => {
        // Only include platform skills OR skills the user actually assessed
        return allPlatformSkills.includes(skill) || userProfileMap.has(skill);
      })
      .map(skill => {
        const existing = userProfileMap.get(skill);
        return {
          skill,
          level: existing?.level || 'beginner',
          score: existing?.score || 0,
          assessedAt: existing?.assessedAt || null
        };
      })
      // Put assessed skills first
      .sort((a, b) => (b.assessedAt ? 1 : 0) - (a.assessedAt ? 1 : 0));

    // Credit Breakdown by Source
    const creditBreakdown = {
      assessment: 0,
      course: 0,
      internship: 0,
      daily_revision: 0,
      total: 0
    };

    (user.credits || []).forEach(c => {
      const type = c.sourceType || 'assessment';
      if (creditBreakdown[type] !== undefined) {
        creditBreakdown[type] += c.credits;
      }
      creditBreakdown.total += c.credits;
    });

    return res.json({
      timeline,
      skillMatrix,
      creditBreakdown
    });
  } catch (error) { next(error); }
});

module.exports = router;
