'use strict';
const mongoose = require('mongoose');

// Each video module embedded directly in the course document.
// videoId is the YouTube 11-char ID; durationSeconds is used by the
// track-video endpoint to validate 90%-completion claims.
const videoSchema = new mongoose.Schema({
  id:              { type: Number, required: true },
  title:           { type: String, required: true, trim: true },
  videoId:         { type: String, required: true, trim: true },
  channel:         { type: String, default: '' },
  duration:        { type: String, default: '' },           // human label "2h 04m"
  durationSeconds: { type: Number, default: 0 },           // used for 90% check
  topic:           { type: String, default: '' },
}, { _id: false });

const courseSchema = new mongoose.Schema({
  code:     { type: String, required: true, unique: true, trim: true, uppercase: true },
  title:    { type: String, required: true, trim: true },
  summary:  { type: String, required: true, maxlength: 800 },
  skills:   { type: [String], required: true },
  // 'advanced' kept for backward-compat with existing seed data; 'legend' maps to capstone-tier
  level:    { type: String, enum: ['beginner', 'intermediate', 'advanced', 'legend'], default: 'beginner' },
  hours:    { type: Number, min: 1, required: true },
  credits:  { type: Number, min: 1, max: 12, required: true },
  provider: { type: String, default: 'Prashikshan Learning Hub' },
  courseUrl: { type: String, default: '' },
  modules:  { type: [String], default: [] },          // legacy text list kept for compat
  videos:   { type: [videoSchema], default: [] },     // NEW: structured video library
  published:{ type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('Course', courseSchema);
