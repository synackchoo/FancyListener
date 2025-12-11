#!/usr/bin/env node

const path = require('path');
const fs = require('fs');

// Parse command line arguments
const args = process.argv.slice(2);
let port = 3000;
let outputPath = null;

// Show usage if no arguments provided
if (args.length === 0) {
    console.error('Usage: fancylistener -o <output-directory> [-p <port>]');
    console.error('');
    console.error('Options:');
    console.error('  -o <output-directory>  Required. Directory where listeners.json will be saved');
    console.error('  -p <port>              Optional. Port to listen on (default: 3000)');
    console.error('');
    console.error('Example:');
    console.error('  fancylistener -o ./logs');
    console.error('  fancylistener -o /var/log/fancylistener -p 8080');
    process.exit(1);
}

// Parse arguments
for (let i = 0; i < args.length; i++) {
    if (args[i] === '-p' && i + 1 < args.length) {
        port = parseInt(args[i + 1], 10);
        if (isNaN(port) || port < 1 || port > 65535) {
            console.error('Error: Invalid port number. Must be between 1 and 65535.');
            process.exit(1);
        }
        i++; // Skip next argument
    } else if (args[i] === '-o' && i + 1 < args.length) {
        outputPath = args[i + 1];
        i++; // Skip next argument
    }
}

// Validate required output path
if (!outputPath) {
    console.error('Error: Output directory (-o) is required.');
    console.error('Usage: fancylistener -o <output-directory> [-p <port>]');
    process.exit(1);
}

// Security check: Validate path before resolution
const originalPath = outputPath;
if (originalPath.includes('~')) {
    console.error('Error: Output path contains invalid characters');
    process.exit(1);
}

// Convert to absolute path and normalize
outputPath = path.resolve(path.normalize(outputPath));

// Additional security: Ensure resolved path doesn't escape expected boundaries
// This catches attempts like ../../etc/passwd after normalization
const cwd = process.cwd();
if (!outputPath.startsWith('/') && !outputPath.startsWith(cwd)) {
    console.error('Error: Output path is outside allowed directories');
    process.exit(1);
}

// Create output directory if it doesn't exist
try {
    if (!fs.existsSync(outputPath)) {
        fs.mkdirSync(outputPath, { recursive: true });
        console.log(`Created output directory: ${outputPath}`);
    }
} catch (error) {
    console.error(`Error: Unable to create output directory: ${error.message}`);
    process.exit(1);
}

// Verify we can write to the directory
try {
    const testFile = path.join(outputPath, '.write-test');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
} catch (error) {
    console.error(`Error: Output directory is not writable: ${error.message}`);
    process.exit(1);
}

// Set environment variables for the server
process.env.PORT = port.toString();
process.env.OUTPUT_PATH = outputPath;

// Start the server
require('./server.js');
