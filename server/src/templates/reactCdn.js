module.exports = function getReactCdnTemplate(projectName) {
  return {
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
};
