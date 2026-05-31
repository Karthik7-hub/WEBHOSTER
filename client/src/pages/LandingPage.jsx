import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Zap, Cloud, Terminal, Shield, Laptop, ArrowRight, Check, Play, Eye, GitBranch, Server, Cpu
} from 'lucide-react';
import { motion } from 'framer-motion';
import styles from './LandingPage.module.css';

export default function LandingPage() {
  const [activeTab, setActiveTab] = useState('html');
  const [clickCount, setClickCount] = useState(0);

  // Simulated code edits mapping to live visual frame sandbox
  const simulatedFiles = {
    html: `<!DOCTYPE html>
<html>
  <head>
    <link rel="stylesheet" href="style.css">
  </head>
  <body>
    <div class="card glow-border">
      <h2>Hello from WebHoster!</h2>
      <p>Instant serving. Sandboxed execution.</p>
      <button onclick="increment()">
        Interactions: <span id="count">0</span>
      </button>
    </div>
  </body>
</html>`,
    css: `.card {
  background: rgba(255, 255, 255, 0.03);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 16px;
  padding: 2rem;
  text-align: center;
}
.glow-border:hover {
  border-color: #3b82f6;
  box-shadow: 0 0 20px rgba(59, 130, 246, 0.2);
}`,
    js: `function increment() {
  const el = document.getElementById('count');
  let current = parseInt(el.textContent);
  el.textContent = current + 1;
}`
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: 'spring', stiffness: 100 } }
  };

  return (
    <div className={styles.page}>
      {/* Glow Backdrops */}
      <div className={styles.glowingBg}>
        <div className={styles.glowPurple}></div>
        <div className={styles.glowBlue}></div>
      </div>

      {/* Header bar */}
      <header className={styles.header}>
        <div className={styles.headerContainer}>
          <div className={styles.brand}>
            <Zap size={22} className={styles.logoIcon} />
            <span className={styles.logoText}>Web<span className={styles.logoHighlight}>Hoster</span></span>
          </div>
          <Link to="/login" className={styles.loginBtn}>
            Console
            <ArrowRight size={14} />
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className={styles.heroSection}>
        <motion.div 
          className={styles.heroContent}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          <span className={styles.badge}>
            <SparklesIcon /> Static Hosting + Cloud IDE Ecosystem
          </span>
          <h1 className={styles.title}>
            Deploy Static Web Apps <br />
            <span className={styles.gradientText}>Without Server Boundaries</span>
          </h1>
          <p className={styles.subtitle}>
            WebHoster combines a browser-based Monaco editor, instant CDN deployments, and sandboxed live previews into a high-fidelity developer workspace.
          </p>

          <div className={styles.heroActions}>
            <Link to="/login" className={styles.primaryBtn}>
              Start Building Free
              <ArrowRight size={16} />
            </Link>
            <a href="#demo" className={styles.secondaryBtn}>
              Explore IDE View
            </a>
          </div>
        </motion.div>
      </section>

      {/* Interactive Code Preview (Simulated cloud IDE) */}
      <section id="demo" className={styles.demoSection}>
        <div className={styles.sectionHeader}>
          <h2>In-Browser Coding Workspace</h2>
          <p>Experience real-time hot reloading inside isolated sandboxed environments.</p>
        </div>

        <div className={styles.ideContainer}>
          {/* Simulated Sidebar Explorer */}
          <div className={styles.ideExplorer}>
            <div className={styles.explorerTitle}>Files</div>
            <div className={styles.fileList}>
              <div 
                className={`${styles.fileItem} ${activeTab === 'html' ? styles.activeFile : ''}`}
                onClick={() => setActiveTab('html')}
              >
                <FileIconCode />
                <span>index.html</span>
              </div>
              <div 
                className={`${styles.fileItem} ${activeTab === 'css' ? styles.activeFile : ''}`}
                onClick={() => setActiveTab('css')}
              >
                <FileIconPalette />
                <span>style.css</span>
              </div>
              <div 
                className={`${styles.fileItem} ${activeTab === 'js' ? styles.activeFile : ''}`}
                onClick={() => setActiveTab('js')}
              >
                <FileIconCodeYellow />
                <span>script.js</span>
              </div>
            </div>
          </div>

          {/* Simulated Code Editor */}
          <div className={styles.ideEditor}>
            <div className={styles.editorHeader}>
              <div className={styles.editorTabs}>
                <span className={styles.activeTab}>{activeTab === 'html' ? 'index.html' : activeTab === 'css' ? 'style.css' : 'script.js'}</span>
              </div>
              <span className={styles.autoSaveText}>Auto-saves debounced</span>
            </div>
            <pre className={styles.codeSnippet}>
              <code>{simulatedFiles[activeTab]}</code>
            </pre>
          </div>

          {/* Simulated Browser Preview */}
          <div className={styles.idePreview}>
            <div className={styles.previewHeader}>
              <div className={styles.browserAddress}>
                <Eye size={12} />
                <span>project-preview.webhost.io</span>
              </div>
              <button 
                type="button" 
                className={styles.refreshBtn}
                onClick={() => setClickCount(0)}
              >
                Reset
              </button>
            </div>
            
            <div className={styles.previewSandbox}>
              <div className={styles.simulatedCard}>
                <h3>Interactive Playground</h3>
                <p>Edit variables and visual styles inside the editor window to observe dynamic CDN serving.</p>
                
                <button 
                  type="button" 
                  className={styles.simulatedBtn}
                  onClick={() => setClickCount(prev => prev + 1)}
                >
                  Clicks: {clickCount}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className={styles.featuresSection}>
        <div className={styles.sectionHeader}>
          <h2>Engineered for High Performance</h2>
          <p>Everything you need to compile, preview, and host static sites globally.</p>
        </div>

        <motion.div 
          className={styles.grid}
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
        >
          <motion.div className={styles.featureCard} variants={itemVariants}>
            <div className={styles.featureIcon}><Cloud size={20} /></div>
            <h3>100ms Edge serving</h3>
            <p>Sites are bundled, archived, and deployed immediately to high-speed CDN servers for rapid globally caching.</p>
          </motion.div>

          <motion.div className={styles.featureCard} variants={itemVariants}>
            <div className={styles.featureIcon}><Terminal size={20} /></div>
            <h3>Browser Monaco Engine</h3>
            <p>Write clean code with syntax highlighting, automatic indent guides, autocomplete, and multi-tabs manager.</p>
          </motion.div>

          <motion.div className={styles.featureCard} variants={itemVariants}>
            <div className={styles.featureIcon}><Shield size={20} /></div>
            <h3>Framing Isolation</h3>
            <p>Previews are executed inside isolated sandboxes to protect administrative cookies and user authentication tokens.</p>
          </motion.div>

          <motion.div className={styles.featureCard} variants={itemVariants}>
            <div className={styles.featureIcon}><GitBranch size={20} /></div>
            <h3>Instant Version Rollbacks</h3>
            <p>Every redeployment triggers automatic backup revisions on secure ImageKit block storage vaults.</p>
          </motion.div>
        </motion.div>
      </section>

      {/* Hosting Workflow Stages */}
      <section className={styles.workflowSection}>
        <div className={styles.sectionHeader}>
          <h2>Zero-Config Deployment Pipeline</h2>
          <p>WebHoster automates the complete packaging and publishing cycle behind the scenes.</p>
        </div>

        <div className={styles.workflowSteps}>
          <div className={styles.step}>
            <div className={styles.stepNum}>1</div>
            <h3>Bootstrap Workspace</h3>
            <p>Select a responsive landing, React, or portfolio template from our catalog marketplace.</p>
          </div>
          <div className={styles.stepArrow}><ArrowRight size={24} /></div>
          <div className={styles.step}>
            <div className={styles.stepNum}>2</div>
            <h3>Edit & Review</h3>
            <p>Refine your codebase with full Monaco tools and debounced real-time visual sandbox sync.</p>
          </div>
          <div className={styles.stepArrow}><ArrowRight size={24} /></div>
          <div className={styles.step}>
            <div className={styles.stepNum}>3</div>
            <h3>Redeploy Live</h3>
            <p>Publish modifications directly to edge servers globally with a single click in 700ms.</p>
          </div>
        </div>
      </section>

      {/* Mock Analytics statistics dashboard */}
      <section className={styles.statsSection}>
        <div className={styles.statsContainer}>
          <div className={styles.statBox}>
            <span className={styles.statVal}>99.99%</span>
            <span className={styles.statLabel}>Global Edge Uptime</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statVal}>&lt; 700ms</span>
            <span className={styles.statLabel}>Build Compilations</span>
          </div>
          <div className={styles.statBox}>
            <span className={styles.statVal}>120+</span>
            <span className={styles.statLabel}>Locations Cached</span>
          </div>
        </div>
      </section>

      {/* Final Call To Action (CTA) */}
      <section className={styles.ctaSection}>
        <div className={styles.ctaCard}>
          <h2>Launch Your First Static Site Today</h2>
          <p>Upload a custom ZIP file or select a starter marketplace framework to begin developing instantly.</p>
          <Link to="/login" className={styles.ctaBtn}>
            Get Started Console
            <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className={styles.footer}>
        <p>&copy; 2026 WebHoster Inc. Premium Cloud Developer Platform.</p>
      </footer>
    </div>
  );
}

// Inline SVGs for quick premium icons without importing massive libraries
function SparklesIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginRight: '6px' }}>
      <path d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m11.314 11.314l.707-.707" />
    </svg>
  );
}

function FileIconCode() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#e44d26" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><polyline points="8 13 10 15 8 17" /><polyline points="16 13 14 15 16 17" /></svg>;
}

function FileIconPalette() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#30a9dc" strokeWidth="2"><path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" /><path d="M7.5 10.5C8.32843 10.5 9 9.82843 9 9C9 8.17157 8.32843 7.5 7.5 7.5C6.67157 7.5 6 8.17157 6 9C6 9.82843 6.67157 10.5 7.5 10.5Z" /><path d="M11.5 7.5C12.3284 7.5 13 6.82843 13 6C13 5.17157 12.3284 4.5 11.5 4.5C10.6716 4.5 10 5.17157 10 6C10 6.82843 10.6716 7.5 11.5 7.5Z" /><path d="M16.5 10.5C17.3284 10.5 18 9.82843 18 9C18 8.17157 17.3284 7.5 16.5 7.5C15.6716 7.5 15 8.17157 15 9C15 9.82843 15.6716 10.5 16.5 10.5Z" /></svg>;
}

function FileIconCodeYellow() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f7df1e" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><path d="M8 17h8" /></svg>;
}
