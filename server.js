const express = require('express');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Security: Disable X-Powered-By header
app.disable('x-powered-by');

// Middleware
app.use(express.json({
    limit: '10mb',  // Reduced from 50mb to prevent DoS
    strict: true    // Only parse arrays and objects
}));
app.use(express.static(path.join(__dirname, 'public')));

// Data storage
let listeners = [];
const OUTPUT_PATH = process.env.OUTPUT_PATH || __dirname;
const LOG_FILE = path.join(OUTPUT_PATH, 'listeners.json');

// Load existing listeners from file
function loadListeners() {
    try {
        if (fs.existsSync(LOG_FILE)) {
            const data = fs.readFileSync(LOG_FILE, 'utf8');
            listeners = JSON.parse(data);
            console.log(`Loaded ${listeners.length} existing listeners from file`);
        }
    } catch (error) {
        console.error('Error loading listeners:', error);
        listeners = [];
    }
}

// Save listeners to file
function saveListeners() {
    try {
        fs.writeFileSync(LOG_FILE, JSON.stringify(listeners, null, 2), 'utf8');
    } catch (error) {
        console.error('Error saving listeners:', error);
    }
}

// Initialize
loadListeners();

// API endpoint to receive listeners from FancyTracker
app.post('/api/listeners', (req, res) => {
    try {
        // Validate and sanitize input to prevent prototype pollution
        const body = req.body || {};

        // Only extract expected fields, ignore __proto__, constructor, prototype
        const listener = {
            listener: typeof body.listener === 'string' ? body.listener : '',
            domain: typeof body.domain === 'string' ? body.domain : '',
            parent_url: typeof body.parent_url === 'string' ? body.parent_url : '',
            stack: typeof body.stack === 'string' ? body.stack : '',
            fullstack: Array.isArray(body.fullstack) ? body.fullstack : [],
            hops: typeof body.hops === 'string' ? body.hops : '',
            timestamp: new Date().toISOString(),
            id: Date.now() + Math.random()
        };

        listeners.push(listener);
        saveListeners();

        const timestamp = new Date().toLocaleString();
        console.log(`[${timestamp}] Listener detected: ${listener.domain || 'unknown domain'} | ${listener.parent_url || 'unknown URL'}`);
        res.json({ success: true, message: 'Listener logged successfully' });
    } catch (error) {
        console.error('Error logging listener:', error);
        res.status(500).json({ success: false, error: 'Internal server error' });
    }
});

// API endpoint to get all listeners
app.get('/api/listeners', (req, res) => {
    res.json(listeners);
});

// API endpoint to get listeners grouped by domain
app.get('/api/listeners/grouped', (req, res) => {
    const grouped = {};

    listeners.forEach(listener => {
        const domain = listener.domain || 'unknown';
        if (!grouped[domain]) {
            grouped[domain] = [];
        }
        grouped[domain].push(listener);
    });

    res.json(grouped);
});

// API endpoint to get listener statistics
app.get('/api/stats', (req, res) => {
    const stats = {
        total: listeners.length,
        byDomain: {},
        byParentUrl: {},
        recentCount: 0
    };

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    listeners.forEach(listener => {
        // Count by domain
        const domain = listener.domain || 'unknown';
        stats.byDomain[domain] = (stats.byDomain[domain] || 0) + 1;

        // Count by parent URL
        const parentUrl = listener.parent_url || 'unknown';
        stats.byParentUrl[parentUrl] = (stats.byParentUrl[parentUrl] || 0) + 1;

        // Count recent (last hour)
        if (listener.timestamp && new Date(listener.timestamp) > oneHourAgo) {
            stats.recentCount++;
        }
    });

    res.json(stats);
});

// API endpoint to export listeners in format suitable for web-security-auditor
app.get('/api/export/audit', (req, res) => {
    const auditReport = {
        generatedAt: new Date().toISOString(),
        summary: {
            totalListeners: listeners.length,
            uniqueDomains: [...new Set(listeners.map(l => l.domain || 'unknown'))].length,
            uniqueParentUrls: [...new Set(listeners.map(l => l.parent_url || 'unknown'))].length
        },
        listeners: listeners.map(l => ({
            timestamp: l.timestamp,
            domain: l.domain,
            parentUrl: l.parent_url,
            listenerCode: l.listener,
            stack: l.stack,
            fullStack: l.fullstack,
            hops: l.hops,
            id: l.id
        }))
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename=fancytracker-audit.json');
    res.json(auditReport);
});

// API endpoint to clear all listeners
app.delete('/api/listeners', (req, res) => {
    const count = listeners.length;
    listeners = [];
    saveListeners();
    res.json({ success: true, message: `Cleared ${count} listeners` });
});

// API endpoint to delete specific listener
app.delete('/api/listeners/:id', (req, res) => {
    const id = parseFloat(req.params.id);

    // Validate ID is a valid number
    if (isNaN(id) || !isFinite(id)) {
        return res.status(400).json({ success: false, message: 'Invalid ID' });
    }

    const initialLength = listeners.length;
    listeners = listeners.filter(l => l.id !== id);

    if (listeners.length < initialLength) {
        saveListeners();
        res.json({ success: true, message: 'Listener deleted' });
    } else {
        res.status(404).json({ success: false, message: 'Listener not found' });
    }
});

// Start server
app.listen(PORT, () => {
    console.log('='.repeat(60));
    console.log('FancyListener Server');
    console.log('='.repeat(60));
    console.log(`Port: ${PORT}`);
    console.log(`Output directory: ${OUTPUT_PATH}`);
    console.log(`Listeners file: ${LOG_FILE}`);
    console.log('='.repeat(60));
    console.log(`Server running on: http://localhost:${PORT}`);
    console.log(`API endpoint: http://localhost:${PORT}/api/listeners`);
    console.log(`Web interface: http://localhost:${PORT}`);
    console.log('='.repeat(60));
    console.log('Configure FancyTracker extension to use:');
    console.log(`  http://localhost:${PORT}/api/listeners`);
    console.log('='.repeat(60));
    console.log('Waiting for listeners...');
    console.log('');
});
