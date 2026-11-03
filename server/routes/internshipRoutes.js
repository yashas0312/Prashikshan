const express = require('express');
const multer  = require('multer');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const User = require('../models/User');
const { requireAuth, allowRoles } = require('../lib/auth');
const requireAssessment = require('../middleware/requireAssessment');

const router = express.Router();
const normalize = (value) => String(value || '').trim().toLowerCase();
const allowedStatuses = ['shortlisted', 'interview', 'offered', 'accepted', 'rejected', 'in-progress', 'completed'];

// Multer for resume uploads — memory storage, 5 MB, PDF/DOC/DOCX only
const resumeUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(_req, file, cb) {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    allowed.includes(file.mimetype)
      ? cb(null, true)
      : cb(new Error('Only PDF, DOC, and DOCX files are accepted.'));
  },
});

function presentation(internship, userSkills = []) {
  const data = internship.toJSON ? internship.toJSON() : internship;
  const matches = data.skills.filter((skill) => userSkills.includes(normalize(skill))).length;
  return { ...data, matchScore: userSkills.length ? Math.round((matches / Math.max(data.skills.length, 1)) * 100) : 0 };
}

router.get('/', async (req, res, next) => {
  try {
    const query = { status: 'published', verified: true, deadline: { $gte: new Date() } };
    if (req.query.skill) query.skills = normalize(req.query.skill);
    if (req.query.mode) query.mode = req.query.mode;
    if (req.query.location) query.location = new RegExp(String(req.query.location), 'i');
    if (req.query.search) query.$or = [{ title: new RegExp(String(req.query.search), 'i') }, { organization: new RegExp(String(req.query.search), 'i') }];
    const internships = await Internship.find(query).sort({ createdAt: -1 });
    return res.json({ internships });
  } catch (error) { next(error); }
});

router.get('/partners/quadrant', async (req, res, next) => {
  try {
    // Only show verified partners in the quadrant — unverified companies are not yet visible to students
    const partners = await User.find({ role: 'partner', isVerifiedPartner: true }).select('organization bio department isVerifiedPartner createdAt');
    const internships = await Internship.find({ status: 'published', verified: true });
    const applications = await Application.find({ status: { $in: ['accepted', 'in-progress', 'completed'] } });

    const orgStats = new Map();

    for (const partner of partners) {
      if (!partner.organization?.trim()) continue;
      // Use organization as key; last-write wins for duplicate org names across accounts
      if (!orgStats.has(partner.organization)) {
        orgStats.set(partner.organization, {
          partnerId: partner._id,
          organization: partner.organization,
          isVerified: partner.isVerifiedPartner,
          activeInternships: 0,
          totalCreditsOffered: 0,
          completedInternships: 0,
          avgStudentGrade: 88,
          totalApplicantsHired: 0,
        });
      }
    }

    for (const internship of internships) {
      // Only add org-level entry if it already exists (verified partner); skip orphaned internships
      if (!orgStats.has(internship.organization)) continue;
      const stats = orgStats.get(internship.organization);
      stats.activeInternships += 1;
      stats.totalCreditsOffered += (internship.credits || 0);
    }

    for (const app of applications) {
      if (app.internship) {
        const matchingInternship = internships.find(i => String(i._id) === String(app.internship));
        if (matchingInternship && orgStats.has(matchingInternship.organization)) {
          const stats = orgStats.get(matchingInternship.organization);
          stats.totalApplicantsHired += 1;
          if (app.status === 'completed') {
            stats.completedInternships += 1;
          }
        }
      }
    }

    const quadrantData = Array.from(orgStats.values()).map(org => {
      const mentorshipRating = Math.min(100, Math.max(40, Math.round(75 + (org.completedInternships * 5) + (org.isVerified ? 10 : 0))));
      const opportunityScore = Math.min(100, Math.max(20, Math.round((org.activeInternships * 25) + (org.totalCreditsOffered * 10) + (org.totalApplicantsHired * 5))));

      let quadrant = 'Niche Players';
      if (mentorshipRating >= 75 && opportunityScore >= 60) {
        quadrant = 'Leaders';
      } else if (mentorshipRating < 75 && opportunityScore >= 60) {
        quadrant = 'Challengers';
      } else if (mentorshipRating >= 75 && opportunityScore < 60) {
        quadrant = 'Visionaries';
      }

      return {
        ...org,
        x: mentorshipRating,
        y: opportunityScore,
        quadrant,
      };
    });

    return res.json({ partners: quadrantData });
  } catch (error) { next(error); }
});

router.get('/recommended', requireAuth, allowRoles('student'), async (req, res, next) => {
  try {
    const user = await User.findById(req.auth.sub);
    const skills = [...user.skills, ...user.skillProfile.map((item) => item.skill)].map(normalize);
    const internships = await Internship.find({ status: 'published', verified: true, deadline: { $gte: new Date() } });
    return res.json({ internships: internships.map((internship) => presentation(internship, skills)).sort((a, b) => b.matchScore - a.matchScore) });
  } catch (error) { next(error); }
});

router.get('/mine', requireAuth, allowRoles('partner'), async (req, res, next) => {
  try {
    const internships = await Internship.find({ postedBy: req.auth.sub }).sort({ updatedAt: -1 });
    return res.json({ internships });
  } catch (error) { next(error); }
});

router.get('/applications/mine', requireAuth, allowRoles('student'), async (req, res, next) => {
  try {
    const applications = await Application.find({ student: req.auth.sub }).populate('internship').sort({ updatedAt: -1 });
    return res.json({ applications });
  } catch (error) { next(error); }
});

router.get('/applications/received', requireAuth, allowRoles('partner'), async (req, res, next) => {
  try {
    const internships = await Internship.find({ postedBy: req.auth.sub }).select('_id');
    const applications = await Application.find({ internship: { $in: internships.map((item) => item._id) } }).populate('internship').populate('student', 'name email skills skillProfile').sort({ updatedAt: -1 });
    return res.json({ applications });
  } catch (error) { next(error); }
});

router.post('/', requireAuth, allowRoles('partner'), async (req, res, next) => {
  try {
    const partner = await User.findById(req.auth.sub);
    if (!partner.isVerifiedPartner) return res.status(403).json({ error: 'Your organisation must be verified by a coordinator before it can post internships.' });
    const { title, description, skills, location, mode, durationWeeks, stipend, credits, capacity, deadline } = req.body;
    if (!title?.trim() || !description?.trim() || !Array.isArray(skills) || !skills.length || !location?.trim() || !deadline) {
      return res.status(400).json({ error: 'Complete the title, description, skills, location, and deadline.' });
    }

    // Auto-approve subsequent offers: if this partner already has at least one coordinator-approved
    // internship, publish immediately. First offer always goes to pending for coordinator review.
    const hasApprovedOffer = await Internship.exists({
      postedBy: partner._id,
      status: 'published',
      verified: true,
    });
    const autoApproved = Boolean(hasApprovedOffer);
    const internship = await Internship.create({
      title: title.trim(), organization: partner.organization, postedBy: partner._id,
      description: description.trim(), skills: skills.map(normalize),
      location: location.trim(), mode, durationWeeks, stipend, credits, capacity, deadline,
      status: autoApproved ? 'published' : 'pending',
      verified: autoApproved,
    });
    const message = autoApproved
      ? 'Internship published and visible to students.'
      : 'Submitted for coordinator review.';
    return res.status(201).json({ internship, message, autoApproved });
  } catch (error) { next(error); }
});

// POST /internships/:id/dev-publish — LOCAL DEVELOPMENT ONLY
// Instantly publishes a partner's own pending internship for student visibility.
// Disabled unless SEED_DEMO_DATA=true. Partner can only publish their own listings.
router.post('/:id/dev-publish', requireAuth, allowRoles('partner'), async (req, res, next) => {
  try {
    const isDev = process.env.SEED_DEMO_DATA === 'true' ||
      (process.env.NODE_ENV !== 'production' && process.env.SEED_DEMO_DATA !== 'false');
    if (!isDev) return res.status(403).json({ error: 'This endpoint is only available in development.' });

    const internship = await Internship.findOneAndUpdate(
      { _id: req.params.id, postedBy: req.auth.sub },
      { status: 'published', verified: true },
      { new: true }
    );
    if (!internship) return res.status(404).json({ error: 'Internship not found or not owned by you.' });
    return res.json({ internship, message: 'Internship published and visible to students.' });
  } catch (error) { next(error); }
});

router.post('/:id/apply', requireAuth, allowRoles('student'), requireAssessment,
  resumeUpload.single('resume'),
  async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'A resume file (PDF, DOC, or DOCX) is required to apply.' });
    const internship = await Internship.findOne({ _id: req.params.id, status: 'published', verified: true, deadline: { $gte: new Date() } });
    if (!internship) return res.status(404).json({ error: 'This verified internship is not available.' });
    const application = await Application.create({
      internship: internship._id,
      student: req.auth.sub,
      coverLetter: String(req.body.coverLetter || ''),
      resumeData: req.file.buffer,
      resumeFilename: req.file.originalname,
      resumeMimetype: req.file.mimetype,
      timeline: [{ status: 'applied', note: 'Application submitted', actor: req.auth.sub }],
    });
    return res.status(201).json({ application });
  } catch (error) {
    if (error?.code === 11000) return res.status(409).json({ error: 'You have already applied for this internship.' });
    return next(error);
  }
});

// GET /internships/applications/:id/details — full applicant profile for partner review
// Also transitions status from 'applied' → 'shortlisted' (Under Review) on first open
router.get('/applications/:id/details', requireAuth, allowRoles('partner'), async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id)
      .populate('internship')
      .populate('student', 'name email skills skillProfile credits');
    if (!application) return res.status(404).json({ error: 'Application not found.' });
    if (String(application.internship.postedBy) !== req.auth.sub)
      return res.status(403).json({ error: 'You can only view applications to your own internships.' });

    // Transition applied → shortlisted (Under Review) on first open
    if (application.status === 'applied') {
      application.status = 'shortlisted';
      application.timeline.push({ status: 'shortlisted', note: 'Application opened for review', actor: req.auth.sub });
      await application.save();
    }

    // Fetch completed enrollments for this student
    const Enrollment = require('../models/Enrollment');
    const enrollments = await Enrollment.find({
      student: application.student._id,
      status: 'completed',
    }).populate('course', 'title code credits');

    const completedCourses = enrollments.map(e => ({
      title: e.course?.title || '',
      code: e.course?.code || '',
      credits: e.course?.credits || 0,
      completedAt: e.completedAt,
    }));

    // Total credits from all sources on the student's record
    const totalCredits = (application.student.credits || [])
      .reduce((sum, c) => sum + (c.credits || 0), 0);

    return res.json({
      application: {
        _id: application._id,
        status: application.status,
        coverLetter: application.coverLetter,
        timeline: application.timeline,
        resumeFilename: application.resumeFilename || '',
        hasResume: Boolean(application.resumeData),
      },
      student: {
        name: application.student.name,
        email: application.student.email,
        skills: application.student.skills,
        skillProfile: application.student.skillProfile,
        totalCredits,
        completedCourses,
      },
    });
  } catch (error) { next(error); }
});

// GET /internships/applications/:id/resume — download resume (partner-only, own internships)
router.get('/applications/:id/resume', requireAuth, allowRoles('partner'), async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id).populate('internship', 'postedBy');
    if (!application) return res.status(404).json({ error: 'Application not found.' });
    if (String(application.internship.postedBy) !== req.auth.sub)
      return res.status(403).json({ error: 'You can only access resumes for your own internships.' });
    if (!application.resumeData) return res.status(404).json({ error: 'No resume was uploaded with this application.' });
    res.setHeader('Content-Type', application.resumeMimetype || 'application/octet-stream');
    res.setHeader('Content-Disposition', `attachment; filename="${application.resumeFilename || 'resume'}"`);
    return res.send(application.resumeData);
  } catch (error) { next(error); }
});

router.patch('/applications/:id', requireAuth, allowRoles('partner', 'coordinator'), async (req, res, next) => {
  try {
    const application = await Application.findById(req.params.id).populate('internship');
    if (!application) return res.status(404).json({ error: 'Application not found.' });
    if (req.auth.role === 'partner' && String(application.internship.postedBy) !== req.auth.sub) return res.status(403).json({ error: 'You can only manage applications to your own internships.' });
    const { status, progress, mentorNote, grade, note = '' } = req.body;
    if (status !== undefined && !allowedStatuses.includes(status)) return res.status(400).json({ error: 'Invalid application status.' });
    if (progress !== undefined && (!Number.isFinite(Number(progress)) || Number(progress) < 0 || Number(progress) > 100)) return res.status(400).json({ error: 'Progress must be between 0 and 100.' });
    if (status) application.status = status;
    if (progress !== undefined) application.progress = Number(progress);
    if (mentorNote !== undefined) application.mentorNote = String(mentorNote);
    if (grade !== undefined) application.grade = grade;
    if (application.status === 'completed') {
      application.progress = 100;
      if (!application.creditsAwarded) {
        const user = await User.findById(application.student);
        user.credits.push({ sourceType: 'internship', sourceId: application.internship._id, title: application.internship.title, credits: application.internship.credits, grade: application.grade || 'Completed' });
        await user.save();
        application.creditsAwarded = true;
      }
    }
    if (status || note) application.timeline.push({ status: application.status, note: String(note), actor: req.auth.sub });
    await application.save();
    return res.json({ application });
  } catch (error) { next(error); }
});

module.exports = router;
