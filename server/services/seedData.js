'use strict';

const Course     = require('../models/Course');
const Internship = require('../models/Internship');
const { CURATED_LIBRARY } = require('./youtubeService');

// Helper: look up videos from the curated library for a course code
const vids = (code) => (CURATED_LIBRARY[code] || []).map(v => ({
  id: v.id, title: v.title, videoId: v.videoId,
  channel: v.channel, duration: v.duration,
  durationSeconds: v.durationSeconds || 0,
  topic: v.topic,
}));

// ─── Original 9 courses ──────────────────────────────────────────────────────
const ORIGINAL_COURSES = [
  { code:'WEB-101',  title:'Modern Web Foundations',                      summary:'Build semantic, accessible web interfaces with HTML, CSS, and Git.',                                              skills:['html','css','git'],                    level:'beginner',     hours:24,  credits:2, modules:['Semantic HTML','Responsive CSS','Version control'] },
  { code:'JS-201',   title:'JavaScript for Product Teams',                 summary:'Move from fundamentals to asynchronous JavaScript, APIs, and practical problem solving.',                        skills:['javascript','git'],                    level:'intermediate', hours:36,  credits:3, modules:['ES modules','Async data','Testing fundamentals'] },
  { code:'REACT-301',title:'React Application Studio',                     summary:'Plan, build, and ship a production-quality React application.',                                                   skills:['react','javascript'],                  level:'advanced',     hours:42,  credits:4, modules:['State design','Routing','Performance'] },
  { code:'DATA-210', title:'Python and SQL for Data',                      summary:'Use Python and SQL to clean, analyse, and communicate data responsibly.',                                         skills:['python','sql'],                        level:'intermediate', hours:40,  credits:4, modules:['Data wrangling','SQL queries','Visual insights'] },
  { code:'BACK-220', title:'Backend Systems Essentials',                   summary:'Create dependable APIs and data models with Node.js and MongoDB.',                                                skills:['nodejs','mongodb'],                    level:'intermediate', hours:38,  credits:4, modules:['REST design','Data modelling','Security'] },
  { code:'AI-315',   title:'Applied Machine Learning',                     summary:'Develop a grounded ML workflow from data preparation to model evaluation.',                                       skills:['python','ml'],                         level:'advanced',     hours:48,  credits:4, modules:['Feature design','Model evaluation','Responsible AI'] },
  { code:'SYS-401',  title:'Distributed Systems Architecture',             summary:'Design fault-tolerant, horizontally scalable distributed systems with practical case studies from industry.',    skills:['nodejs','mongodb','javascript'],        level:'advanced',     hours:60,  credits:6, modules:['CAP theorem','Event sourcing','Microservices patterns','Load balancing'] },
  { code:'MLOPS-420',title:'ML Systems in Production',                     summary:'Bridge the gap between model training and production ML pipelines: serving, monitoring, and retraining loops.',  skills:['python','ml','git'],                   level:'advanced',     hours:56,  credits:6, modules:['Model registry','Feature stores','Drift detection','CI/CD for ML'] },
  { code:'REACT-402',title:'Advanced React Patterns & Performance',        summary:'Master compound components, render optimization, concurrent features, and architecture at scale.',               skills:['react','javascript'],                  level:'advanced',     hours:40,  credits:5, modules:['Advanced hooks','Concurrent rendering','Code splitting','Testing at scale'] },
];

// ─── 20 new domain courses ───────────────────────────────────────────────────
const NEW_COURSES = [
  { code:'DSA-110',   title:'Data Structures & Algorithms',               summary:'Master arrays, trees, graphs, sorting, searching, and dynamic programming with real interview problems.',          skills:['dsa','javascript','python'],           level:'intermediate', hours:40,  credits:4, modules:['Arrays & Linked Lists','Stacks & Queues','Trees & Graphs','Dynamic Programming','Sorting & Searching','Greedy & Backtracking','Interview Patterns'] },
  { code:'CPP-120',   title:'Programming Fundamentals (C++/Java/Python)',  summary:'Build strong programming foundations across three major languages — syntax, logic, and memory management.',       skills:['java','javascript','python','dsa'],    level:'beginner',     hours:32,  credits:3, modules:['C++ Basics','Java Basics','Python Basics','OOP Concepts','Memory Management','Standard Libraries','Mini Projects'] },
  { code:'PS-130',    title:'Problem Solving & Competitive Programming',   summary:'Develop systematic problem-solving skills using algorithmic patterns favoured in technical interviews.',          skills:['dsa','python','javascript'],           level:'intermediate', hours:30,  credits:3, modules:['Problem Decomposition','Two Pointers','Sliding Window','Recursion','Greedy','Backtracking','Contest Practice'] },
  { code:'OOP-140',   title:'Object-Oriented Programming Mastery',         summary:'Deep-dive into OOP principles — encapsulation, inheritance, polymorphism — and design patterns.',                skills:['python','javascript'],                 level:'intermediate', hours:28,  credits:3, modules:['4 Pillars of OOP','SOLID Principles','Design Patterns','UML Diagrams','Dependency Injection','Clean Code','OOP Projects'] },
  { code:'SQL-150',   title:'SQL & Relational Databases',                  summary:'Write professional SQL — joins, aggregations, window functions, indexes, and transactions — on real datasets.',   skills:['sql','mongodb'],                       level:'intermediate', hours:36,  credits:3, modules:['SQL Basics','Joins & Subqueries','Window Functions','Normalization','Transactions & ACID','Indexing','PostgreSQL Practice'] },
  { code:'DBMS-160',  title:'Database Management Systems',                 summary:'Understand DBMS internals — ER modelling, relational algebra, B+ trees, concurrency control, and recovery.',      skills:['dbms','sql','mongodb'],                level:'intermediate', hours:40,  credits:4, modules:['DBMS Theory','ER Modelling','Relational Algebra','B+ Trees & Indexing','Concurrency Control','Deadlock & Recovery','NoSQL vs RDBMS'] },
  { code:'OS-170',    title:'Operating Systems Fundamentals',              summary:'Processes, threads, memory management, file systems, CPU scheduling, and deadlock — from theory to implementation.', skills:['os','dsa','python'],                   level:'intermediate', hours:44,  credits:4, modules:['Processes & Threads','CPU Scheduling','Memory Management','Virtual Memory','File Systems','Deadlock','OS Security'] },
  { code:'CN-180',    title:'Computer Networks',                           summary:'Build end-to-end understanding of networking — OSI model, TCP/IP, DNS, subnetting, and network security.',        skills:['nodejs','html'],                       level:'intermediate', hours:38,  credits:4, modules:['Network Models','IP & Subnetting','TCP vs UDP','DNS & HTTP','Network Security','Routing Protocols','Wireshark Lab'] },
  { code:'WEBDEV-190',title:'Full-Stack Web Development',                  summary:'End-to-end web development from static pages to full MERN applications — the complete practical pathway.',         skills:['html','css','javascript','react','nodejs','mongodb'],level:'beginner',hours:72, credits:6, modules:['HTML & CSS','JavaScript','React','Node & Express','MongoDB','MERN Project','Deployment'] },
  { code:'API-200',   title:'REST APIs & Backend Integration',             summary:'Design, build, test, and document REST APIs with authentication, versioning, and third-party integration.',         skills:['nodejs','javascript'],                 level:'intermediate', hours:34,  credits:3, modules:['REST Principles','API Design','JWT Auth','Testing APIs','GraphQL Intro','API Documentation','Deployment'] },
  { code:'GIT-205',   title:'Git & GitHub Professional Workflow',          summary:'Move beyond basic commits — branching strategies, rebasing, GitHub Actions CI/CD, and open-source contribution.', skills:['git','javascript'],                    level:'beginner',     hours:20,  credits:2, modules:['Git Basics','Branching & Merging','Rebase & Cherry-pick','GitHub Actions','Advanced Git','Commit Conventions','PR Workflow'] },
  { code:'TEST-215',  title:'Software Testing & QA',                       summary:'Unit, integration, and end-to-end testing with TDD, Jest, Cypress, and the ISTQB testing framework.',              skills:['javascript','python'],                 level:'intermediate', hours:32,  credits:3, modules:['Testing Fundamentals','Unit Testing','TDD','Jest & JS Testing','E2E with Cypress','API Testing','ISTQB Strategy'] },
  { code:'CLOUD-225', title:'Cloud Computing Essentials',                  summary:'AWS, GCP, and Azure fundamentals — compute, storage, serverless, IAC with Terraform, and cloud security.',         skills:['cloud','nodejs','python'],             level:'intermediate', hours:48,  credits:4, modules:['Cloud Fundamentals','AWS Essentials','GCP Overview','Azure Basics','Serverless','Terraform & IAC','Cloud Security'] },
  { code:'DOCKER-230',title:'Docker & Kubernetes (DevOps)',                summary:'Containerise applications with Docker, orchestrate them with Kubernetes, and wire up CI/CD pipelines.',            skills:['nodejs','git'],                        level:'advanced',     hours:44,  credits:4, modules:['Docker Basics','Docker Compose','Kubernetes Intro','Container Networking','Security','CI/CD Pipeline','Full DevOps Project'] },
  { code:'SEC-240',   title:'Cybersecurity & Ethical Hacking',             summary:'Learn to think like an attacker — network security, OWASP Top 10, cryptography, pen testing, and forensics.',     skills:['nodejs','python'],                     level:'advanced',     hours:52,  credits:5, modules:['Security Fundamentals','Ethical Hacking','Network Security','OWASP & Web Security','Cryptography','Linux & Pen Testing','Digital Forensics'] },
  { code:'SD-250',    title:'System Design',                               summary:'Design scalable, fault-tolerant systems — load balancing, caching, sharding, microservices, and real case studies.', skills:['nodejs','mongodb','javascript'],      level:'advanced',     hours:36,  credits:4, modules:['System Design Fundamentals','Scalability Patterns','URL Shortener','CAP Theorem','DB Sharding','Load Balancing','Microservices vs Monolith'] },
  { code:'AGILE-260', title:'SDLC, Agile & Scrum',                         summary:'Software development lifecycle models, Agile methodology, Scrum ceremonies, Kanban, and modern CI/CD workflows.',  skills:['git'],                                 level:'beginner',     hours:24,  credits:2, modules:['SDLC Models','Agile Fundamentals','Scrum Framework','Kanban','Git in Agile','CI/CD Integration','Sprint Planning'] },
  { code:'DEBUG-270', title:'Debugging & Developer Tooling',               summary:'From reading stack traces to using browser DevTools, VS Code debugger, GDB, and structured logging strategies.',  skills:['javascript','python'],                 level:'beginner',     hours:20,  credits:2, modules:['Debugging Fundamentals','Browser DevTools','VS Code Debugger','GDB for C/C++','Python pdb','Stack Traces','Logging & Monitoring'] },
  { code:'COMM-280',  title:'Communication & Interview Skills',             summary:'Ace technical interviews — STAR method, system design walkthroughs, resume crafting, and LinkedIn optimisation.',  skills:['dsa','javascript'],                   level:'beginner',     hours:24,  credits:2, modules:['Interview Prep','Self Introduction','Behavioural Questions','Technical Q&A','Resume Building','LinkedIn Profile','System Design Interviews'] },
];

// Attach videos from the curated library to every course
const ALL_COURSES = [...ORIGINAL_COURSES, ...NEW_COURSES].map(c => ({
  ...c,
  videos: vids(c.code),
}));

// ─── Demo internships ─────────────────────────────────────────────────────────
const DEMO_INTERNSHIPS = [
  { title:'Frontend Engineering Internship',        organization:'TechCorp India',      description:'Contribute to accessible product interfaces with regular mentor feedback and weekly milestones.',                                                                     skills:['react','javascript','css'], location:'Remote',     mode:'remote', durationWeeks:12, stipend:12000, credits:4, capacity:4, status:'published', verified:true },
  { title:'Data Analytics Internship',              organization:'InnoLabs Global',     description:'Support a data team with analysis notebooks, dashboards, and clear documentation.',                                                                                   skills:['python','sql'],             location:'Bengaluru',  mode:'hybrid', durationWeeks:16, stipend:15000, credits:6, capacity:3, status:'published', verified:true },
  { title:'Backend API Internship',                 organization:'ScaleShift Systems',  description:'Design and improve API services with practical reviews from an engineering mentor.',                                                                                  skills:['nodejs','mongodb','git'],   location:'Remote',     mode:'remote', durationWeeks:12, stipend:14000, credits:4, capacity:2, status:'published', verified:true },
  { title:'ML Engineering Internship',              organization:'InnoLabs Global',     description:'Build and deploy production ML pipelines under senior engineer mentorship. Expected to own feature design and model evaluation independently.',                       skills:['python','ml','git'],        location:'Remote',     mode:'remote', durationWeeks:20, stipend:20000, credits:8, capacity:2, status:'published', verified:true },
  { title:'Full-Stack Architecture Internship',     organization:'ByteCraft Solutions', description:'End-to-end ownership of a product feature — from database schema through REST API to React UI. High-autonomy, mentor-supervised.',                                   skills:['react','nodejs','mongodb','javascript'], location:'Hyderabad', mode:'hybrid', durationWeeks:16, stipend:18000, credits:8, capacity:2, status:'published', verified:true },
  { title:'Cybersecurity Analyst Internship',       organization:'TechCorp India',      description:'Assist in vulnerability assessments, OWASP audits, and network monitoring under a certified security engineer.',                                                     skills:['nodejs','python'],          location:'Remote',     mode:'remote', durationWeeks:12, stipend:16000, credits:5, capacity:2, status:'published', verified:true },
  { title:'Cloud Infrastructure Internship',        organization:'ScaleShift Systems',  description:'Provision and manage AWS/GCP resources using Terraform, set up monitoring, and implement cost-optimisation strategies.',                                             skills:['nodejs','python','git'],    location:'Remote',     mode:'remote', durationWeeks:16, stipend:17000, credits:6, capacity:2, status:'published', verified:true },
  { title:'DevOps & Platform Engineering Internship',organization:'ByteCraft Solutions',description:'Build and maintain CI/CD pipelines with Docker and Kubernetes, instrument observability dashboards, and own the deployment runbook.',                                 skills:['nodejs','git','mongodb'],   location:'Hyderabad',  mode:'hybrid', durationWeeks:14, stipend:19000, credits:6, capacity:2, status:'published', verified:true },
  { title:'QA Automation Internship',               organization:'TechCorp India',      description:'Design and execute automated test suites using Jest and Cypress, triage bugs with the engineering team, and contribute to the CI quality gate.',                     skills:['javascript','git'],         location:'Remote',     mode:'remote', durationWeeks:12, stipend:13000, credits:4, capacity:3, status:'published', verified:true },
  { title:'UI/UX Design & Frontend Internship',     organization:'InnoLabs Global',     description:'Collaborate with designers and engineers to translate Figma mockups into accessible, responsive React components with a focus on user experience.',                  skills:['react','css','html'],       location:'Bengaluru',  mode:'hybrid', durationWeeks:14, stipend:14000, credits:5, capacity:2, status:'published', verified:true },
  { title:'Java Backend Engineering Internship',    organization:'ScaleShift Systems',  description:'Develop and maintain Spring Boot microservices, write unit and integration tests, and participate in code reviews under senior Java engineering mentorship.',         skills:['java','sql','git'],         location:'Remote',     mode:'remote', durationWeeks:16, stipend:16000, credits:6, capacity:2, status:'published', verified:true },
  { title:'Database & DBMS Internship',             organization:'ByteCraft Solutions', description:'Work alongside the data engineering team to optimise relational schemas, write complex SQL queries, and analyse DBMS performance metrics on live datasets.',           skills:['dbms','sql','mongodb'],     location:'Hyderabad',  mode:'onsite', durationWeeks:12, stipend:13500, credits:4, capacity:2, status:'published', verified:true },
];

async function seedIfEnabled() {
  const enabled =
    process.env.SEED_DEMO_DATA === 'true' ||
    (process.env.NODE_ENV !== 'production' && process.env.SEED_DEMO_DATA !== 'false');
  if (!enabled) return;

  if (await Course.countDocuments() === 0) {
    await Course.insertMany(ALL_COURSES);
    console.log(`[Seed] Inserted ${ALL_COURSES.length} courses.`);
  } else {
    // Migration: patch existing courses with updated skill tags and video data
    // so new skills (java, cloud, os, dbms) map correctly to courses.
    for (const courseDef of ALL_COURSES) {
      await Course.updateOne(
        { code: courseDef.code },
        { $set: { skills: courseDef.skills, videos: courseDef.videos } }
      );
    }
    console.log(`[Seed] Patched skills & videos for ${ALL_COURSES.length} courses.`);
  }

  if (await Internship.countDocuments() === 0) {
    const deadline = new Date(Date.now() + 1000 * 60 * 60 * 24 * 45);
    await Internship.insertMany(DEMO_INTERNSHIPS.map(i => ({ ...i, deadline })));
    console.log(`[Seed] Inserted ${DEMO_INTERNSHIPS.length} demo internships.`);
  } else {
    // Migration: insert any new internships not yet in the DB (matched by title)
    const deadline = new Date(Date.now() + 1000 * 60 * 60 * 24 * 45);
    const existingTitles = new Set(
      (await Internship.find().select('title')).map(i => i.title)
    );
    const toInsert = DEMO_INTERNSHIPS.filter(i => !existingTitles.has(i.title));
    if (toInsert.length) {
      await Internship.insertMany(toInsert.map(i => ({ ...i, deadline })));
      console.log(`[Seed] Inserted ${toInsert.length} new internships.`);
    }
  }
}

module.exports = { seedIfEnabled };
