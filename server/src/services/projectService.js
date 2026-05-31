const fs = require('fs');
const path = require('path');
const { nanoid } = require('nanoid');
const config = require('../config/config');
const connectDB = require('../config/database');
const Deployment = require('../models/Deployment');

// Helper to generate a clean web-friendly slug
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

/**
 * Returns starter boilerplate contents based on template name
 */
function getTemplateFiles(templateName, projectName) {
  const templates = {};

  // 1. Vanilla HTML/CSS/JS
  templates['vanilla'] = {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName} - WebHoster</title>
  <link rel="stylesheet" href="style.css">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600&display=swap" rel="stylesheet">
</head>
<body>
  <div class="glow"></div>
  <div class="card">
    <div class="badge">Live Development</div>
    <h1>${projectName}</h1>
    <p>Your beautiful static application is live and hosted. Try editing <code>index.html</code>, <code>style.css</code>, or <code>script.js</code> inside the WebHoster IDE. Changes will auto-save and sync immediately.</p>
    
    <div class="interactive-area">
      <p id="counter-txt">Clicks: <span id="count">0</span></p>
      <button id="click-btn">Interact Now</button>
    </div>
  </div>
  
  <script src="script.js"></script>
</body>
</html>`,
    'style.css': `body {
  background: radial-gradient(circle at center, #110e24 0%, #06040d 100%);
  color: #ffffff;
  font-family: 'Outfit', sans-serif;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  margin: 0;
  overflow: hidden;
  position: relative;
}

.glow {
  position: absolute;
  width: 300px;
  height: 300px;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.15) 0%, rgba(99, 102, 241, 0) 70%);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 1;
  pointer-events: none;
}

.card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 24px;
  padding: 40px;
  max-width: 480px;
  text-align: center;
  box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);
  z-index: 2;
  transition: transform 0.3s ease;
}

.card:hover {
  transform: translateY(-5px);
}

.badge {
  display: inline-block;
  background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
  color: white;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 4px 12px;
  border-radius: 20px;
  margin-bottom: 20px;
  letter-spacing: 0.5px;
  text-transform: uppercase;
}

h1 {
  font-size: 2.2rem;
  margin: 0 0 15px 0;
  background: linear-gradient(135deg, #f3e8ff 0%, #c084fc 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

p {
  color: rgba(255, 255, 255, 0.6);
  line-height: 1.6;
  font-size: 1rem;
}

code {
  background: rgba(255, 255, 255, 0.06);
  color: #c084fc;
  padding: 2px 6px;
  border-radius: 4px;
  font-family: monospace;
}

.interactive-area {
  margin-top: 30px;
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  padding-top: 20px;
}

#counter-txt {
  font-size: 1.1rem;
  margin-bottom: 15px;
  color: #c084fc;
  font-weight: 600;
}

button {
  background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
  color: white;
  border: none;
  padding: 12px 28px;
  border-radius: 12px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(168, 85, 247, 0.3);
  transition: all 0.2s ease;
  font-family: inherit;
}

button:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(168, 85, 247, 0.5);
}

button:active {
  transform: translateY(0);
}`,
    'script.js': `let clicks = 0;
const countEl = document.getElementById('count');
const btnEl = document.getElementById('click-btn');

btnEl.addEventListener('click', () => {
  clicks++;
  countEl.textContent = clicks;
  
  // Dynamic scale micro-animation
  btnEl.style.transform = 'scale(0.95)';
  setTimeout(() => {
    btnEl.style.transform = '';
  }, 100);
});`
  };

  // 2. React CDN Starter
  templates['react'] = {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName} - React IDE App</title>
  <link rel="stylesheet" href="style.css">
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;600;800&display=swap" rel="stylesheet">
  <!-- React 18 & ReactDOM via CDN -->
  <script src="https://unpkg.com/react@18/umd/react.development.js" crossorigin></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js" crossorigin></script>
  <!-- Babel standalone compiler for JSX in iframe -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
</head>
<body>
  <div id="root"></div>
  
  <!-- Execute our JSX React component -->
  <script type="text/babel" src="app.js"></script>
</body>
</html>`,
    'app.js': `const { useState, useEffect } = React;

function App() {
  const [clicks, setClicks] = useState(0);
  const [time, setTime] = useState(new Date().toLocaleTimeString());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="app-container">
      <div className="react-card">
        <div className="react-badge">
          <span className="react-pulse"></span>
          React 18 Active
        </div>
        
        <div className="header-logo">
          <svg width="60" height="60" viewBox="-11.5 -10.23174 23 20.46348">
            <title>React Logo</title>
            <circle cx="0" cy="0" r="2.05" fill="#61dafb"/>
            <g stroke="#61dafb" strokeWidth="1" fill="none">
              <ellipse rx="11" ry="4.2"/>
              <ellipse rx="11" ry="4.2" transform="rotate(60)"/>
              <ellipse rx="11" ry="4.2" transform="rotate(120)"/>
            </g>
          </svg>
        </div>

        <h1>React Browser IDE</h1>
        <p className="description">
          This project loads <strong>React UMD CDN</strong> and compiles your JSX code 
          directly in the preview. Edit <code>app.js</code> or <code>style.css</code> to experience live hot reloading!
        </p>

        <div className="info-grid">
          <div className="info-box">
            <span className="label">Live Time</span>
            <span className="value">{time}</span>
          </div>
          <div className="info-box">
            <span className="label">Interactions</span>
            <span className="value">{clicks} clicks</span>
          </div>
        </div>

        <div className="controls">
          <button onClick={() => setClicks(clicks + 1)} className="btn-primary">
            Click Counter
          </button>
          <button onClick={() => setClicks(0)} className="btn-secondary">
            Reset
          </button>
        </div>
      </div>
    </div>
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);`,
    'style.css': `body {
  margin: 0;
  background-color: #0b0f19;
  color: #f1f5f9;
  font-family: 'Plus Jakarta Sans', sans-serif;
}

.app-container {
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 20px;
  box-sizing: border-box;
}

.react-card {
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(14, 165, 233, 0.2);
  border-radius: 28px;
  padding: 40px;
  width: 440px;
  text-align: center;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  position: relative;
  backdrop-filter: blur(20px);
}

.react-badge {
  position: absolute;
  top: 20px;
  right: 20px;
  display: flex;
  align-items: center;
  gap: 6px;
  background: rgba(14, 165, 233, 0.1);
  border: 1px solid rgba(14, 165, 233, 0.3);
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 0.75rem;
  font-weight: 700;
  color: #38bdf8;
  text-transform: uppercase;
}

.react-pulse {
  width: 6px;
  height: 6px;
  background-color: #38bdf8;
  border-radius: 50%;
  animation: pulse 1.5s infinite;
}

@keyframes pulse {
  0% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.5); opacity: 0.4; }
  100% { transform: scale(1); opacity: 1; }
}

.header-logo {
  margin-top: 10px;
  margin-bottom: 20px;
  animation: spin 20s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

h1 {
  font-size: 2rem;
  font-weight: 800;
  color: #38bdf8;
  margin: 0 0 10px 0;
  letter-spacing: -0.5px;
}

.description {
  font-size: 0.95rem;
  color: #94a3b8;
  line-height: 1.6;
  margin-bottom: 30px;
}

.description strong {
  color: #f1f5f9;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  margin-bottom: 30px;
}

.info-box {
  background: rgba(15, 23, 42, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 15px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.info-box .label {
  font-size: 0.75rem;
  color: #64748b;
  text-transform: uppercase;
  margin-bottom: 4px;
  font-weight: 600;
}

.info-box .value {
  font-size: 1.1rem;
  font-weight: 700;
  color: #f8fafc;
}

.controls {
  display: flex;
  gap: 12px;
}

button {
  flex: 1;
  font-family: inherit;
  font-weight: 600;
  padding: 14px;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 0.95rem;
}

.btn-primary {
  background: #0ea5e9;
  border: none;
  color: white;
  box-shadow: 0 4px 14px rgba(14, 165, 233, 0.4);
}

.btn-primary:hover {
  background: #0284c7;
  transform: translateY(-2px);
}

.btn-secondary {
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #cbd5e1;
}

.btn-secondary:hover {
  background: rgba(255, 255, 255, 0.1);
  color: white;
  transform: translateY(-2px);
}

button:active {
  transform: translateY(0);
}`
  };

  // 3. SaaS Landing Page Template
  templates['landing'] = {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Apex SaaS - Modern Cloud Landing</title>
  <link rel="stylesheet" href="style.css">
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;600;800&display=swap" rel="stylesheet">
</head>
<body>
  <header class="navbar">
    <div class="logo">✦ APEX</div>
    <nav class="nav-links">
      <a href="#features">Features</a>
      <a href="#pricing">Pricing</a>
      <a href="#about">About</a>
    </nav>
    <button class="btn-cta">Start Free</button>
  </header>

  <main class="hero">
    <div class="hero-glow"></div>
    <span class="hero-badge">Next-Generation Serverless Hub</span>
    <h1>Deploy Static Web Apps <span class="gradient-text">Without Barriers</span></h1>
    <p class="hero-sub">Accelerate your dynamic web experience globally. Apex provides instant serving, safe isolated framing sandboxes, and modular integrations.</p>
    <div class="hero-btns">
      <button class="btn-hero-primary" onclick="alert('Apex Cloud activated!')">Get Started</button>
      <button class="btn-hero-secondary" onclick="document.getElementById('features').scrollIntoView({behavior: 'smooth'})">View Features</button>
    </div>
  </main>

  <section id="features" class="features-section">
    <h2>Supercharged Features</h2>
    <div class="features-grid">
      <div class="feature-card">
        <h3>⚡ 100ms Serving</h3>
        <p>Your static websites are cached at edge nodes, ensuring rapid loading across the globe.</p>
      </div>
      <div class="feature-card">
        <h3>🔒 Sandbox Frames</h3>
        <p>Isolated CSP sandboxing keeps your administration cookie-storage fully secure.</p>
      </div>
      <div class="feature-card">
        <h3>💻 Custom Code IDE</h3>
        <p>An integrated code compiler loaded directly inside your secure administration workspace.</p>
      </div>
    </div>
  </section>

  <footer class="footer">
    <p>&copy; 2026 Apex SaaS Cloud Inc. Hosted via WebHoster.</p>
  </footer>
</body>
</html>`,
    'style.css': `body {
  margin: 0;
  background-color: #030712;
  color: #f3f4f6;
  font-family: 'Inter', sans-serif;
  scroll-behavior: smooth;
}

.navbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 80px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.logo {
  font-weight: 800;
  font-size: 1.25rem;
  letter-spacing: 1px;
}

.nav-links a {
  color: #9ca3af;
  text-decoration: none;
  margin: 0 15px;
  font-weight: 500;
  font-size: 0.95rem;
  transition: color 0.2s;
}

.nav-links a:hover {
  color: #ffffff;
}

.btn-cta {
  background: white;
  color: black;
  border: none;
  font-weight: 600;
  padding: 8px 18px;
  border-radius: 8px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-cta:hover {
  opacity: 0.9;
}

.hero {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 120px 20px;
  position: relative;
  overflow: hidden;
}

.hero-glow {
  position: absolute;
  width: 500px;
  height: 500px;
  background: radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, rgba(0,0,0,0) 70%);
  top: -50px;
  z-index: 0;
}

.hero-badge {
  background: rgba(168, 85, 247, 0.1);
  border: 1px solid rgba(168, 85, 247, 0.2);
  color: #c084fc;
  font-size: 0.75rem;
  font-weight: 600;
  padding: 6px 16px;
  border-radius: 9999px;
  margin-bottom: 25px;
  z-index: 1;
}

h1 {
  font-size: 3.5rem;
  font-weight: 800;
  margin: 0 0 20px 0;
  line-height: 1.1;
  max-width: 800px;
  letter-spacing: -1.5px;
  z-index: 1;
}

.gradient-text {
  background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
}

.hero-sub {
  font-size: 1.2rem;
  color: #9ca3af;
  max-width: 650px;
  line-height: 1.6;
  margin-bottom: 40px;
  z-index: 1;
}

.hero-btns {
  display: flex;
  gap: 16px;
  z-index: 1;
}

.btn-hero-primary {
  background: linear-gradient(135deg, #a855f7 0%, #6366f1 100%);
  color: white;
  border: none;
  font-weight: 600;
  font-size: 1.05rem;
  padding: 14px 32px;
  border-radius: 10px;
  cursor: pointer;
  box-shadow: 0 4px 15px rgba(168, 85, 247, 0.4);
  transition: all 0.2s;
}

.btn-hero-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(168, 85, 247, 0.6);
}

.btn-hero-secondary {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.08);
  color: #d1d5db;
  font-weight: 600;
  font-size: 1.05rem;
  padding: 14px 32px;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.2s;
}

.btn-hero-secondary:hover {
  background: rgba(255, 255, 255, 0.08);
}

.features-section {
  padding: 80px;
  text-align: center;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
}

.features-section h2 {
  font-size: 2.2rem;
  margin-bottom: 50px;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 30px;
}

.feature-card {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 16px;
  padding: 30px;
  text-align: left;
  transition: border-color 0.2s;
}

.feature-card:hover {
  border-color: rgba(168, 85, 247, 0.3);
}

.feature-card h3 {
  font-size: 1.25rem;
  margin-top: 0;
  margin-bottom: 12px;
}

.feature-card p {
  color: #9ca3af;
  line-height: 1.6;
  margin: 0;
}

.footer {
  text-align: center;
  padding: 40px;
  border-top: 1px solid rgba(255, 255, 255, 0.05);
  color: #6b7280;
  font-size: 0.9rem;
}`
  };

  // 4. Portfolio Template
  templates['portfolio'] = {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Alex Rivera - Portfolio</title>
  <link rel="stylesheet" href="style.css">
  <link href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@300;400;600;700&display=swap" rel="stylesheet">
</head>
<body>
  <div class="bg-mesh"></div>
  
  <div class="content-wrapper">
    <section class="profile-card">
      <div class="avatar">AR</div>
      <h1>Alex Rivera</h1>
      <p class="title">Full Stack Developer & Designer</p>
      
      <p class="bio">Building high-fidelity interactive web environments. Specialized in React, backend systems, and virtual filesystems.</p>
      
      <div class="skills">
        <span class="skill-tag">Javascript</span>
        <span class="skill-tag">React</span>
        <span class="skill-tag">NodeJS</span>
        <span class="skill-tag">Static Hosting</span>
      </div>

      <div class="actions">
        <a href="mailto:alex@example.com" class="btn-email">Get in Touch</a>
      </div>
    </section>

    <section class="projects">
      <h2>Featured Work</h2>
      <div class="project-item">
        <h3>🚀 WebHoster IDE</h3>
        <p>A comprehensive browser-based coding application supporting live previews and CDN deployment.</p>
      </div>
      <div class="project-item">
        <h3>📦 Sandbox Framing</h3>
        <p>An isolated iframe rendering layer designed to safe-keep cookies and user settings.</p>
      </div>
    </section>
  </div>
</body>
</html>`,
    'style.css': `body {
  margin: 0;
  background-color: #09090b;
  color: #fafafa;
  font-family: 'Space Grotesk', sans-serif;
  display: flex;
  justify-content: center;
  align-items: center;
  min-height: 100vh;
  padding: 40px 20px;
  box-sizing: border-box;
  position: relative;
}

.bg-mesh {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-image: radial-gradient(rgba(244, 63, 94, 0.05) 1px, transparent 0),
                    radial-gradient(rgba(99, 102, 241, 0.05) 1px, transparent 0);
  background-size: 40px 40px;
  background-position: 0 0, 20px 20px;
  z-index: 0;
}

.content-wrapper {
  max-width: 600px;
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 30px;
  z-index: 1;
}

.profile-card {
  background: rgba(18, 18, 21, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 24px;
  padding: 40px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.6);
}

.avatar {
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: linear-gradient(135deg, #f43f5e 0%, #6366f1 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: 700;
  color: white;
  margin-bottom: 24px;
}

h1 {
  font-size: 2.5rem;
  font-weight: 700;
  margin: 0 0 6px 0;
  letter-spacing: -1px;
}

.title {
  color: #f43f5e;
  font-size: 1.15rem;
  margin: 0 0 20px 0;
  font-weight: 600;
}

.bio {
  color: #a1a1aa;
  line-height: 1.6;
  font-size: 1.05rem;
  margin-bottom: 30px;
}

.skills {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 30px;
}

.skill-tag {
  background: rgba(255, 255, 255, 0.03);
  border: 1px solid rgba(255, 255, 255, 0.06);
  padding: 6px 14px;
  border-radius: 8px;
  font-size: 0.85rem;
  font-weight: 500;
  color: #d4d4d8;
}

.btn-email {
  background: #ffffff;
  color: #09090b;
  text-decoration: none;
  font-weight: 600;
  padding: 12px 24px;
  border-radius: 10px;
  display: inline-block;
  transition: opacity 0.2s;
}

.btn-email:hover {
  opacity: 0.9;
}

.projects {
  background: rgba(18, 18, 21, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.05);
  border-radius: 24px;
  padding: 40px;
}

.projects h2 {
  font-size: 1.5rem;
  margin-top: 0;
  margin-bottom: 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  padding-bottom: 10px;
}

.project-item {
  margin-bottom: 20px;
}

.project-item:last-child {
  margin-bottom: 0;
}

.project-item h3 {
  font-size: 1.15rem;
  margin-top: 0;
  margin-bottom: 6px;
}

.project-item p {
  color: #a1a1aa;
  line-height: 1.5;
  font-size: 0.95rem;
  margin: 0;
}`
  };

  // 5. Blog Template
  templates['blog'] = {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Tech Insights - Developer Blog</title>
  <link rel="stylesheet" href="style.css">
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;700&display=swap" rel="stylesheet">
</head>
<body>
  <div class="container">
    <header class="blog-header">
      <h1>Tech<span class="highlight">Insights</span></h1>
      <p>Exploring the frontier of cloud computing, developer tools, and static serving.</p>
    </header>

    <main class="post-list">
      <article class="post-card">
        <span class="post-meta">May 26, 2026 &bull; Static Hosting</span>
        <h2><a href="#" onclick="alert('Read: Accelerating static deployments!')">Accelerating Static Deployments to the CDN Edge</a></h2>
        <p>Why serverless computing and edge-node caching are redefining standard static delivery pipelines in 2026.</p>
      </article>

      <article class="post-card">
        <span class="post-meta">May 20, 2026 &bull; Cloud IDE</span>
        <h2><a href="#" onclick="alert('Read: Browser sandboxing!')">Isolated Browser Sandboxes for Dynamic Code Execution</a></h2>
        <p>A deep dive into Content Security Policies (CSP) and secure iframe architectures for sandboxing dynamic templates.</p>
      </article>
    </main>

    <footer class="blog-footer">
      <p>&copy; 2026 Tech Insights. Built using WebHoster Template.</p>
    </footer>
  </div>
</body>
</html>`,
    'style.css': `body {
  margin: 0;
  background-color: #0a0b10;
  color: #eceef4;
  font-family: 'Outfit', sans-serif;
}

.container {
  max-width: 720px;
  margin: 0 auto;
  padding: 60px 20px;
}

.blog-header {
  text-align: center;
  margin-bottom: 60px;
}

.blog-header h1 {
  font-size: 2.8rem;
  margin: 0 0 10px 0;
  font-weight: 700;
  letter-spacing: -1px;
}

.blog-header .highlight {
  color: #ec4899;
}

.blog-header p {
  color: #8c9bb4;
  font-size: 1.1rem;
  margin: 0;
}

.post-list {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.post-card {
  background: #12131a;
  border: 1px solid #1e202e;
  border-radius: 16px;
  padding: 30px;
  transition: transform 0.2s, border-color 0.2s;
}

.post-card:hover {
  transform: translateY(-2px);
  border-color: rgba(236, 72, 153, 0.3);
}

.post-meta {
  font-size: 0.85rem;
  color: #ec4899;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.post-card h2 {
  font-size: 1.5rem;
  margin-top: 10px;
  margin-bottom: 12px;
}

.post-card h2 a {
  color: #ffffff;
  text-decoration: none;
  transition: color 0.2s;
}

.post-card h2 a:hover {
  color: #ec4899;
}

.post-card p {
  color: #8c9bb4;
  line-height: 1.6;
  margin: 0;
  font-size: 1rem;
}

.blog-footer {
  margin-top: 80px;
  text-align: center;
  color: #4b526d;
  font-size: 0.9rem;
  border-top: 1px solid #1e202e;
  padding-top: 30px;
}`
  };

  // 6. Empty Template
  templates['empty'] = {
    'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Empty Workspace</title>
  <style>
    body {
      background-color: #0d1117;
      color: #c9d1d9;
      font-family: system-ui, -apple-system, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
    }
    .container {
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Empty Sandbox Workspace</h1>
    <p>Use the sidebar to create files and folders. The live preview will reload instantly.</p>
  </div>
</body>
</html>`
  };

  return templates[templateName] || templates['empty'];
}

/**
 * Creates a new project from a template.
 */
async function createProjectFromTemplate(projectName, templateName = 'vanilla') {
  await connectDB();
  const cleanName = projectName.trim() || 'Untitled Project';
  const baseSlug = slugify(cleanName) || 'project';

  // Generate a unique project ID
  let deploymentId = baseSlug;
  let existing = await Deployment.findOne({ id: deploymentId });
  while (existing) {
    const suffix = nanoid(4).toLowerCase();
    deploymentId = `${baseSlug}-${suffix}`;
    existing = await Deployment.findOne({ id: deploymentId });
  }

  const targetDir = path.join(config.paths.deployments, deploymentId);
  const draftDir = path.join(config.paths.deployments, '.drafts', deploymentId);
  fs.mkdirSync(targetDir, { recursive: true });
  fs.mkdirSync(draftDir, { recursive: true });

  const files = getTemplateFiles(templateName, cleanName);
  let fileCount = 0;

  // Write files to both live and drafts folders
  for (const [relativePath, content] of Object.entries(files)) {
    // Write to live targetDir
    const fullPath = path.join(targetDir, relativePath);
    const parent = path.dirname(fullPath);
    if (!fs.existsSync(parent)) {
      fs.mkdirSync(parent, { recursive: true });
    }
    fs.writeFileSync(fullPath, content, 'utf8');

    // Write to draftDir
    const draftPath = path.join(draftDir, relativePath);
    const draftParent = path.dirname(draftPath);
    if (!fs.existsSync(draftParent)) {
      fs.mkdirSync(draftParent, { recursive: true });
    }
    fs.writeFileSync(draftPath, content, 'utf8');

    fileCount++;
  }

  // Generate initial ZIP backup and upload to ImageKit
  const { ZipArchive } = require('archiver');
  const imageKitService = require('./imageKitService');
  const tempZipPath = path.join(config.paths.deployments, `temp-${deploymentId}-${Date.now()}.zip`);

  const zipDirectory = (sourceDir, outPath) => {
    return new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outPath);
      const archive = new ZipArchive({ zlib: { level: 9 } });
      output.on('close', resolve);
      archive.on('error', reject);
      archive.pipe(output);
      archive.glob('**/*', {
        cwd: sourceDir,
        ignore: ['**/node_modules/**', '**/.*/**']
      });
      archive.finalize();
    });
  };

  let imageKitBackup = { url: null, fileId: null };
  try {
    console.log(`[TEMPLATE BACKUP] Zipping template files for "${deploymentId}"...`);
    await zipDirectory(targetDir, tempZipPath);

    console.log(`[TEMPLATE BACKUP] Uploading initial template backup to ImageKit for "${deploymentId}"...`);
    const uploadResult = await imageKitService.uploadBackup(tempZipPath, `${deploymentId}.zip`);
    if (uploadResult && uploadResult.url) {
      imageKitBackup = uploadResult;
      console.log(`[TEMPLATE BACKUP] ImageKit initial backup upload success: ${imageKitBackup.url}`);
    }
  } catch (ikError) {
    console.error(`[TEMPLATE BACKUP] ImageKit backup upload skipped or failed: ${ikError.message}. Proceeding with local release fallback.`);
  } finally {
    if (fs.existsSync(tempZipPath)) {
      fs.unlinkSync(tempZipPath);
    }
  }

  // Write record to database with the backup URLs
  const deployment = await Deployment.create({
    id: deploymentId,
    name: cleanName,
    originalFileName: `template-${templateName}.zip`,
    fileCount,
    indexFilePath: 'index.html',
    backupUrl: imageKitBackup.url,
    backupFileId: imageKitBackup.fileId
  });

  return deployment.toObject();
}

module.exports = {
  createProjectFromTemplate
};
