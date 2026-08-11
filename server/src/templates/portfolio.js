module.exports = function getPortfolioTemplate(projectName) {
  return {
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
};
