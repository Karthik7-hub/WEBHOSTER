module.exports = function getBlogTemplate(projectName) {
  return {
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
};
