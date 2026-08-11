module.exports = function getLandingTemplate(projectName) {
  return {
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
};
