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
const pageLayout = (title, body) => `
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
        height: 100vh;
        margin: 0;
      }
      .container {
        background-color: #fff;
        padding: 40px;
        border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.1);
        text-align: center;
        max-width: 500px;
        width: 90%;
      }
      h1 {
        color: #1a1a1a;
        margin-bottom: 1rem;
      }
      p {
        color: #555;
        line-height: 1.6;
      }
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
      }
      .button:hover {
        background-color: #0056b3;
      }
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
      .logout-options label {
        margin-left: 8px;
        font-size: 0.9rem;
        color: #495057;
      }
      code {
        background-color: #e0e0e0;
        padding: 2px 5px;
        border-radius: 3px;
        font-family: "SFMono-Regular", Consolas, "Liberation Mono", Menlo, Courier, monospace;
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

// 1. Login route to simulate starting an authentication flow
app.get('/login', (req, res) => {
  res.redirect('/callback');
});

// 2. Mock auth callback to establish the user session
app.get('/callback', (req, res) => {
  req.session.user = { id: 1, name: 'Test User' };
  res.redirect('/');
});

// 3. Main page that demonstrates the Critical-CH mechanism
app.get('/', (req, res) => {
  if (req.session.user) {
    // If the user is logged in, show instructions for observing the CH flow
    const loggedInBody = `
      <h1>Welcome, ${req.session.user.name}!</h1>
      <p>You are now logged in.</p>
      <div class="info">
        <p><strong>How to Observe the Flow:</strong></p>
        <p>This page has sent <code>Critical-CH</code> headers. If your browser didn't send the required hints on the first request, it will re-request the page with the hints. This is often visible as a <strong>307 Internal Redirect</strong> in the Network tab.</p>
      </div>
      <form action="/logout" method="get">
        <div class="logout-options">
          <input type="checkbox" id="clear-hints" name="clear_hints" value="true" checked>
          <label for="clear-hints">Clear Client Hints cache on logout</label>
        </div>
        <button type="submit" class="button">Log Out & Try Again</button>
      </form>
    `;
    res.setHeader('Accept-CH', 'Viewport-Width');
    res.setHeader('Critical-CH', 'Viewport-Width');
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
    // Conditionally clear the client hints cache based on the checkbox
    if (req.query.clear_hints === 'true') {
      res.setHeader('Clear-Site-Data', '"clientHints"');
    }
    res.redirect('/');
  });
});

app.listen(port, () => {
  console.log(`Critical-CH use case demo server running at http://localhost:${port}`);
});