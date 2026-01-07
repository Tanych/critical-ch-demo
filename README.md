# Critical-CH Use Case Demonstration

This project is a demonstration of how to use `Critical-CH` (Critical Client Hints) headers within a standard web authentication flow. It provides a clear, minimal example of how a server can request specific client hints and ensure they are provided on subsequent requests.

## What are Critical Client Hints?

Client Hints allow a server to request specific information from the client (browser) about the device, network, or user agent. This is useful for content negotiation and performance optimization (e.g., serving different image sizes based on the viewport width).

When a hint is designated as "critical" using the `Critical-CH` header, the browser understands that the server needs this information to render the page correctly. If the browser doesn't have the requested hint, it will re-request the page, adding the required hint to the new request's headers. This re-request is often implemented as a `307 Internal Redirect`.

This demo showcases that exact mechanism in the context of a user session.

## Features

-   A simple Node.js Express server.
-   A mock user login/logout flow using sessions.
-   A main page that sends `Accept-CH` and `Critical-CH` headers.
-   A user-friendly interface for observing the behavior.
-   An option to clear the browser's client hints cache on logout for reliable, repeatable testing.

## How to Run the Demo

1.  **Prerequisites:** You need to have [Node.js](https://nodejs.org/) and npm installed.

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the server:**
    ```bash
    node index.js
    ```

4.  **Open your browser:** Navigate to `http://localhost:3000`.

## How to Observe the `Critical-CH` Flow

1.  **Open Developer Tools:** Before starting, open your browser's developer tools and go to the **Network** tab. This is essential for observing the headers and any redirects.

2.  **Start the Login Flow:** Click the "Start Login Test" button.

3.  **Authentication:** The server will simulate a login, set a session cookie, and redirect you back to the main page.

4.  **Observe the `Critical-CH` Request:** When the main page (`/`) loads for the first time, it will respond with `Critical-CH: Viewport-Width`.
    -   If the browser did not send the `Viewport-Width` header on the initial request, it will now stop, create a new request for the same URL (`/`), add the `Viewport-Width` header, and send it.
    -   In the Network tab, you can observe this as a **307 Internal Redirect**. This is the expected mechanism for `Critical-CH`.
    -   You can inspect the headers of both the original request and the redirected request to see how the `Cookie` and `Viewport-Width` headers are handled by the browser.

5.  **Log Out:** Use the "Log Out" button to end the session. The "Clear Client Hints cache on logout" checkbox (enabled by default) sends a `Clear-Site-Data: "clientHints"` header. This is useful because browsers will cache client hint preferences, and clearing them allows you to reliably observe the initial 307 redirect flow on every test.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.