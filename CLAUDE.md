# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

FancyListener is a globally installable CLI tool built on Express.js that receives and displays postMessage listeners detected by the FancyTracker browser extension. It provides a real-time dashboard for security researchers to analyze and audit postMessage listeners found on web applications.

## Key Commands

```bash
# Install dependencies
npm install

# Install globally (makes 'fancylistener' command available system-wide)
npm install -g .
# Or from the package directory:
npm link

# Run the CLI tool (output directory is required)
fancylistener -o <output-directory>

# Run with custom port
fancylistener -o ./logs -p 8080

# Run with absolute path
fancylistener -o /var/log/fancylistener -p 3000

# Development: Run server directly (legacy method)
node server.js
```

## Architecture

### CLI Entry Point (cli.js)

The CLI entry point handles argument parsing and validation:

- **Argument Parsing**: Manually parses `-o` (required output directory) and `-p` (optional port)
- **Directory Setup**: Creates output directory if it doesn't exist, validates write permissions
- **Environment Variables**: Sets `OUTPUT_PATH` and `PORT` environment variables for server.js
- **Error Handling**: Validates port ranges (1-65535) and directory writability before starting server

### Backend (server.js)

The server is a simple Express application with in-memory storage backed by file persistence:

- **Data Storage**: All listeners are stored in `listeners` array in memory and persisted to `listeners.json` on disk
- **Output Location**: Uses `OUTPUT_PATH` environment variable (set by CLI) to determine where to save `listeners.json`
- **File I/O**: Uses synchronous file operations (`fs.readFileSync`, `fs.writeFileSync`) for persistence
- **Initialization**: Loads existing listeners from `listeners.json` on startup via `loadListeners()`
- **Persistence Pattern**: Every mutation operation (POST, DELETE) calls `saveListeners()` to write to disk
- **Logging**: Console logs each detected listener with timestamp, domain, and URL

### API Endpoints

The server exposes a RESTful API:

- `POST /api/listeners` - Receives listener data from FancyTracker extension, adds timestamp and ID
- `GET /api/listeners` - Returns raw array of all listeners
- `GET /api/listeners/grouped` - Returns listeners grouped by domain
- `GET /api/stats` - Returns statistics (total count, unique domains/URLs, last hour activity)
- `GET /api/export/audit` - Downloads all listeners in audit-ready JSON format
- `DELETE /api/listeners` - Clears all listeners
- `DELETE /api/listeners/:id` - Deletes specific listener by ID

### Frontend (public/)

A vanilla JavaScript single-page application with no framework dependencies:

- **State Management**: Client-side state in `allListeners` (raw data) and `filteredListeners` (after filter applied)
- **Rendering**: Manual DOM manipulation using template strings and `innerHTML`
- **Grouping Logic**: Implemented in `groupListeners()` function, supports grouping by domain, parent_url, or timestamp
- **Filter Implementation**: Simple substring search across JSON-stringified listener objects
- **Auto-refresh**: Polls `/api/listeners` every 30 seconds via `setInterval`
- **Code Display**: Uses HTML escaping via `escapeHtml()` to safely display potentially malicious listener code

### Data Structure

Each listener object contains:
```javascript
{
  listener: "function(e){...}",      // JavaScript code string
  domain: "example.com",             // Domain where listener was found
  parent_url: "https://...",         // Full URL of parent page
  stack: "at HTMLDocument...",       // Short stack trace
  fullstack: ["line1", "line2"],     // Full stack trace as array
  hops: "domain1 -> domain2",        // Cross-domain hop chain (if applicable)
  timestamp: "2024-01-01T12:00:00Z", // ISO 8601 timestamp (added by server)
  id: 1704110400000.123              // Unique ID (timestamp + random, added by server)
}
```

## Integration with FancyTracker

This server is designed to work with the FancyTracker browser extension (separate project):
- Extension POSTs listener data to `/api/listeners` endpoint
- Extension must be configured with the logging URL (e.g., `http://localhost:3000/api/listeners`)

## Security Audit Workflow

The primary use case is security research and vulnerability discovery:

1. User browses websites with FancyTracker extension active
2. Extension sends detected postMessage listeners to this server
3. User reviews listeners via web dashboard
4. User exports data via "Export for Audit" button
5. Exported JSON can be analyzed with Claude Code's web-security-auditor agent

The export format includes a summary section with metadata and a complete listeners array for automated analysis.

## File Locations

- `cli.js` - CLI entry point with argument parsing (executable via shebang)
- `server.js` - Express server and API logic
- `public/index.html` - Dashboard HTML structure
- `public/app.js` - Dashboard client-side JavaScript logic
- `public/style.css` - Dashboard styling
- `listeners.json` - Persistent storage file (auto-created in output directory)

## Implementation Notes

- No database: All data stored in memory + JSON file
- No authentication: Intended for local use only
- No HTTPS: Runs on HTTP (not intended for production)
- Single-user: No multi-user support or session management
- Synchronous file I/O: Uses blocking file operations (acceptable for local tool)
- Client-side filtering: All listeners loaded to client, filtering happens in browser
