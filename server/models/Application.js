const mongoose = require('mongoose');

const timelineSchema = new mongoose.Schema({
  status: { type: String, required: true },
  note: { type: String, trim: true, maxlength: 1000, default: '' },
  actor: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  at: { type: Date, default: Date.now },
}, { _id: false });

const applicationSchema = new mongoose.Schema({
  internship: { type: mongoose.Schema.Types.ObjectId, ref: 'Internship', required: true },
  student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  coverLetter: { type: String, trim: true, maxlength: 1800, default: '' },
  resumeData: { type: Buffer, default: null },
  resumeFilename: { type: String, default: '' },
  resumeMimetype: { type: String, default: '' },
  status: { type: String, enum: ['applied', 'shortlisted', 'interview', 'offered', 'accepted', 'rejected', 'in-progress', 'completed'], default: 'applied' },
  progress: { type: Number, min: 0, max: 100, default: 0 },
  mentorNote: { type: String, trim: true, maxlength: 1000, default: '' },
  grade: { type: String, enum: ['', 'A+', 'A', 'B+', 'B', 'C', 'Incomplete'], default: '' },
  creditsAwarded: { type: Boolean, default: false },
  timeline: { type: [timelineSchema], default: [] },
}, { timestamps: true });

applicationSchema.index({ internship: 1, student: 1 }, { unique: true });
module.exports = mongoose.model('Application', applicationSchema);
