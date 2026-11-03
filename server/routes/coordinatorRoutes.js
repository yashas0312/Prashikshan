const express = require('express');
const User = require('../models/User');
const Internship = require('../models/Internship');
const Application = require('../models/Application');
const Course = require('../models/Course');
const { requireAuth, allowRoles } = require('../lib/auth');

const router = express.Router();
router.use(requireAuth, allowRoles('coordinator'));

router.get('/overview', async (_req, res, next) => {
  try {
    const [students, partners, courses, pendingInternships, pendingPartners, recentApplications, totalInternships, pendingVerifications] = await Promise.all([
      User.countDocuments({ role: 'student' }),
      User.countDocuments({ role: 'partner' }),
      Course.countDocuments(),
      Internship.find({ status: 'pending' }).populate('postedBy', 'name email organization department employeeId companyEmail jobTitle contactNumber companyAddress isVerifiedPartner isProfileComplete').sort({ createdAt: -1 }).limit(12),
      User.find({ role: 'partner', isVerifiedPartner: false }).select('name email organization department employeeId companyEmail jobTitle contactNumber companyAddress isProfileComplete verificationRequested createdAt').sort({ verificationRequested: -1, createdAt: -1 }).limit(20),
      Application.find().populate('internship', 'title organization').populate('student', 'name email').sort({ updatedAt: -1 }).limit(10),
      Internship.countDocuments(),
      User.countDocuments({ role: 'partner', isVerifiedPartner: false, verificationRequested: true }),
    ]);
    return res.json({
      metrics: { students, partners, courses, totalInternships, pendingInternships: pendingInternships.length, pendingVerifications },
      pendingInternships, pendingPartners, recentApplications,
    });
  } catch (error) { next(error); }
});

router.patch('/partners/:id/verify', async (req, res, next) => {
  try {
    const verified = Boolean(req.body.verified);
    const update = verified
      ? { isVerifiedPartner: true, verificationRequested: false }
      : { isVerifiedPartner: false, verificationRequested: false };
    const partner = await User.findOneAndUpdate({ _id: req.params.id, role: 'partner' }, update, { new: true });
    if (!partner) return res.status(404).json({ error: 'Industry partner not found.' });
    return res.json({ partner });
  } catch (error) { next(error); }
});

router.patch('/internships/:id/review', async (req, res, next) => {
  try {
    const approved = Boolean(req.body.approved);
    const internship = await Internship.findByIdAndUpdate(req.params.id, { status: approved ? 'published' : 'rejected', verified: approved, verificationNote: String(req.body.note || '') }, { new: true });
    if (!internship) return res.status(404).json({ error: 'Internship not found.' });
    return res.json({ internship });
  } catch (error) { next(error); }
});

router.get('/partners/approved', async (_req, res, next) => {
  try {
    const partners = await User.find({ role: 'partner', isVerifiedPartner: true })
      .select('name email organization jobTitle companyEmail createdAt')
      .sort({ createdAt: -1 });
    return res.json({ partners });
  } catch (error) { next(error); }
});

module.exports = router;
