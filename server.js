
const express = require('express');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const app = express();
const port = 3000;

// Middleware setup
app.use(cookieParser());
app.use(session({
  secret: 'a-very-secret-key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // For production, use: secure: true
}));

// --- HTML and CSS for the page layout ---
const pageLayout = (title, body = []) => `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
      body {
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
        background-color: #f4f7f6;
        color: #333;
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        margin: 0;
        padding: 2rem 0;
      }
      .container {
        background-color: #fff;
        padding: 40px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        text-align: center;
        max-width: 800px;
        width: 90%;
      }
      h1 { color: #1a1a1a; margin-bottom: 1rem; }
      p { color: #555; line-height: 1.6; }
      .button {
        display: inline-block;
        background-color: #007bff;
        color: #fff;
        padding: 12px 24px;
        margin-top: 20px;
        text-decoration: none;
        border-radius: 5px;
        font-weight: bold;
        transition: background-color 0.2s;
        border: none;
        cursor: pointer;
        font-size: 1rem;
      }
      .button:hover { background-color: #0056b3; }
      .info {
        background-color: #e9f5ff;
        border-left: 4px solid #007bff;
        padding: 15px;
        margin-top: 25px;
        text-align: left;
        border-radius: 4px;
      }
      .logout-options {
        margin-top: 25px;
        padding: 15px;
        background-color: #f8f9fa;
        border: 1px solid #dee2e6;
        border-radius: 5px;
        display: flex;
        justify-content: center;
        align-items: center;
      }
      .logout-options label { margin-left: 8px; font-size: 0.9rem; color: #495057; }
      code {
        background-color: #e0e0e0;
        padding: 2px 5px;
        border-radius: 3px;
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
      }
      .headers-container {
        margin-top: 2rem;
        text-align: left;
      }
      .headers-container h2 {
        border-bottom: 2px solid #eee;
        padding-bottom: 0.5rem;
        margin-bottom: 1rem;
      }
      .headers-box {
        background-color: #2d2d2d;
        color: #f1f1f1;
        padding: 1rem;
        border-radius: 5px;
        max-height: 300px;
        overflow-y: auto;
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
        font-size: 0.85rem;
        white-space: pre;
      }
    </style>
  </head>
  <body>
    <div class="container">
      ${body}
    </div>
  </body>
  </html>
`;

// Helper to escape HTML entities for safe rendering
const escapeHtml = (unsafe) => {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

// 1. Login route to simulate starting an authentication flow
app.get('/login', (req, res) => {
  const log = (msg) => {
    console.log(msg);
    // Ensure logs array exists if the session is old
    if (!req.session.logs) req.session.logs = [];
    req.session.logs.push(msg);
  };

  log('\n--- [Request to /login] ---');
  log(`Incoming Cookie Header: ${req.headers.cookie || 'None'}`);

  res.redirect('/callback');
});

// 2. Mock auth callback to establish the user session
app.get('/callback', (req, res) => {
  const log = (msg) => {
    console.log(msg);
    // Ensure logs array exists if the session is old
    if (!req.session.logs) req.session.logs = [];
    req.session.logs.push(msg);
  };

  log('\n--- [Request to /callback] ---');
  log(`Incoming Cookie Header: ${req.headers.cookie || 'None'}`);

  req.session.user = { id: 1, name: 'Test User' };
  // Set a separate, explicit cookie to demonstrate the behavior                                                                                                                                 │
  // is not specific to session cookies.                                                                                                                                       │
  res.cookie('Demo-Cookie', 'Set-During-Callback', { httpOnly: true });

  log('Action: Set session cookie (connect.sid) and Demo-Cookie.');
  log('Outgoing: Redirecting to /');
  res.redirect('/');
});

// 3. Main page that demonstrates the Critical-CH mechanism
app.get('/', (req, res) => {
  const log = (msg) => {
    console.log(msg);
    if (!req.session.logs) req.session.logs = [];
    req.session.logs.push(msg);
  };

  log('\n--- [Request to /] ---');
  log(`Incoming Cookie Header: ${req.headers.cookie || 'None'}`);

  if (req.session.user) {
    // Set Client-Hint headers
    res.setHeader('Accept-CH', 'Viewport-Width');
    res.setHeader('Critical-CH', 'Viewport-Width');

    // Prepare headers and logs for display
    const requestHeaders = JSON.stringify(req.headers, null, 2);
    const responseHeaders = JSON.stringify(res.getHeaders(), null, 2);
    const logTrace = escapeHtml(req.session.logs.join('\n'));

    const loggedInBody = `
      <h1>Welcome, ${req.session.user.name}!</h1>
      <p>You are now logged in.</p>
      <div class="info">
        <p><strong>How to Observe the Flow:</strong></p>
        <p>This page sends <code>Critical-CH</code> headers. The headers below show a server-side view of the request and response, which is more reliable than browser devtools for cached requests.</p>
        <p>The full server-side log trace for this session and the final request's headers are displayed below.</p>
      </div>

      <div class="headers-container">
        <h2>Request Headers Received by Server (Final Request)</h2>
        <div class="headers-box">${requestHeaders}</div>

        <h2>Response Headers Sent by Server (Final Request)</h2>
        <div class="headers-box">${responseHeaders}</div>
      </div>

      <div class="headers-container">
        <h2>Full Server-Side Log Trace</h2>
        <div class="headers-box">${logTrace}</div>
      </div>

      <form action="/logout" method="get">
        <div class="logout-options">
          <input type="checkbox" id="clear-hints" name="clear_hints" value="true" checked>
          <label for="clear-hints">Clear Client Hints cache and Cookies on logout</label>
        </div>
        <button type="submit" class="button">Log Out & Try Again</button>
      </form>
    `;
    res.send(pageLayout('Critical-CH Demo - Logged In', loggedInBody));
  } else {
    // If not logged in, show the main welcome page
    const loggedOutBody = `
      <h1>Critical-CH Use Case</h1>
      <p>This is a demonstration of how <code>Critical-CH</code> headers work within a user session flow. Click the button to log in and see the mechanism in action.</p>
      <a href="/login" class="button">Start Demo</a>
    `;
    res.send(pageLayout('Critical-CH Use Case Demo', loggedOutBody));
  }
});

// 4. Logout route to destroy the session
app.get('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.redirect('/');
    }
    res.clearCookie('connect.sid');
    // Conditionally clear the client hints cache and cookies based on the checkbox
    if (req.query.clear_hints === 'true') {
      res.setHeader('Clear-Site-Data', '"clientHints", "cookies"');
    }
    res.redirect('/');
  });
});

app.listen(port, () => {
  console.log(`Critical-CH use case demo server running at http://localhost:${port}`);
});