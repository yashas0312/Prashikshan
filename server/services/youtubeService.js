'use strict';

/**
 * Curated YouTube video library for ALL Prashikshan seeded courses.
 *
 * Each entry maps a course CODE → 7 hand-picked modules.
 * Every object also carries durationSeconds so the backend track-video
 * endpoint can validate 90%-completion claims without a YouTube API call.
 *
 * Sources: freeCodeCamp, Traversy Media, The Net Ninja, Corey Schafer,
 * Academind, CS Dojo, Abdul Bari, Jenny's Lectures, Neso Academy, and
 * similar authoritative edu-channels. IDs are stable long-form tutorials.
 */

const CURATED_LIBRARY = {

  // ══════════════════════════════════════════════════════════════════════
  //  ORIGINAL 9 COURSES
  // ══════════════════════════════════════════════════════════════════════

  'WEB-101': [
    { id:1, title:'HTML Full Course – Build a Website Tutorial',           videoId:'pQN-pnXPaVg', channel:'freeCodeCamp',        duration:'2h 02m', durationSeconds:7320,  topic:'HTML Fundamentals' },
    { id:2, title:'Semantic HTML5 Elements Explained',                      videoId:'kX3TfdUqpuU', channel:'freeCodeCamp',        duration:'48m',    durationSeconds:2880,  topic:'Semantic Markup' },
    { id:3, title:'CSS Tutorial – Zero to Hero (Full Course)',              videoId:'OXGznpKZ_sA', channel:'freeCodeCamp',        duration:'6h 18m', durationSeconds:22680, topic:'CSS Essentials' },
    { id:4, title:'CSS Flexbox Crash Course',                               videoId:'3YW65K6LcIA', channel:'Traversy Media',      duration:'40m',    durationSeconds:2400,  topic:'Flexbox & Layout' },
    { id:5, title:'CSS Grid Crash Course',                                  videoId:'EFafSYg-PkI', channel:'Traversy Media',      duration:'45m',    durationSeconds:2700,  topic:'CSS Grid' },
    { id:6, title:'Git and GitHub for Beginners – Crash Course',            videoId:'RGOj5yH7evk', channel:'freeCodeCamp',        duration:'1h 08m', durationSeconds:4080,  topic:'Git Version Control' },
    { id:7, title:'Responsive Web Design Full Course',                      videoId:'srvUrASNj0s', channel:'freeCodeCamp',        duration:'4h 03m', durationSeconds:14580, topic:'Responsive Design' },
  ],

  'JS-201': [
    { id:1, title:'JavaScript Full Course for Beginners',                   videoId:'PkZNo7MFNFg', channel:'freeCodeCamp',        duration:'3h 26m', durationSeconds:12360, topic:'JS Fundamentals' },
    { id:2, title:'JavaScript ES6 Modules',                                 videoId:'cRHQNNkYi1A', channel:'Academind',           duration:'36m',    durationSeconds:2160,  topic:'ES Modules' },
    { id:3, title:'Async JavaScript – Callbacks, Promises, Async/Await',    videoId:'PoRJizFvM7s', channel:'Traversy Media',      duration:'36m',    durationSeconds:2160,  topic:'Async & Promises' },
    { id:4, title:'JavaScript Fetch API and Async/Await',                   videoId:'cuEtnrL9-H0', channel:'The Net Ninja',       duration:'25m',    durationSeconds:1500,  topic:'Fetch API' },
    { id:5, title:'JavaScript DOM Crash Course – Part 1',                   videoId:'0ik6X4DJKCc', channel:'Traversy Media',      duration:'45m',    durationSeconds:2700,  topic:'DOM Manipulation' },
    { id:6, title:'JavaScript Unit Testing – The Practical Guide',          videoId:'r9HdJ8P6GQI', channel:'Academind',           duration:'2h 20m', durationSeconds:8400,  topic:'Testing Fundamentals' },
    { id:7, title:'Git and GitHub for Beginners – Crash Course',            videoId:'RGOj5yH7evk', channel:'freeCodeCamp',        duration:'1h 08m', durationSeconds:4080,  topic:'Git & Collaboration' },
  ],

  'REACT-301': [
    { id:1, title:"React Course – Beginner's Tutorial (4 Hours)",           videoId:'bMknfKXIFA8', channel:'freeCodeCamp',        duration:'4h 01m', durationSeconds:14460, topic:'React Fundamentals' },
    { id:2, title:'React State Management – useState & useReducer',         videoId:'RZPAQV7JvNU', channel:'Academind',           duration:'1h 04m', durationSeconds:3840,  topic:'State Design' },
    { id:3, title:'React Router v6 – Complete Tutorial',                    videoId:'Ul3y1LXxzdU', channel:'The Net Ninja',       duration:'1h 09m', durationSeconds:4140,  topic:'Routing' },
    { id:4, title:'React Context & Hooks Tutorial',                         videoId:'CGRpfIUqqAg', channel:'The Net Ninja',       duration:'52m',    durationSeconds:3120,  topic:'Context API & Hooks' },
    { id:5, title:'React Performance Optimization',                         videoId:'RcbmNMJNRyA', channel:'Academind',           duration:'48m',    durationSeconds:2880,  topic:'Performance' },
    { id:6, title:'React Custom Hooks – Full Playlist',                     videoId:'J-g9ZJha8FE', channel:'The Net Ninja',       duration:'35m',    durationSeconds:2100,  topic:'Custom Hooks' },
    { id:7, title:'Build a React Project – Full App Walkthrough',           videoId:'a_7Z7C_JCyo', channel:'freeCodeCamp',        duration:'1h 40m', durationSeconds:6000,  topic:'Capstone Project' },
  ],

  'DATA-210': [
    { id:1, title:'Python for Beginners – Full Course',                     videoId:'_uQrJ0TkZlc', channel:'Programming w/ Mosh', duration:'6h 14m', durationSeconds:22440, topic:'Python Fundamentals' },
    { id:2, title:'Pandas & Python for Data Analysis by Example',           videoId:'vmEHCJofslg', channel:'freeCodeCamp',        duration:'4h 20m', durationSeconds:15600, topic:'Pandas & Data Wrangling' },
    { id:3, title:'SQL Tutorial – Full Database Course for Beginners',       videoId:'HXV3zeQKqGY', channel:'freeCodeCamp',        duration:'4h 20m', durationSeconds:15600, topic:'SQL Fundamentals' },
    { id:4, title:'Advanced SQL Tutorial – Joins, Subqueries & Window Fns', videoId:'NrBJmtD0kEw', channel:'Alex The Analyst',    duration:'1h 10m', durationSeconds:4200,  topic:'SQL Joins & Queries' },
    { id:5, title:'Matplotlib Crash Course',                                 videoId:'3Xc3CA655Y4', channel:'freeCodeCamp',        duration:'1h 00m', durationSeconds:3600,  topic:'Visual Insights' },
    { id:6, title:'Data Analysis with Python – Full Course',                 videoId:'r-uOLxNrNk8', channel:'freeCodeCamp',        duration:'4h 02m', durationSeconds:14520, topic:'End-to-End Analysis' },
    { id:7, title:'Python – File Objects',                                   videoId:'Uh2ebFW8OYM', channel:'Corey Schafer',       duration:'30m',    durationSeconds:1800,  topic:'Data I/O & CSV' },
  ],

  'BACK-220': [
    { id:1, title:'Node.js Crash Course',                                   videoId:'fBNz5xF-Kx4', channel:'Traversy Media',      duration:'1h 30m', durationSeconds:5400,  topic:'Node.js Foundations' },
    { id:2, title:'Express JS Crash Course',                                videoId:'L72fhGm1tfE', channel:'Traversy Media',      duration:'55m',    durationSeconds:3300,  topic:'REST API Design' },
    { id:3, title:'MongoDB Crash Course',                                   videoId:'pWbMFrVA3mc', channel:'Traversy Media',      duration:'1h 10m', durationSeconds:4200,  topic:'Data Modelling' },
    { id:4, title:'Mongoose Crash Course – with Node & Express',            videoId:'DZBGEVgL2eM', channel:'Traversy Media',      duration:'45m',    durationSeconds:2700,  topic:'Mongoose & ODM' },
    { id:5, title:'Node.js API Authentication with JWT',                    videoId:'mbsmsi7l3r4', channel:'Traversy Media',      duration:'1h 00m', durationSeconds:3600,  topic:'Security & Auth' },
    { id:6, title:'REST API Design Best Practices',                         videoId:'_7UQPve99r4', channel:'Web Dev Simplified',  duration:'20m',    durationSeconds:1200,  topic:'API Standards' },
    { id:7, title:'Node.js Full Course for Beginners',                      videoId:'qwfE7fSVaZM', channel:'freeCodeCamp',        duration:'8h 16m', durationSeconds:29760, topic:'Node.js Deep Dive' },
  ],

  'AI-315': [
    { id:1, title:'Machine Learning with Python – Full Course',             videoId:'i_LwzRVP7bg', channel:'freeCodeCamp',        duration:'9h 59m', durationSeconds:35940, topic:'ML Foundations' },
    { id:2, title:'Scikit-Learn Crash Course',                              videoId:'pqNCD_5r0IU', channel:'freeCodeCamp',        duration:'2h 09m', durationSeconds:7740,  topic:'Feature Design & Sklearn' },
    { id:3, title:'Random Forest Algorithm Explained',                      videoId:'J4Wdy0Wc_xQ', channel:'StatQuest',           duration:'17m',    durationSeconds:1020,  topic:'Model Selection' },
    { id:4, title:'Machine Learning – Model Evaluation Metrics',            videoId:'LbX4X71-TFI', channel:'Krish Naik',          duration:'45m',    durationSeconds:2700,  topic:'Model Evaluation' },
    { id:5, title:'Responsible AI & Bias in ML',                            videoId:'UG_X_7g63rY', channel:'Google Developers',   duration:'35m',    durationSeconds:2100,  topic:'Responsible AI' },
    { id:6, title:'Data Preprocessing for ML in Python',                    videoId:'ZoXI_RXE260', channel:'Krish Naik',          duration:'1h 00m', durationSeconds:3600,  topic:'Data Preprocessing' },
    { id:7, title:'Deploy ML Models with Flask',                            videoId:'UbCWoMf80PY', channel:'Krish Naik',          duration:'55m',    durationSeconds:3300,  topic:'ML Deployment' },
  ],

  'SYS-401': [
    { id:1, title:'Distributed Systems in One Lesson',                      videoId:'Y6Ev8GIlbxc', channel:'InfoQ',               duration:'45m',    durationSeconds:2700,  topic:'CAP Theorem & Basics' },
    { id:2, title:'Event-Driven Architecture & Event Sourcing',             videoId:'STKCRSUsyP0', channel:'GOTO Conferences',     duration:'50m',    durationSeconds:3000,  topic:'Event Sourcing' },
    { id:3, title:'Microservices Explained – The What, Why and How',        videoId:'rv4LlmLmVWk', channel:'TechWorld with Nana',  duration:'27m',    durationSeconds:1620,  topic:'Microservices Patterns' },
    { id:4, title:'Load Balancing Algorithms Explained',                    videoId:'dVEjSmKFUVI', channel:'ByteByteGo',           duration:'12m',    durationSeconds:720,   topic:'Load Balancing' },
    { id:5, title:'System Design Interview – Distributed Cache',            videoId:'iuqZvajTOyA', channel:'Gaurav Sen',           duration:'22m',    durationSeconds:1320,  topic:'Caching Strategies' },
    { id:6, title:'Kafka Crash Course for Beginners',                       videoId:'R873BlNVUqQ', channel:'Amigoscode',           duration:'1h 12m', durationSeconds:4320,  topic:'Message Queues' },
    { id:7, title:'Docker and Kubernetes – Full Course',                    videoId:'Wf2eSG3owoA', channel:'freeCodeCamp',         duration:'4h 20m', durationSeconds:15600, topic:'Containerisation' },
  ],

  'MLOPS-420': [
    { id:1, title:'MLOps Course – Production-Grade ML Projects',            videoId:'h9s0geP6mbY', channel:'freeCodeCamp',        duration:'10h 10m',durationSeconds:36600, topic:'MLOps Foundations' },
    { id:2, title:'ML Model Monitoring & Drift Detection',                  videoId:'l7IbU6mFtNk', channel:'Evidently AI',         duration:'35m',    durationSeconds:2100,  topic:'Drift Detection' },
    { id:3, title:'Feature Store Explained',                                videoId:'eMWepSlBSpY', channel:'Hopsworks',            duration:'20m',    durationSeconds:1200,  topic:'Feature Stores' },
    { id:4, title:'CI/CD for Machine Learning',                             videoId:'9BgIDqAzfuA', channel:'AssemblyAI',           duration:'30m',    durationSeconds:1800,  topic:'CI/CD for ML' },
    { id:5, title:'MLflow Crash Course',                                    videoId:'859OxXrt9z8', channel:'Weights & Biases',     duration:'45m',    durationSeconds:2700,  topic:'Model Registry' },
    { id:6, title:'Kubernetes for ML Engineers',                            videoId:'K3d-Kk_TOVA', channel:'TechWorld with Nana',  duration:'30m',    durationSeconds:1800,  topic:'K8s for ML' },
    { id:7, title:'Deploy ML Models with FastAPI',                          videoId:'h5wLuVDr0oc', channel:'AssemblyAI',           duration:'25m',    durationSeconds:1500,  topic:'Model Serving' },
  ],

  'REACT-402': [
    { id:1, title:'Advanced React Patterns',                                videoId:'WV0UUcSPk-0', channel:'Kent C. Dodds',        duration:'1h 00m', durationSeconds:3600,  topic:'Advanced Patterns' },
    { id:2, title:'React useMemo & useCallback',                            videoId:'MxIPQZ64x0I', channel:'Web Dev Simplified',   duration:'20m',    durationSeconds:1200,  topic:'Memoisation & Hooks' },
    { id:3, title:'React Concurrent Features & Suspense',                   videoId:'NZoRlVi3MjQ', channel:'Theo',                 duration:'25m',    durationSeconds:1500,  topic:'Concurrent Rendering' },
    { id:4, title:'Code-Splitting and Lazy Loading in React',               videoId:'JU6sl_yyZqs', channel:'Jack Herrington',      duration:'18m',    durationSeconds:1080,  topic:'Code Splitting' },
    { id:5, title:'React Testing Library – Full Tutorial',                  videoId:'ZmVBCpefQe8', channel:'The Net Ninja',        duration:'1h 35m', durationSeconds:5700,  topic:'Testing at Scale' },
    { id:6, title:'React Architecture at Scale',                            videoId:'Ck-e3hd3pKw', channel:'Jack Herrington',      duration:'22m',    durationSeconds:1320,  topic:'Scalable Architecture' },
    { id:7, title:'React State Management Comparison 2024',                 videoId:'hL4L6qOlWOM', channel:'Theo',                 duration:'30m',    durationSeconds:1800,  topic:'State at Scale' },
  ],

  // ══════════════════════════════════════════════════════════════════════
  //  20 NEW DOMAIN COURSES
  // ══════════════════════════════════════════════════════════════════════

  // DSA-110: Data Structures & Algorithms
  'DSA-110': [
    { id:1, title:'Data Structures and Algorithms Full Course',             videoId:'8hly31xKli0', channel:'freeCodeCamp',        duration:'8h 26m', durationSeconds:30360, topic:'DSA Foundations' },
    { id:2, title:'Big-O Notation – Full Video Course',                     videoId:'Mo4vesaut8g', channel:'freeCodeCamp',        duration:'1h 50m', durationSeconds:6600,  topic:'Time & Space Complexity' },
    { id:3, title:'Sorting Algorithms in Python',                           videoId:'nqiinhNtvtM', channel:'CS Dojo',             duration:'32m',    durationSeconds:1920,  topic:'Sorting Algorithms' },
    { id:4, title:'Binary Search Trees – Full Implementation',              videoId:'fAAZixBzIAI', channel:'freeCodeCamp',        duration:'45m',    durationSeconds:2700,  topic:'Trees & BST' },
    { id:5, title:'Graph Theory Algorithms – Full Course',                  videoId:'09_LlHjoEiY', channel:'freeCodeCamp',        duration:'7h 04m', durationSeconds:25440, topic:'Graphs & BFS/DFS' },
    { id:6, title:'Dynamic Programming – Learn to Solve Algorithmic Problems', videoId:'oBt53YbR9Kk', channel:'freeCodeCamp',   duration:'5h 11m', durationSeconds:18660, topic:'Dynamic Programming' },
    { id:7, title:'Heap Data Structure – Heapify, Push, Pop',               videoId:'t0Cq6tVNRBA', channel:'CS Dojo',             duration:'25m',    durationSeconds:1500,  topic:'Heaps & Priority Queues' },
  ],

  // CPP-120: Programming (C++ / Java / Python)
  'CPP-120': [
    { id:1, title:'C++ Tutorial for Beginners – Full Course',               videoId:'vLnPwxZdW4Y', channel:'freeCodeCamp',        duration:'4h 01m', durationSeconds:14460, topic:'C++ Fundamentals' },
    { id:2, title:'Java Full Course for Beginners',                         videoId:'GoXwIVyNvX0', channel:'Programming w/ Mosh', duration:'2h 30m', durationSeconds:9000,  topic:'Java Fundamentals' },
    { id:3, title:'Python Full Course – 2024',                              videoId:'_uQrJ0TkZlc', channel:'Programming w/ Mosh', duration:'6h 14m', durationSeconds:22440, topic:'Python Fundamentals' },
    { id:4, title:'Object-Oriented Programming in C++',                     videoId:'wN0x9eZLix4', channel:'freeCodeCamp',        duration:'31h',    durationSeconds:3600,  topic:'OOP in C++' },
    { id:5, title:'Java OOP Concepts – Full Tutorial',                      videoId:'a199g9zqQfY', channel:'Amigoscode',           duration:'30m',    durationSeconds:1800,  topic:'OOP in Java' },
    { id:6, title:'Pointers in C / C++ – Full Course',                      videoId:'zuegQmMdy8M', channel:'freeCodeCamp',        duration:'3h 48m', durationSeconds:13680, topic:'Memory & Pointers' },
    { id:7, title:'Python for Everybody – Full University Course',          videoId:'8DvywoWv6fI', channel:'freeCodeCamp',        duration:'13h 38m',durationSeconds:49080, topic:'Python Deep Dive' },
  ],

  // PS-130: Problem Solving
  'PS-130': [
    { id:1, title:'How to Solve Any Coding Problem',                        videoId:'GKgAVjJxh9w', channel:'CS Dojo',             duration:'23m',    durationSeconds:1380,  topic:'Problem-Solving Framework' },
    { id:2, title:'LeetCode Patterns – Top Interview Problems',             videoId:'DjYZk8nrXVY', channel:'NeetCode',            duration:'28m',    durationSeconds:1680,  topic:'Pattern Recognition' },
    { id:3, title:'Two Pointers – Coding Interview Technique',              videoId:'On03HWe2tZM', channel:'NeetCode',            duration:'22m',    durationSeconds:1320,  topic:'Two Pointers' },
    { id:4, title:'Sliding Window Technique – Coding Patterns',             videoId:'p-ss2JNynmw', channel:'NeetCode',            duration:'21m',    durationSeconds:1260,  topic:'Sliding Window' },
    { id:5, title:'Recursion Crash Course',                                 videoId:'IJDJ0kBx2LM', channel:'Reducible',           duration:'25m',    durationSeconds:1500,  topic:'Recursion & Backtracking' },
    { id:6, title:'Greedy Algorithms – Theory & Practice',                  videoId:'bC7o8P_Ste4', channel:'Abdul Bari',          duration:'15m',    durationSeconds:900,   topic:'Greedy Strategies' },
    { id:7, title:'Competitive Programming Full Course',                    videoId:'IA3WxTTPXqQ', channel:'freeCodeCamp',        duration:'7h 45m', durationSeconds:27900, topic:'Competitive Programming' },
  ],

  // OOP-140: Object-Oriented Programming
  'OOP-140': [
    { id:1, title:'Object-Oriented Programming – Crash Course',             videoId:'SiBw7os-8OI', channel:'freeCodeCamp',        duration:'30m',    durationSeconds:1800,  topic:'OOP Fundamentals' },
    { id:2, title:'4 Pillars of OOP',                                       videoId:'1ONhXmQuWP4', channel:'Web Dev Simplified',   duration:'15m',    durationSeconds:900,   topic:'Encapsulation, Inheritance, Polymorphism, Abstraction' },
    { id:3, title:'SOLID Principles – The Definitive Guide',                videoId:'_jDNAkmL-rw', channel:'Amigoscode',           duration:'1h 20m', durationSeconds:4800,  topic:'SOLID Principles' },
    { id:4, title:'Design Patterns in Python',                              videoId:'bsyjSW46TDg', channel:'freeCodeCamp',        duration:'1h 44m', durationSeconds:6240,  topic:'Design Patterns' },
    { id:5, title:'UML Class Diagrams Tutorial',                            videoId:'UI6lqHOVHic', channel:'Lucidchart',           duration:'11m',    durationSeconds:660,   topic:'UML & Modelling' },
    { id:6, title:'Dependency Injection Explained',                         videoId:'EPv9-cHEmQw', channel:'Web Dev Simplified',   duration:'14m',    durationSeconds:840,   topic:'DI & IoC' },
    { id:7, title:'Refactoring Code – Clean Code Techniques',               videoId:'D4auWwMsEnY', channel:'Traversy Media',       duration:'24m',    durationSeconds:1440,  topic:'Clean Code' },
  ],

  // SQL-150: SQL & Databases
  'SQL-150': [
    { id:1, title:'SQL Tutorial – Full Database Course for Beginners',       videoId:'HXV3zeQKqGY', channel:'freeCodeCamp',        duration:'4h 20m', durationSeconds:15600, topic:'SQL Basics' },
    { id:2, title:'MySQL – The Full Course',                                 videoId:'ER8oKX5myE0', channel:'freeCodeCamp',        duration:'3h 10m', durationSeconds:11400, topic:'MySQL Mastery' },
    { id:3, title:'Advanced SQL – Window Functions',                         videoId:'H6OTMoXjNiM', channel:'Alex The Analyst',    duration:'35m',    durationSeconds:2100,  topic:'Window Functions' },
    { id:4, title:'Database Normalization – 1NF 2NF 3NF BCNF',              videoId:'GFQaEYEc8_0', channel:'Decomplexify',         duration:'30m',    durationSeconds:1800,  topic:'Normalisation' },
    { id:5, title:'Transactions and ACID Properties',                        videoId:'pomxJOFVcQs', channel:'Decomplexify',         duration:'22m',    durationSeconds:1320,  topic:'Transactions & ACID' },
    { id:6, title:'Indexes in SQL – Full Course',                            videoId:'-qNSXK7s7_w', channel:'Decomplexify',         duration:'28m',    durationSeconds:1680,  topic:'Indexing & Performance' },
    { id:7, title:'PostgreSQL Tutorial – Full Course',                       videoId:'SpfIwlAYaKk', channel:'freeCodeCamp',        duration:'4h 19m', durationSeconds:15540, topic:'PostgreSQL Deep Dive' },
  ],

  // DBMS-160: Database Management Systems
  'DBMS-160': [
    { id:1, title:'DBMS Complete Course – Theory & Practicals',             videoId:'6Iu45VZZoBo', channel:"Jenny's Lectures",     duration:'10h+',   durationSeconds:36000, topic:'DBMS Theory' },
    { id:2, title:'ER Diagram – Entity Relationship Model',                 videoId:'QpdhBUYk7Kk', channel:'Lucidchart',           duration:'15m',    durationSeconds:900,   topic:'ER Modelling' },
    { id:3, title:'Relational Algebra – DBMS',                              videoId:'wh9SRj5z5Q8', channel:'Gate Smashers',        duration:'38m',    durationSeconds:2280,  topic:'Relational Algebra' },
    { id:4, title:'Indexing in DBMS',                                       videoId:'aZjYr87r1b8', channel:'Gate Smashers',        duration:'45m',    durationSeconds:2700,  topic:'B+ Trees & Indexing' },
    { id:5, title:'Concurrency Control in DBMS',                            videoId:'3V9l2mvb8mY', channel:'Gate Smashers',        duration:'55m',    durationSeconds:3300,  topic:'Concurrency Control' },
    { id:6, title:'Deadlock in DBMS',                                       videoId:'UVo9mGARkhQ', channel:'Neso Academy',         duration:'25m',    durationSeconds:1500,  topic:'Deadlock & Recovery' },
    { id:7, title:'NoSQL vs SQL – Which One Should You Use?',               videoId:'QwevGzVu_zk', channel:'Academind',            duration:'19m',    durationSeconds:1140,  topic:'NoSQL vs Relational' },
  ],

  // OS-170: Operating Systems
  'OS-170': [
    { id:1, title:'Operating Systems – Full Course',                        videoId:'mXw9ruZaxKs', channel:'Neso Academy',         duration:'22h+',   durationSeconds:36000, topic:'OS Foundations' },
    { id:2, title:'Process Management in OS',                               videoId:'OrM7nZcxXZU', channel:'Gate Smashers',        duration:'48m',    durationSeconds:2880,  topic:'Processes & Threads' },
    { id:3, title:'CPU Scheduling Algorithms',                              videoId:'BZos4pWN6xE', channel:'Gate Smashers',        duration:'52m',    durationSeconds:3120,  topic:'CPU Scheduling' },
    { id:4, title:'Memory Management in OS',                                videoId:'qdkBMv-dPnQ', channel:'Gate Smashers',        duration:'50m',    durationSeconds:3000,  topic:'Memory Management' },
    { id:5, title:'Deadlock in Operating Systems',                          videoId:'UVo9mGARkhQ', channel:'Neso Academy',         duration:'25m',    durationSeconds:1500,  topic:'Deadlock' },
    { id:6, title:'File Systems in OS',                                     videoId:'PQrDpCkr3_s', channel:'Gate Smashers',        duration:'40m',    durationSeconds:2400,  topic:'File Systems' },
    { id:7, title:'Virtual Memory – OS Concepts',                           videoId:'pj6qrCH5pLg', channel:'Neso Academy',         duration:'30m',    durationSeconds:1800,  topic:'Virtual Memory & Paging' },
  ],

  // CN-180: Computer Networks
  'CN-180': [
    { id:1, title:'Computer Networking Full Course',                        videoId:'IPvYjXCsTg8', channel:'freeCodeCamp',        duration:'9h 25m', durationSeconds:33900, topic:'Networking Fundamentals' },
    { id:2, title:'OSI Model Explained',                                    videoId:'vv4y_uOneC0', channel:'TechTerms',            duration:'13m',    durationSeconds:780,   topic:'OSI Model & TCP/IP' },
    { id:3, title:'IP Addressing and Subnetting',                           videoId:'rs-hRW3XMIU', channel:'Sunny Classroom',      duration:'55m',    durationSeconds:3300,  topic:'IP Addressing & Subnetting' },
    { id:4, title:'TCP vs UDP – Key Differences',                           videoId:'uwoD5YsGACg', channel:'TechTerms',            duration:'10m',    durationSeconds:600,   topic:'TCP vs UDP' },
    { id:5, title:'DNS Explained',                                          videoId:'72snZctFFtA', channel:'Techquickie',          duration:'6m',     durationSeconds:360,   topic:'DNS & HTTP' },
    { id:6, title:'Network Security – Full Course',                         videoId:'qiQR5rTSshw', channel:'freeCodeCamp',        duration:'3h 10m', durationSeconds:11400, topic:'Network Security' },
    { id:7, title:'HTTP Crash Course & Exploration',                        videoId:'iYM2zFP3Zn0', channel:'Traversy Media',       duration:'38m',    durationSeconds:2280,  topic:'HTTP / HTTPS' },
  ],

  // WEBDEV-190: Web Development (Full-Stack)
  'WEBDEV-190': [
    { id:1, title:'Web Development Full Course – 11 Hours',                 videoId:'nu_pCVPKzTk', channel:'freeCodeCamp',        duration:'11h',    durationSeconds:39600, topic:'Web Dev Overview' },
    { id:2, title:'HTML & CSS Full Course – Beginner to Pro',               videoId:'mU6anWqZJcc', channel:'SuperSimpleDev',       duration:'6h 31m', durationSeconds:23460, topic:'HTML & CSS' },
    { id:3, title:'JavaScript Full Course',                                 videoId:'PkZNo7MFNFg', channel:'freeCodeCamp',        duration:'3h 26m', durationSeconds:12360, topic:'JavaScript' },
    { id:4, title:'React Full Course',                                      videoId:'bMknfKXIFA8', channel:'freeCodeCamp',        duration:'4h 01m', durationSeconds:14460, topic:'React' },
    { id:5, title:'Node.js Full Course',                                    videoId:'Oe421EPjeBE', channel:'freeCodeCamp',        duration:'7h 40m', durationSeconds:27600, topic:'Node.js & Express' },
    { id:6, title:'Full-Stack Web App with MERN',                           videoId:'7CqJlxBYj-M', channel:'Traversy Media',       duration:'1h 00m', durationSeconds:3600,  topic:'Full-Stack MERN' },
    { id:7, title:'Responsive Web Design Certification – Full Course',      videoId:'srvUrASNj0s', channel:'freeCodeCamp',        duration:'4h 03m', durationSeconds:14580, topic:'Responsive Design' },
  ],

  // API-200: REST APIs
  'API-200': [
    { id:1, title:'REST API Crash Course – Introduction + Full Example',    videoId:'qbLc5a9LMkk', channel:'Caleb Curry',          duration:'52m',    durationSeconds:3120,  topic:'REST Fundamentals' },
    { id:2, title:'REST API Design Best Practices',                         videoId:'_7UQPve99r4', channel:'Web Dev Simplified',   duration:'20m',    durationSeconds:1200,  topic:'API Design Principles' },
    { id:3, title:'Build a REST API with Node.js & Express',                videoId:'l8WPWK9mS5M', channel:'Web Dev Simplified',   duration:'30m',    durationSeconds:1800,  topic:'Node REST API' },
    { id:4, title:'JWT Authentication – Node & Express',                    videoId:'mbsmsi7l3r4', channel:'Traversy Media',       duration:'1h 00m', durationSeconds:3600,  topic:'JWT Auth' },
    { id:5, title:'API Testing with Postman',                               videoId:'VywxIQ2ZXw4', channel:'freeCodeCamp',        duration:'2h 00m', durationSeconds:7200,  topic:'Testing APIs' },
    { id:6, title:'GraphQL Full Course',                                    videoId:'ed8SaKjLGnc', channel:'freeCodeCamp',        duration:'6h 28m', durationSeconds:23280, topic:'GraphQL & REST Comparison' },
    { id:7, title:'OpenAPI & Swagger Tutorial',                             videoId:'DsMdMiXOeHA', channel:'Traversy Media',       duration:'40m',    durationSeconds:2400,  topic:'API Documentation' },
  ],

  // GIT-205: Git & GitHub
  'GIT-205': [
    { id:1, title:'Git and GitHub for Beginners – Crash Course',            videoId:'RGOj5yH7evk', channel:'freeCodeCamp',        duration:'1h 08m', durationSeconds:4080,  topic:'Git Basics' },
    { id:2, title:'Git Branching and Merging – Detailed Tutorial',          videoId:'Q1kHG842HoI', channel:'The Net Ninja',        duration:'14m',    durationSeconds:840,   topic:'Branching & Merging' },
    { id:3, title:'Git Rebase vs Merge',                                    videoId:'0chZFIZLR_0', channel:'Academind',            duration:'15m',    durationSeconds:900,   topic:'Rebase & Merge Strategies' },
    { id:4, title:'GitHub Actions – Full Tutorial',                         videoId:'R8_veQiYBjI', channel:'TechWorld with Nana',  duration:'2h 11m', durationSeconds:7860,  topic:'CI/CD with GitHub Actions' },
    { id:5, title:'Git for Professionals – Tips & Tricks',                  videoId:'Uszj_k0DGsg', channel:'freeCodeCamp',        duration:'40m',    durationSeconds:2400,  topic:'Advanced Git' },
    { id:6, title:'How to Write Good Commit Messages',                      videoId:'OJqUWvl7VHk', channel:'Fireship',             duration:'5m',     durationSeconds:300,   topic:'Commit Conventions' },
    { id:7, title:'GitHub Pull Requests in 100 Seconds',                    videoId:'8lGpZkjnkt4', channel:'Fireship',             duration:'2m',     durationSeconds:120,   topic:'PR Workflow' },
  ],

  // TEST-215: Software Testing
  'TEST-215': [
    { id:1, title:'Software Testing Crash Course',                          videoId:'LdnlEdhc6Ys', channel:'freeCodeCamp',        duration:'2h 08m', durationSeconds:7680,  topic:'Testing Fundamentals' },
    { id:2, title:'Unit Testing in Python – Unittest Framework',            videoId:'6tNS--WetLI', channel:'Corey Schafer',        duration:'39m',    durationSeconds:2340,  topic:'Unit Testing' },
    { id:3, title:'Test-Driven Development – TDD in Python',                videoId:'ibVSPVz2LAA', channel:'freeCodeCamp',        duration:'1h 22m', durationSeconds:4920,  topic:'TDD' },
    { id:4, title:'Jest Crash Course – Unit Testing in JavaScript',         videoId:'7r4xVDI2vho', channel:'Traversy Media',       duration:'1h 10m', durationSeconds:4200,  topic:'Jest & JS Testing' },
    { id:5, title:'Cypress End-to-End Testing',                             videoId:'BQqzfHQkREo', channel:'freeCodeCamp',        duration:'2h 47m', durationSeconds:10020, topic:'E2E Testing' },
    { id:6, title:'API Testing with Postman',                               videoId:'VywxIQ2ZXw4', channel:'freeCodeCamp',        duration:'2h 00m', durationSeconds:7200,  topic:'Integration & API Testing' },
    { id:7, title:'Software Testing – ISTQB Foundation Course',             videoId:'J9ejsvs7e4k', channel:'Guru99',              duration:'3h 20m', durationSeconds:12000, topic:'ISTQB & Test Strategy' },
  ],

  // CLOUD-225: Cloud Computing
  'CLOUD-225': [
    { id:1, title:'Cloud Computing Full Course',                            videoId:'M988_fsOSWo', channel:'Simplilearn',          duration:'11h',    durationSeconds:39600, topic:'Cloud Fundamentals' },
    { id:2, title:'AWS Certified Cloud Practitioner – Full Course',         videoId:'SOTamWNgDKc', channel:'freeCodeCamp',        duration:'13h 58m',durationSeconds:50280, topic:'AWS Essentials' },
    { id:3, title:'Google Cloud Full Course',                               videoId:'IUU6OR8yHCc', channel:'Google Cloud',         duration:'7h 35m', durationSeconds:27300, topic:'GCP Fundamentals' },
    { id:4, title:'Microsoft Azure Full Course',                            videoId:'NKEFWyqJ5XA', channel:'freeCodeCamp',        duration:'11h 27m',durationSeconds:41220, topic:'Azure Essentials' },
    { id:5, title:'Serverless Computing Explained',                         videoId:'vxJobGtqKVM', channel:'IBM Technology',       duration:'4m',     durationSeconds:240,   topic:'Serverless & FaaS' },
    { id:6, title:'Terraform Full Course',                                  videoId:'SLB_c_ayRMo', channel:'freeCodeCamp',        duration:'2h 30m', durationSeconds:9000,  topic:'Infrastructure as Code' },
    { id:7, title:'Cloud Security Tutorial',                                videoId:'d_QLFRt0qdg', channel:'Simplilearn',          duration:'45m',    durationSeconds:2700,  topic:'Cloud Security' },
  ],

  // DOCKER-230: Docker & Containers
  'DOCKER-230': [
    { id:1, title:'Docker Tutorial for Beginners – Full Course',            videoId:'pTFZFxd5lg8', channel:'TechWorld with Nana',  duration:'3h 36m', durationSeconds:12960, topic:'Docker Basics' },
    { id:2, title:'Docker Compose Tutorial',                                videoId:'HG6yIjggzvY', channel:'TechWorld with Nana',  duration:'1h 56m', durationSeconds:6960,  topic:'Docker Compose' },
    { id:3, title:'Kubernetes Tutorial for Beginners – Full Course',        videoId:'X48VuDVv0do', channel:'TechWorld with Nana',  duration:'5h 59m', durationSeconds:21540, topic:'Kubernetes Basics' },
    { id:4, title:'Docker Networking',                                      videoId:'bKFMS5C4CG0', channel:'TechWorld with Nana',  duration:'27m',    durationSeconds:1620,  topic:'Container Networking' },
    { id:5, title:'Docker Security Best Practices',                         videoId:'JE2PJbbpjsM', channel:'TechWorld with Nana',  duration:'13m',    durationSeconds:780,   topic:'Container Security' },
    { id:6, title:'CI/CD with Docker and GitHub Actions',                   videoId:'R8_veQiYBjI', channel:'TechWorld with Nana',  duration:'2h 11m', durationSeconds:7860,  topic:'CI/CD Pipeline' },
    { id:7, title:'Docker & Kubernetes Full Course – DevOps',               videoId:'Wf2eSG3owoA', channel:'freeCodeCamp',        duration:'4h 20m', durationSeconds:15600, topic:'Full DevOps Workflow' },
  ],

  // SEC-240: Cybersecurity
  'SEC-240': [
    { id:1, title:'Cybersecurity Full Course for Beginners',                videoId:'hXSFdwIIsNU', channel:'freeCodeCamp',        duration:'15h 22m',durationSeconds:55320, topic:'Security Fundamentals' },
    { id:2, title:'Ethical Hacking Full Course',                            videoId:'3Kq1MIfTWCE', channel:'freeCodeCamp',        duration:'15h 00m',durationSeconds:54000, topic:'Ethical Hacking' },
    { id:3, title:'Network Security Full Course',                           videoId:'qiQR5rTSshw', channel:'freeCodeCamp',        duration:'3h 10m', durationSeconds:11400, topic:'Network Security' },
    { id:4, title:'Web Application Security – OWASP Top 10',               videoId:'_Z9RmSe-wSs', channel:'freeCodeCamp',        duration:'1h 20m', durationSeconds:4800,  topic:'OWASP & Web Security' },
    { id:5, title:'Cryptography Full Course',                               videoId:'AQDCe585Lnc', channel:'freeCodeCamp',        duration:'11h',    durationSeconds:39600, topic:'Cryptography' },
    { id:6, title:'Linux for Ethical Hackers – Full Course',                videoId:'lZAoFs75_cs', channel:'freeCodeCamp',        duration:'5h 03m', durationSeconds:18180, topic:'Linux & Penetration Testing' },
    { id:7, title:'Digital Forensics Full Course',                          videoId:'KmoHkb7YMnI', channel:'freeCodeCamp',        duration:'3h 43m', durationSeconds:13380, topic:'Digital Forensics' },
  ],

  // SD-250: System Design
  'SD-250': [
    { id:1, title:'System Design Interview – Full Course',                  videoId:'rnZNcLLFI9E', channel:'freeCodeCamp',        duration:'3h 30m', durationSeconds:12600, topic:'System Design Fundamentals' },
    { id:2, title:'Scalability & System Design for Developers',             videoId:'SqcXvc3ZmRU', channel:'Gaurav Sen',           duration:'1h 10m', durationSeconds:4200,  topic:'Scalability Patterns' },
    { id:3, title:'Designing a URL Shortener – System Design',              videoId:'fMZMm_0ZhK4', channel:'Gaurav Sen',           duration:'22m',    durationSeconds:1320,  topic:'URL Shortener Case Study' },
    { id:4, title:'CAP Theorem Simplified',                                 videoId:'BHqjEjzAicA', channel:'ByteByteGo',           duration:'6m',     durationSeconds:360,   topic:'CAP Theorem' },
    { id:5, title:'Database Sharding Explained',                            videoId:'hdxdhCpgYo8', channel:'ByteByteGo',           duration:'9m',     durationSeconds:540,   topic:'Sharding & Partitioning' },
    { id:6, title:'Load Balancers Explained',                               videoId:'K0Ta65OqQkY', channel:'ByteByteGo',           duration:'12m',    durationSeconds:720,   topic:'Load Balancing' },
    { id:7, title:'Microservices vs Monolith',                              videoId:'NdeTGlZ__Do', channel:'IBM Technology',        duration:'6m',     durationSeconds:360,   topic:'Architecture Patterns' },
  ],

  // AGILE-260: SDLC & Agile
  'AGILE-260': [
    { id:1, title:'Software Development Life Cycle (SDLC) – Full Course',   videoId:'i-QyW8D3ei0', channel:'Simplilearn',          duration:'1h',     durationSeconds:3600,  topic:'SDLC Models' },
    { id:2, title:'Agile Methodology – Full Course',                        videoId:'Z9QbYZh1YXY', channel:'freeCodeCamp',        duration:'3h 10m', durationSeconds:11400, topic:'Agile Fundamentals' },
    { id:3, title:'Scrum in Under 20 Minutes',                              videoId:'XU0llRltyFM', channel:'Axosoft',              duration:'17m',    durationSeconds:1020,  topic:'Scrum Framework' },
    { id:4, title:'Kanban vs Scrum',                                        videoId:'rIaz-l1Kf8w', channel:'Atlassian',            duration:'3m',     durationSeconds:180,   topic:'Kanban & Scrum Comparison' },
    { id:5, title:'Git Feature Branch Workflow',                            videoId:'Bc6WWbxDfqU', channel:'Atlassian',            duration:'7m',     durationSeconds:420,   topic:'Version Control in Agile' },
    { id:6, title:'CI/CD Pipeline Explained',                               videoId:'42UP1fxi2SY', channel:'IBM Technology',       duration:'8m',     durationSeconds:480,   topic:'CI/CD Integration' },
    { id:7, title:'Product Backlog Refinement – Agile',                     videoId:'HkiZ8WE-fGo', channel:'Scrum.org',            duration:'25m',    durationSeconds:1500,  topic:'Sprint Planning' },
  ],

  // DEBUG-270: Debugging
  'DEBUG-270': [
    { id:1, title:'Debugging Tips – How to Debug Your Code',                videoId:'gaminoBsQx0', channel:'Traversy Media',       duration:'20m',    durationSeconds:1200,  topic:'Debugging Fundamentals' },
    { id:2, title:'Chrome DevTools – Full Tutorial',                        videoId:'x4q86IjJFag', channel:'freeCodeCamp',        duration:'1h 47m', durationSeconds:6420,  topic:'Browser DevTools' },
    { id:3, title:'VS Code Debugging Tutorial',                             videoId:'2oFKNL7vYV8', channel:'Fireship',             duration:'8m',     durationSeconds:480,   topic:'IDE Debugger' },
    { id:4, title:'GDB Debugger Tutorial for C/C++',                        videoId:'bWH-nL7v5F4', channel:'CS Dojo',             duration:'15m',    durationSeconds:900,   topic:'GDB Debugger' },
    { id:5, title:'Python Debugging with pdb',                              videoId:'ChuU3NlYRLQ', channel:'Corey Schafer',        duration:'24m',    durationSeconds:1440,  topic:'Python Debugger' },
    { id:6, title:'How to Read Stack Traces',                               videoId:'o_iqpFwM7ok', channel:'Web Dev Simplified',   duration:'12m',    durationSeconds:720,   topic:'Stack Traces & Errors' },
    { id:7, title:'Logging Best Practices',                                 videoId:'jxmzY9soFXg', channel:'Corey Schafer',        duration:'20m',    durationSeconds:1200,  topic:'Logging & Monitoring' },
  ],

  // COMM-280: Communication & Interview Skills
  'COMM-280': [
    { id:1, title:'Technical Interview Prep – Full Course',                 videoId:'1qw5ITr3k9E', channel:'freeCodeCamp',        duration:'5h 11m', durationSeconds:18660, topic:'Interview Preparation' },
    { id:2, title:'How to Introduce Yourself in an Interview',              videoId:'kayOhGRcNt4', channel:'Jeff Su',              duration:'7m',     durationSeconds:420,   topic:'Self-Introduction' },
    { id:3, title:'Behavioural Interview Questions – STAR Method',          videoId:'0nN7Q7DrI68', channel:'Jeff Su',              duration:'11m',    durationSeconds:660,   topic:'Behavioural Questions' },
    { id:4, title:'How to Answer Technical Questions',                      videoId:'WnPLzgM3DtQ', channel:'CS Dojo',             duration:'16m',    durationSeconds:960,   topic:'Technical Q&A Skills' },
    { id:5, title:'Resume Writing for Software Engineers',                  videoId:'J5gy9iqjwXM', channel:'CS Dojo',             duration:'19m',    durationSeconds:1140,  topic:'Resume Building' },
    { id:6, title:'LinkedIn Profile Optimization for Developers',           videoId:'UY_pKXy6oec', channel:'Traversy Media',       duration:'23m',    durationSeconds:1380,  topic:'LinkedIn & Networking' },
    { id:7, title:'System Design Interview – How to Approach',              videoId:'0163cssT0-E', channel:'Exponent',             duration:'20m',    durationSeconds:1200,  topic:'System Design Interviews' },
  ],

  // ══════════════════════════════════════════════════════════════════════
  //  NEW SUBJECT COURSES — Java, Cloud, OS, DBMS
  // ══════════════════════════════════════════════════════════════════════

  // CPP-120 also covers Java — videos already included above via CPP-120
  // Adding a dedicated Java-focused entry reachable from skill tag 'java'
  'JAVA-290': [
    { id:1, title:'Java Full Course for Beginners',                         videoId:'GoXwIVyNvX0', channel:'Programming w/ Mosh', duration:'2h 30m', durationSeconds:9000,  topic:'Java Fundamentals' },
    { id:2, title:'Java OOP – Full Tutorial',                               videoId:'a199g9zqQfY', channel:'Amigoscode',           duration:'30m',    durationSeconds:1800,  topic:'OOP in Java' },
    { id:3, title:'Java Collections Framework',                             videoId:'GdAon80-0KA', channel:'Amigoscode',           duration:'38m',    durationSeconds:2280,  topic:'Collections & Generics' },
    { id:4, title:'Java Exception Handling',                                videoId:'1XAfapkBQjk', channel:'Programming w/ Mosh', duration:'30m',    durationSeconds:1800,  topic:'Exceptions & Error Handling' },
    { id:5, title:'Java Multithreading & Concurrency',                      videoId:'r_MbozD32eo', channel:'Amigoscode',           duration:'52m',    durationSeconds:3120,  topic:'Threads & Concurrency' },
    { id:6, title:'Spring Boot Tutorial for Beginners',                     videoId:'9SGDpanrc8U', channel:'Amigoscode',           duration:'2h 25m', durationSeconds:8700,  topic:'Spring Boot & REST APIs' },
    { id:7, title:'Java Design Patterns – Full Course',                     videoId:'v9ejT8FO-7I', channel:'freeCodeCamp',        duration:'1h 52m', durationSeconds:6720,  topic:'Design Patterns in Java' },
  ],

  // CLOUD-225 already exists above; adding a second entry for the 'cloud' skill tag
  'CLOUD-290': [
    { id:1, title:'Cloud Computing Full Course',                            videoId:'M988_fsOSWo', channel:'Simplilearn',          duration:'11h',    durationSeconds:39600, topic:'Cloud Fundamentals' },
    { id:2, title:'AWS Certified Cloud Practitioner – Full Course',         videoId:'SOTamWNgDKc', channel:'freeCodeCamp',        duration:'13h 58m',durationSeconds:50280, topic:'AWS Essentials' },
    { id:3, title:'What is Cloud Computing?',                               videoId:'M988_fsOSWo', channel:'Simplilearn',          duration:'11h',    durationSeconds:3600,  topic:'Cloud Service Models' },
    { id:4, title:'Serverless Computing Explained',                         videoId:'vxJobGtqKVM', channel:'IBM Technology',       duration:'4m',     durationSeconds:240,   topic:'Serverless & FaaS' },
    { id:5, title:'Terraform Full Course',                                  videoId:'SLB_c_ayRMo', channel:'freeCodeCamp',        duration:'2h 30m', durationSeconds:9000,  topic:'Infrastructure as Code' },
    { id:6, title:'Docker and Kubernetes – Full Course',                    videoId:'Wf2eSG3owoA', channel:'freeCodeCamp',        duration:'4h 20m', durationSeconds:15600, topic:'Containers & Orchestration' },
    { id:7, title:'Cloud Security Tutorial',                                videoId:'d_QLFRt0qdg', channel:'Simplilearn',          duration:'45m',    durationSeconds:2700,  topic:'Cloud Security' },
  ],
};

/**
 * Returns the 7 curated video modules for a given course code.
 * Falls back to a generic single-video list when code is not in the library.
 */
function getCourseVideos(courseCode, skills = []) {
  const code = String(courseCode || '').toUpperCase().trim();
  if (CURATED_LIBRARY[code]) return CURATED_LIBRARY[code];

  const GENERIC = {
    html:       { title:'HTML & CSS Full Course',      videoId:'pQN-pnXPaVg', durationSeconds:7320  },
    css:        { title:'CSS Full Course',              videoId:'OXGznpKZ_sA', durationSeconds:22680 },
    javascript: { title:'JavaScript Full Course',       videoId:'PkZNo7MFNFg', durationSeconds:12360 },
    react:      { title:'React Full Course',            videoId:'bMknfKXIFA8', durationSeconds:14460 },
    nodejs:     { title:'Node.js Full Course',          videoId:'fBNz5xF-Kx4', durationSeconds:5400  },
    python:     { title:'Python Full Course',           videoId:'_uQrJ0TkZlc', durationSeconds:22440 },
    mongodb:    { title:'MongoDB Crash Course',         videoId:'pWbMFrVA3mc', durationSeconds:4200  },
    sql:        { title:'SQL Full Course',              videoId:'HXV3zeQKqGY', durationSeconds:15600 },
    git:        { title:'Git & GitHub Course',          videoId:'RGOj5yH7evk', durationSeconds:4080  },
    dsa:        { title:'DSA Full Course',              videoId:'8hly31xKli0', durationSeconds:30360 },
    java:       { title:'Java Full Course',             videoId:'GoXwIVyNvX0', durationSeconds:9000  },
    cloud:      { title:'Cloud Computing Full Course',  videoId:'M988_fsOSWo', durationSeconds:39600 },
    os:         { title:'Operating Systems Full Course',videoId:'mXw9ruZaxKs', durationSeconds:36000 },
    dbms:       { title:'DBMS Full Course',             videoId:'6Iu45VZZoBo', durationSeconds:36000 },
  };

  return (skills.length ? skills : ['javascript']).slice(0, 7).map((skill, i) => {
    const g = GENERIC[skill.toLowerCase()] || { title:`${skill} Tutorial`, videoId:'PkZNo7MFNFg', durationSeconds:3600 };
    return { id:i+1, title:g.title, videoId:g.videoId, channel:'freeCodeCamp',
             duration:'Full Course', durationSeconds:g.durationSeconds, topic:skill };
  });
}

// Legacy shim kept for courseAggregator.js backward compat
async function getCourses(skill) {
  const fallback = getCourseVideos('', [skill]);
  return fallback.map(v => ({ title:v.title, url:`https://www.youtube.com/watch?v=${v.videoId}`, thumbnail:'' }));
}

module.exports = { getCourseVideos, getCourses, CURATED_LIBRARY };
