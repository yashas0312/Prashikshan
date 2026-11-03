/**
 * resumeParser.js
 * Extracts text from PDF/DOCX buffers and detects technical skills
 * using a keyword dictionary. No OCR or image processing used.
 */

// Skill keyword dictionary — maps detected keywords to canonical skill names
const SKILL_KEYWORDS = {
  html:               ['html', 'html5'],
  css:                ['css', 'css3', 'sass', 'scss', 'tailwind', 'bootstrap'],
  javascript:         ['javascript', 'js', 'es6', 'es2015', 'ecmascript', 'typescript', 'ts'],
  react:              ['react', 'reactjs', 'react.js', 'jsx', 'redux', 'next.js', 'nextjs'],
  nodejs:             ['node', 'node.js', 'nodejs', 'express', 'expressjs'],
  python:             ['python', 'django', 'flask', 'fastapi', 'pandas', 'numpy', 'scipy'],
  mongodb:            ['mongodb', 'mongo', 'mongoose', 'nosql'],
  sql:                ['sql', 'mysql', 'postgresql', 'postgres', 'sqlite', 'oracle', 'mssql', 'relational database'],
  dsa:                ['dsa', 'data structures', 'algorithms', 'dynamic programming', 'binary tree', 'graph', 'sorting', 'leetcode'],
  java:               ['java', 'spring', 'springboot', 'hibernate', 'maven', 'gradle'],
  git:                ['git', 'github', 'gitlab', 'version control'],
  'machine learning': ['machine learning', 'ml', 'deep learning', 'neural network', 'tensorflow', 'keras', 'pytorch', 'scikit', 'sklearn', 'nlp'],
  'computer networks':['networking', 'tcp/ip', 'http', 'dns', 'osi model', 'computer networks', 'network protocols'],
  os:                 ['operating system', 'linux', 'unix', 'process management', 'memory management', 'os concepts'],
  dbms:               ['dbms', 'database management', 'normalization', 'er diagram', 'transactions', 'acid'],
  cloud:              ['cloud computing', 'aws', 'azure', 'gcp', 'google cloud', 'cloud services', 'iaas', 'paas', 'saas', 'serverless'],
};

// Canonical names that match Assessment page skill list
const CANONICAL_NAMES = {
  html: 'html',
  css: 'css',
  javascript: 'javascript',
  react: 'react',
  nodejs: 'nodejs',
  python: 'python',
  mongodb: 'mongodb',
  sql: 'sql',
  dsa: 'dsa',
  java: 'java',
  git: 'git',
  'machine learning': 'dsa',
  'computer networks': 'dsa',
  os: 'os',
  dbms: 'dbms',
  cloud: 'cloud',
};

/**
 * Extracts only the text within the Skills section of a resume.
 * Recognises headings: "Skills", "Technical Skills", "Skills & Technologies", etc.
 * Returns null if no such section is found.
 */
function extractSkillsSection(text) {
  // Match a skills-section heading on its own line, then capture content
  // until the next section heading (title-case word(s) on a line by themselves) or end of string.
  const pattern = /(?:^|\n)[ \t]*(?:technical\s+skills|skills\s*(?:[&and]+)\s*\w[\w\s]*|skills)[ \t]*\r?\n([\s\S]{1,800}?)(?=\n[ \t]*[A-Z][A-Za-z &]{2,40}[ \t]*\r?\n|\n[ \t]*[A-Z]{2,}[ \t]*\r?\n|$)/i;
  const match = pattern.exec(text);
  return match ? match[1] : null;
}

/**
 * Escapes special regex characters in a string.
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Detects skills from plain text using keyword matching.
 * Only scans the Skills section of the resume if one is found.
 * Returns an empty array if no Skills section is detected.
 */
function detectSkillsFromText(text) {
  const skillsSection = extractSkillsSection(text);

  // No Skills section found — return empty so the student uses manual selection
  if (!skillsSection) return [];

  const lower = skillsSection.toLowerCase();
  const found = new Set();

  for (const [skill, keywords] of Object.entries(SKILL_KEYWORDS)) {
    for (const kw of keywords) {
      const pattern = new RegExp('\\b' + escapeRegex(kw) + '\\b');
      if (pattern.test(lower)) {
        found.add(skill);
        break;
      }
    }
  }

  // Map to canonical assessment skill names and deduplicate
  const canonical = [...found].map(s => CANONICAL_NAMES[s] || s);
  return [...new Set(canonical)];
}

/**
 * Extracts text from a PDF buffer using pdf-parse.
 */
async function extractTextFromPDF(buffer) {
  const pdfParse = require('pdf-parse');
  const data = await pdfParse(buffer);
  return data.text || '';
}

/**
 * Extracts text from a DOCX buffer using mammoth.
 */
async function extractTextFromDOCX(buffer) {
  const mammoth = require('mammoth');
  const result = await mammoth.extractRawText({ buffer });
  return result.value || '';
}

/**
 * Main entry point — accepts a buffer and mimetype, returns detected skills.
 */
async function parseResume(buffer, mimetype) {
  let text = '';

  if (mimetype === 'application/pdf') {
    text = await extractTextFromPDF(buffer);
  } else if (
    mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimetype === 'application/msword'
  ) {
    text = await extractTextFromDOCX(buffer);
  } else {
    throw new Error('Unsupported file type. Please upload a PDF or DOCX file.');
  }

  if (!text.trim()) throw new Error('Could not extract text from the uploaded file.');

  const skills = detectSkillsFromText(text);
  return { skills, textLength: text.length };
}

module.exports = { parseResume, detectSkillsFromText };
