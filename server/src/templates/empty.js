module.exports = function getEmptyTemplate(projectName) {
  return {
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
};
