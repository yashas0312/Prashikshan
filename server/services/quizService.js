const path = require('path')
const fs = require('fs')

const questions = JSON.parse(
    fs.readFileSync(path.join(__dirname, '../data/questions.json'), 'utf-8')
)

// Maps frontend skill labels → dataset keys
const SKILL_ALIASES = {
    'node.js': 'Node',
    'nodejs': 'Node',
    'node': 'Node',
    'javascript': 'JavaScript',
    'react': 'React',
    'python': 'Python',
    'html': 'HTML',
    'css': 'CSS',
    'mongodb': 'MongoDB',
    'sql': 'SQL',
    'git': 'Git',
    'dsa': 'DSA',
    'java': 'Java',
    'cloud': 'Cloud',
    'cloud computing': 'Cloud',
    'os': 'OS',
    'operating systems': 'OS',
    'operating system': 'OS',
    'dbms': 'DBMS',
    'database management': 'DBMS',
    'database management systems': 'DBMS',
    'machine learning': 'DSA',   // fallback — no ML key in dataset
    'ui/ux (figma)': 'HTML',     // fallback — no Figma key in dataset
    'figma': 'HTML',
}

function resolveSkillKey(skill) {
    const lower = skill.toLowerCase().trim()
    if (SKILL_ALIASES[lower]) return SKILL_ALIASES[lower]
    // Try direct case-insensitive match against dataset keys
    return Object.keys(questions).find(k => k.toLowerCase() === lower) || null
}

function getRandomQuestions(pool, count) {
    if (!pool || pool.length === 0) return []
    const shuffled = [...pool].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, Math.min(count, shuffled.length))
}

// Shuffle a question's options while keeping the answer string accurate.
// The answer field stores the correct option text, so reordering options
// does not affect grading — the text match still works.
function shuffleOptions(question) {
    const options = [...question.options].sort(() => Math.random() - 0.5)
    return { ...question, options }
}

function getMixedQuiz(skill) {
    const skillKey = resolveSkillKey(skill)
    if (!skillKey || !questions[skillKey]) return []

    const s = questions[skillKey]
    const beginner     = getRandomQuestions(s.beginner     || [], 1)
    const intermediate = getRandomQuestions(s.intermediate || [], 1)
    const advanced     = getRandomQuestions(s.advanced     || [], 1)

    return [...beginner, ...intermediate, ...advanced]
        .sort(() => Math.random() - 0.5)
        .map(shuffleOptions)
}

function getQuiz(skill, level, count = 5) {
    return getMixedQuiz(skill).slice(0, count)
}

module.exports = { getQuiz, getMixedQuiz }
