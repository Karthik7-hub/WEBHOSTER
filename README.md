# ⚡ WebHoster — Premium Static Web Hosting SaaS & Monaco IDE

WebHoster is a production-grade, secure, and ultra-modern static web hosting SaaS platform inspired by Vercel and Netlify. It allows users to build, edit, deploy, and manage static web assets (HTML, CSS, JS, and media) instantly through a high-fidelity browser-based Monaco IDE or direct ZIP archive upload.

Equipped with a **professional design system (supporting Dark, Light, and System themes)**, a **translucent floating glass bottom navigation dock**, and a **mockup-precise split-column authentication gateway**, WebHoster brings premium product engineering directly to the web.

---

## 🏗️ Monorepo Architecture & Directory Layout

WebHoster leverages a clean, high-performance monorepo-style structure prioritizing separation of concerns and absolute modularity:

```text
webhoster/ (workspace root)
│
├── client/                     # Vite React Frontend App
│   ├── public/                 # Static public assets
│   └── src/
│       ├── api/                # Unified Axios REST API endpoints
│       ├── components/         # Scoped UI Components (AppShell, Header, UploadZone)
│       ├── context/            # Global state context (DeploymentContext, ThemeContext)
│       ├── pages/              # View pages (LoginPage, DashboardPage, ProjectEditorPage)
│       ├── styles/             # Unified Design System tokens & theme sheets
│       │   ├── base/           # Typography and global variables
│       │   └── themes/         # dark.css & light.css modern theme tokens
│       └── App.jsx             # React Router and portal layouts
│
├── server/                     # Node.js & Express REST Backend API
│   ├── src/
│   │   ├── config/             # Path definitions & database connection config
│   │   ├── controllers/        # Express request/response handlers
│   │   ├── middleware/         # Trailing-slash redirections, static headers, logging
│   │   ├── models/             # Mongoose DB schemas (Deployment, DeploymentVersion, Trash)
│   │   ├── security/           # Safe path boundary & prohibited file uploads filters
│   │   └── services/           # Extraction logic & ImageKit Cloud backup synchronizer
│   └── server.js               # Express server entry point
│
├── deployments/                # Local sandbox directories for live serving
├── uploads/                    # Temporary multer file storage
├── temp/                       # General temp working directories
└── README.md                   # Complete system engineering review & documentation
```

---

## 🛠️ Quick Start Guide

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) (v16+) and [MongoDB](https://www.mongodb.com/) installed and running on your system.

### 2. Environment Configurations (`server/.env`)
Create a `.env` file inside the `server/` directory. The project is pre-configured to utilize the following parameters:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/webhoster
IMAGEKIT_PUBLIC_KEY=public_WFeQX8Uk...
IMAGEKIT_PRIVATE_KEY=private_rj5r/x7...
IMAGEKIT_URL_ENDPOINT=https://ik.imagekit.io/LAzy/
FRONTEND_URL=http://localhost:5173
ADMIN_USERNAME=admin@webhoster.com
ADMIN_PASSWORD=admin-secure-pass
```

### 3. Backend Setup & Run
Open a terminal in the project's root:
```bash
cd server
npm install
npm run dev
```
The backend API server will run on `http://localhost:5000` with active Hot Module Replacement (HMR) and automatic database connection.

### 4. Frontend Setup & Run
Open a secondary terminal from the root:
```bash
cd client
npm install
npm run dev
```
The React frontend will boot up on `http://localhost:5173`. Vite will automatically proxy all API and static page serving requests to the backend server.

---

## 💎 State-of-the-Art UI & Design System

WebHoster features a completely custom, professional design system with elite micro-animations and layouts:

### 1. Unified Theme Switcher (Dark / Light / System Mode)
*   **System-Wide Adaptability**: Built around a dynamic React Context, the UI supports native theme swapping, persisting the active setting inside `localStorage` and responding instantly to system OS preferences (`prefers-color-scheme`).
*   **Curated Palettes**: Built with 70+ custom CSS variables ([dark.css](file:///c:/Users/vkart/Music/WORK/Projects_fullstack/webhoster/client/src/styles/themes/dark.css) and [light.css](file:///c:/Users/vkart/Music/WORK/Projects_fullstack/webhoster/client/src/styles/themes/light.css)) providing high-contrast text, modern glass borders, and smooth transitions.
*   **Dynamic Theme-Adaptable Cards**: Replaced static grays with dynamic tokens (`var(--bg-card)`, `var(--glass-border)`) so that all modal boxes, specifications sheets, and dashboards adapt seamlessly to light and dark interfaces.

### 2. Mobile Floating Glass Navigation Dock
*   **Modern Ambient Dock**: On mobile screens (`≤768px`), standard side navigation transforms into a gorgeous floating bottom dock.
*   **Premium Blur Specifications**: Configured with a **68px height**, **24px border-radius**, and **28px backdrop blur**, floating elegantly with **20px screen margins** (`bottom: 20px; left: 20px; right: 20px;`).
*   **Under-Label Micro-Indicators**: Placed a minimalist, centered glowing active dot indicator directly under text labels. When a tab is selected, the indicator scales up smoothly and glows via cubic-bezier ease curves.
*   **Full Tab Access**: Balances 4 comprehensive touch targets: **Dashboard**, **Templates** (Zap), **Storage** (Trash Bin), and **Settings** (Appearance).

### 3. Premium Split-Column Login Gateway
*   **Marketing Column**: A stunning left-side banner column featuring deep graphite gradients, tilted blue-purple elliptical glowing streaks (`-25deg` rotation with high blurs), and outline feature pills ("Instant Deployments", "Browser-Based IDE", "Global CDN").
*   **Translucent Card Gateway**: The right-side login column centers a glassmorphic form card containing modern input fields, customized key icons, and a mockup-precise horizontal purple-to-blue gradient submit button (`linear-gradient(135deg, #a855f7 0%, #6366f1 100%)`).
*   **Mobile Flat Cleanup**: On smaller viewports (`≤480px`), card boundaries and overlays are automatically stripped to render inputs flat, maximizing touch targets and ensuring a native app feel.

### 4. Tactile Click Scale Platform-Wide
*   **Satisfying Click Action**: All buttons (primary, secondary, danger, outline) feature a springy scale-down transition (`transform: scale(0.96)`) on click, giving the entire platform immediate, high-quality tactile feedback.
*   **12px Rounded Profile**: Buttons and primary form controllers standardise on `var(--radius-md)` (12px) and `var(--radius-sm)` (10px) border-radii for visual alignment.

---

## 🛡️ Industrial-Grade Security Architectures

WebHoster ensures 100% security against user-code execution and malicious assets:

1.  **ZIP Slip Path Traversal Attack Defense**:
    During extraction, every file path inside the ZIP is dynamically resolved against the root directory: `resolvedPath.startsWith(resolvedBaseDir)`. If any entry contains escaping structures (e.g. `../`), extraction aborts, files are wiped from the disk, and a security exception is triggered.
2.  **Prohibited Executable Upload Filters**:
    Upload filters block dangerous system file formats (such as `.exe`, `.bat`, `.cmd`, `.sh`, `.php`, `.asp`, `.jsp`, `.htpasswd`) to prevent malicious script injection or privilege escalation.
3.  **Sandboxed Static Site Serving (CSP)**:
    Static sites are served inside frameable routes with strict `Content-Security-Policy` and browser sandboxing headers. Deployed user-code is completely isolated, preventing it from reading cookies, cookies handles, or `localStorage` data belonging to the core administration dashboard.

---

## ⚙️ Engineering & Storage Resilience

To achieve absolute system uptime, several backend infrastructure upgrades have been made:

### 1. archiver v8.0.0+ CommonJS Class Support
*   **Modern API Integration**: Upgraded the zipping system from legacy factory calls to utilize modern named exports (`const { ZipArchive } = require('archiver')`) and constructors (`new ZipArchive`), preventing CommonJS module resolution conflicts.

### 2. Immediate Template Cloud Backups
*   **Template Auto-Saving**: Whenever a project is launched from a starter template, the backend instantly bundles the newly generated files, uploads a backup to ImageKit, and registers the URL immediately in the database.
*   **Lazy-Restore Security**: This guarantees that if local filesystem files are deleted or wiped, template projects can lazy-restore from the cloud instantly, eliminating the legacy `no backup archives found` error.

### 3. Graceful Local-First Fallbacks
*   **Non-Blocking Publishing**: All ImageKit backup synchronizers are wrapped in resilient try-catch layers. If ImageKit is offline or credentials expire, the API records metadata and continues to serve assets locally, keeping publishing completely operational.
*   **Optional Database Fields**: Updated `DeploymentVersionSchema` to make backup URLs optional (`default: null`), preventing database query crashes on fallback.

### 4. OS File-Lock Release Handlers (Windows)
*   **Dynamic iframe Unmounting**: On Windows platforms, browsers keep handle locks open to iframe assets. The details page unmounts the workspace `iframe` elements as soon as a delete operation begins, successfully releasing OS file-handle locks so that directories can be safely purged from the disk.

---

## 🚀 Future Production Scalings

To scale WebHoster to handle millions of concurrent static page views globally:

1.  **Cloud Object Storage (Amazon S3 / Google Cloud Storage)**:
    Store extracted static assets directly inside cloud storage buckets instead of hosting them on local disk directories under `/deployments`.
2.  **Edge CDN Invalidation (Cloudflare / CloudFront)**:
    Deploy a wildcard domain router pointing to the S3 bucket via an edge CDN. Edge-caching delivers static pages globally in under 20ms and invalidates cached assets upon new IDE publishes.
3.  **Asynchronous Extraction Queue (BullMQ + Redis)**:
    Offload heavy upload extraction and zip compression tasks to independent node worker processes, keeping the Express event loop completely free and ultra-responsive.
