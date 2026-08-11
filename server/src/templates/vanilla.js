module.exports = function getVanillaTemplate(projectName) {
  return {
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
};
