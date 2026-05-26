# ⚡ WebHoster - Monorepo Static Web Hosting SaaS

WebHoster is a production-style, secure, and modern mini static hosting platform inspired by Vercel and Netlify. It is built specifically to deploy static websites instantly. Users drag and drop or select a compressed ZIP archive containing their web assets (HTML, CSS, JS, and media) and instantly receive a globally accelerated public URL where the site is fully active and frameable.

---

## 🏗️ SYSTEM ARCHITECTURE & MONOREPO DIRECTORY

This project uses a clean modular monorepo-style structure prioritizing separation of concerns:

```
project/ (workspace root)
│
├── client/                     # Vite React Frontend App
│   ├── public/                 # Static public files
│   └── src/
│       ├── api/                # Axios API calls
│       ├── components/         # Scoped UI Components (Upload, Dashboard, Header)
│       ├── context/            # Context API global state manager
│       ├── pages/              # View pages (Dashboard, Detail, 404)
│       ├── styles/             # Global CSSVariables, reset, and themes
│       └── App.jsx             # React Router routing configuration
│
├── server/                     # Node Express Backend
│   ├── src/
│   │   ├── config/             # Workspace path loaders
│   │   ├── controllers/        # Express handlers
│   │   ├── middleware/         # Trailing-slash redirects, logs, rate limits
│   │   ├── routes/             # REST endpoint routing mappings
│   │   ├── security/           # ZIP Slip validation filters
│   │   └── services/           # Extract service and ImageKit backing engine
│   └── server.js               # Express server entrypoint
│
├── deployments/                # Extracted live website hostings sandbox
├── uploads/                    # Temporary multer file storage
├── temp/                       # General temp working files
└── README.md                   # Setup and system engineering review
```

---

## 🛠️ QUICK START GUIDE

### 1. Requirements
Ensure you have [Node.js](https://nodejs.org/) (v16+) installed.

### 2. Environment Configurations (`server/.env`)
The server comes pre-configured with active ImageKit credentials. Ensure `server/.env` is set up:
```env
PORT=5000
NODE_ENV=development
IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=your_imagekit_url_endpoint
FRONTEND_URL=http://localhost:5173
```

### 3. Server Installation & Bootup
```bash
cd server
npm install
npm run dev
```
The backend server will run on `http://localhost:5000` and output terminal logs.

### 4. Client Installation & Bootup
Open another terminal in the root directory:
```bash
cd client
npm install
npm run dev
```
The React frontend dev server will launch on `http://localhost:5173`. Vite will automatically proxy all API and deployment routes directly to the backend on port `5000`.

---

## 🛡️ SECURITY IMPLEMENTATIONS

WebHoster implements multi-layer production-grade security filters:

1. **ZIP Slip Path Traversal Attack Defense**:
   When extracting, each ZIP entry's target path is fully resolved in the operating system:
   `resolvedPath.startsWith(resolvedBaseDir)`.
   If a file attempts to escape utilizing `../` traversals, extraction is instantly aborted, the partial folder is wiped from the disk, and a `400 Bad Request` security exception is returned.
2. **Prohibited Executable Upload Filters**:
   File types matching dangerous executable formats (e.g. `.exe`, `.bat`, `.cmd`, `.sh`, `.php`, `.asp`, `.jsp`, `.htpasswd`) are filtered and rejected to prevent execution inside the container space.
3. **MIME Verification & Size Boundaries**:
   Only standard ZIP compressed formats are accepted, and uploads are strictly restricted to **20MB** inside Multer.
4. **Sandboxed Static Site Serving (CSP)**:
   Deployed sites are served with restrictive `Content-Security-Policy` and sandboxing headers. This prevents deployed user-code from accessing cookies/localStorage belonging to the parent dashboard domain.
5. **Rate Limiting Protection**:
   Protects server ports against spam/DoS attacks. Global API is limited to 200 requests/15min, and ZIP deployment is throttled to 15 actions/15min per IP.

---

## 🌐 STATIC SERVING ENGINE

Relative path asset loading (nested folders, CSS links, images, script files) is notoriously complex in dynamic static servers. WebHoster resolves this perfectly via two core engineering designs:

1. **Automatic Trailing-Slash Redirect Middleware**:
   When a user requests `/p/abc123` (no trailing slash), the browser context will resolve relative assets relative to `/p/` (which fails). The middleware automatically redirects this to `/p/abc123/` with a standard redirect.
2. **Entrypoint Fallback Path Resolution**:
   Static files are first resolved relative to the deployment root directory (`deployments/abc123/*`). If a user ZIPs an outer folder (meaning `index.html` is nested at `deployments/abc123/my-folder/index.html`), the middleware dynamically intercepts relative requests and falls back to looking relative to the parent folder of `index.html`. This **guarantees** relative asset pathways never break!

---

## 🚀 SCALING RECOMMENDATIONS FOR PRODUCTION

To scale this to millions of deployments under heavy production traffic:

1. **Distributed Object Storage (Amazon S3 / Google Cloud Storage)**:
   Instead of storing deployments locally under `/deployments`, store extracted static resources directly inside an S3 bucket.
2. **CDN Assets Serving (Cloudflare / CloudFront)**:
   Point a wildcard domain routing to the S3 bucket via CDN. The CDN caches all static resources (HTML, CSS, images) edge-wide, ensuring instantaneous asset delivery worldwide and offloading 99% of requests from the core servers.
3. **Queueing System for Safe Extract (BullMQ + Redis)**:
   Large ZIP uploads and extractions can block the main single-threaded Node.js event loop. Moving extraction tasks to background workers utilizing a Redis-backed queue prevents event loop lag.
4. **Serverless Static Handlers (Vercel Functions / AWS Lambda)**:
   Deploy an edge middleware function to handle wildcard domains (e.g. `*.yourdomain.com`) and fetch assets dynamically from cloud storage in milliseconds.
