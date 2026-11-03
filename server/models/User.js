const mongoose = require('mongoose');

const skillProfileSchema = new mongoose.Schema({
  skill: { type: String, required: true, trim: true, lowercase: true },
  level: { type: String, enum: ['beginner', 'intermediate', 'legend'], default: 'beginner' },
  score: { type: Number, min: 0, max: 100, default: 0 },
  assessedAt: { type: Date, default: Date.now },
}, { _id: false });

const creditRecordSchema = new mongoose.Schema({
  sourceType: { type: String, enum: ['assessment', 'course', 'internship', 'daily_revision'], required: true },
  sourceId: { type: mongoose.Schema.Types.ObjectId, required: true },
  title: { type: String, required: true },
  credits: { type: Number, required: true, min: 0 },
  grade: { type: String, default: 'Completed' },
  awardedAt: { type: Date, default: Date.now },
}, { _id: false });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 100 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true, select: false },
  role: { type: String, enum: ['student', 'partner', 'coordinator'], default: 'student', required: true },
  organization: { type: String, trim: true, maxlength: 120, default: '' },
  department: { type: String, trim: true, maxlength: 120, default: '' },
  bio: { type: String, trim: true, maxlength: 600, default: '' },
  skills: { type: [String], default: [] },
  interests: { type: [String], default: [] },
  skillProfile: { type: [skillProfileSchema], default: [] },
  credits: { type: [creditRecordSchema], default: [] },
  isAssessed: { type: Boolean, default: false },
  isVerifiedPartner: { type: Boolean, default: false },
  verificationRequested: { type: Boolean, default: false },
  // Partner-specific profile fields (collected on first login)
  employeeId:     { type: String, trim: true, default: '' },
  companyEmail:   { type: String, trim: true, lowercase: true, default: '' },
  jobTitle:       { type: String, trim: true, default: '' },
  contactNumber:  { type: String, trim: true, default: '' },
  companyAddress: { type: String, trim: true, default: '' },
  isProfileComplete: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
}, { timestamps: true });

userSchema.set('toJSON', {
  transform: (_doc, ret) => {
    delete ret.passwordHash;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model('User', userSchema);
