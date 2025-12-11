# FancyListener

> A globally installable CLI tool for capturing and analyzing postMessage listeners detected by the FancyTracker browser extension.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js Version](https://img.shields.io/badge/node-%3E%3D14.0.0-brightgreen)](https://nodejs.org/)

FancyListener is a security research tool that provides a real-time web dashboard for reviewing and auditing postMessage listeners found on web applications. It's designed to work seamlessly with the [FancyTracker browser extension](https://github.com/Zeetaz/FancyTracker-FF) for comprehensive security analysis.

## ✨ Features

- **🖥️ Global CLI Tool** - Install once, use anywhere with the `fancylistener` command
- **📂 Flexible Output** - Specify custom output directory for listener logs
- **🔌 Custom Port** - Optional port configuration for multiple instances
- **📊 Real-time Dashboard** - Beautiful web interface for viewing listeners
- **💾 Persistent Storage** - All listeners saved to JSON file
- **🔒 Security Audit Export** - Export listeners for analysis with security tools
- **📝 Live Logging** - Console displays each listener as it's detected
- **🔄 Auto-refresh** - Dashboard updates every 30 seconds

## 🚀 Installation

### Prerequisites

- **Node.js** v14 or higher
- **npm** (comes with Node.js)

### Global Installation

```bash
# Clone the repository
git clone https://github.com/synackchoo/FancyListener.git
cd FancyListener

# Install dependencies
npm install

# Install globally (requires sudo/admin privileges)
sudo npm install -g .

# Or use npm link
sudo npm link
```

After installation, the `fancylistener` command will be available system-wide.

## 📖 Usage

### Basic Usage

```bash
# Start server with output directory (required)
fancylistener -o ./logs
```

### Advanced Usage

```bash
# Run on custom port
fancylistener -o ./logs -p 8080

# Use absolute path
fancylistener -o /var/log/fancylistener -p 3000

# Run in specific directory
cd /path/to/project
fancylistener -o ./listener-data
```

### Command Options

| Option | Required | Description | Default |
|--------|----------|-------------|---------|
| `-o <directory>` | ✅ Yes | Directory where `listeners.json` will be saved | N/A |
| `-p <port>` | ❌ No | Port to listen on | 3000 |

### Example Output

```
============================================================
FancyListener Server
============================================================
Port: 3000
Output directory: /home/user/logs
Listeners file: /home/user/logs/listeners.json
============================================================
Server running on: http://localhost:3000
API endpoint: http://localhost:3000/api/listeners
Web interface: http://localhost:3000
============================================================
Configure FancyTracker extension to use:
  http://localhost:3000/api/listeners
============================================================
Waiting for listeners...

[12/11/2025, 4:30:15 PM] Listener detected: example.com | https://example.com/page
[12/11/2025, 4:31:22 PM] Listener detected: test.com | https://test.com/app
```

## ⚙️ Configuration

### Configuring FancyTracker Extension

1. Open the FancyTracker browser extension popup
2. Click the **Settings** button (⚙️ gear icon)
3. Scroll to the **External Logging** section
4. Enter the logging URL: `http://localhost:3000/api/listeners` (adjust port if needed)
5. Click **Save**

The extension will now send all detected postMessage listeners to your FancyListener server.

## 🎨 Web Dashboard

Access the dashboard by opening `http://localhost:3000` (or your custom port) in your browser.

### Dashboard Features

#### Statistics Bar
- **Total Listeners** - Total number of logged listeners
- **Unique Domains** - Number of unique domains detected
- **Unique URLs** - Number of unique parent URLs
- **Last Hour** - Number of listeners detected in the last hour

#### Controls
- **Group By** - Organize listeners by:
  - Domain
  - Parent URL
  - Time (newest first)
- **Filter** - Real-time search through all listener data
- **Refresh** - Manually refresh the listener data
- **Export for Audit** - Download all listeners in JSON format
- **Clear All** - Delete all logged listeners (requires confirmation)

#### Listener Cards

Each listener card displays:
- 🌐 **Domain** and **Parent URL**
- ⏰ **Timestamp** of detection
- 💻 **Complete listener code** (syntax highlighted)
- 📚 **Stack trace** (expandable)
- 🔀 **Hops information** (if cross-domain)
- 🗑️ **Delete button** for individual removal

## 🔌 API Endpoints

FancyListener exposes a RESTful API for programmatic access:

### POST `/api/listeners`

Receive listener data from FancyTracker extension.

**Request Body:**
```json
{
  "listener": "function(e){...}",
  "domain": "example.com",
  "parent_url": "https://example.com/page",
  "stack": "...",
  "fullstack": [...],
  "hops": "..."
}
```

**Response:**
```json
{
  "success": true,
  "message": "Listener logged successfully"
}
```

### GET `/api/listeners`

Returns all logged listeners as JSON array.

### GET `/api/listeners/grouped`

Returns listeners grouped by domain.

### GET `/api/stats`

Returns statistics about logged listeners.

**Response:**
```json
{
  "total": 42,
  "byDomain": { "example.com": 10, "test.com": 5 },
  "byParentUrl": { "https://example.com/page": 10 },
  "recentCount": 15
}
```

### GET `/api/export/audit`

Downloads all listeners in audit-ready JSON format.

### DELETE `/api/listeners`

Clears all logged listeners.

### DELETE `/api/listeners/:id`

Deletes a specific listener by ID.

## 🔧 Development

### Project Structure

```
FancyListener/
├── cli.js              # CLI entry point with argument parsing
├── server.js           # Express server and API logic
├── package.json        # Package configuration and dependencies
├── public/
│   ├── index.html     # Dashboard HTML structure
│   ├── app.js         # Dashboard client-side JavaScript
│   └── style.css      # Dashboard styling
├── README.md          # This file
└── CLAUDE.md          # Development guide for AI assistants
```

### Running Without Global Install

```bash
# From the project directory
./cli.js -o ./logs

# Or with node directly
node cli.js -o ./logs -p 8080
```

## 📊 Data Format

### Listener Object Structure

```json
{
  "listener": "function(e){console.log(e.data)}",
  "domain": "example.com",
  "parent_url": "https://example.com/page",
  "stack": "at HTMLDocument.<anonymous> (https://example.com/script.js:123:45)",
  "fullstack": ["line1", "line2", "..."],
  "hops": "domain1.com -> domain2.com",
  "timestamp": "2025-12-11T16:30:00.000Z",
  "id": 1765404027464.5425
}
```

### Audit Export Format

```json
{
  "generatedAt": "2025-12-11T16:30:00.000Z",
  "summary": {
    "totalListeners": 42,
    "uniqueDomains": 5,
    "uniqueParentUrls": 12
  },
  "listeners": [...]
}
```

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

### Development Guidelines

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Credits

- Based on the original [postMessage-tracker](https://github.com/fransr/postMessage-tracker) by Frans Rosén
- Part of the [FancyTracker](https://github.com/fransr/postMessage-tracker) project ecosystem

## 🔗 Related Projects

- [FancyTracker Browser Extension](https://github.com/fransr/postMessage-tracker) - Browser extension for detecting postMessage listeners

## 📬 Support

- 🐛 **Bug Reports**: [GitHub Issues](https://github.com/synackchoo/FancyListener/issues)
- 💡 **Feature Requests**: [GitHub Issues](https://github.com/synackchoo/FancyListener/issues)
- 📖 **Documentation**: This README and [CLAUDE.md](CLAUDE.md)

---

**Made with ❤️ for security researchers**
