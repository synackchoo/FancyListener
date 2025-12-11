let allListeners = [];
let filteredListeners = [];
let groupBy = 'domain';
let filterText = '';

// DOM elements
const refreshBtn = document.getElementById('refresh-btn');
const exportBtn = document.getElementById('export-btn');
const clearBtn = document.getElementById('clear-btn');
const groupBySelect = document.getElementById('group-by');
const filterInput = document.getElementById('filter-input');
const listenersContainer = document.getElementById('listeners-container');

// Stats elements
const statTotal = document.getElementById('stat-total');
const statDomains = document.getElementById('stat-domains');
const statUrls = document.getElementById('stat-urls');
const statRecent = document.getElementById('stat-recent');

// Event listeners
refreshBtn.addEventListener('click', loadListeners);
exportBtn.addEventListener('click', exportForAudit);
clearBtn.addEventListener('click', clearAllListeners);
groupBySelect.addEventListener('change', (e) => {
    groupBy = e.target.value;
    renderListeners();
});
filterInput.addEventListener('input', (e) => {
    filterText = e.target.value.toLowerCase();
    applyFilter();
    renderListeners();
});

// Load listeners from server
async function loadListeners() {
    try {
        const response = await fetch('/api/listeners');
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        allListeners = await response.json();
        applyFilter();
        await loadStats();
        renderListeners();
    } catch (error) {
        console.error('Error loading listeners:', error);
        showError('Failed to load listeners');
    }
}

// Load statistics
async function loadStats() {
    try {
        const response = await fetch('/api/stats');
        const stats = await response.json();

        statTotal.textContent = stats.total;
        statDomains.textContent = Object.keys(stats.byDomain).length;
        statUrls.textContent = Object.keys(stats.byParentUrl).length;
        statRecent.textContent = stats.recentCount;
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Apply filter
function applyFilter() {
    if (!filterText) {
        filteredListeners = allListeners;
        return;
    }

    // Prevent ReDoS by limiting filter text length
    const safeFilterText = filterText.slice(0, 100);

    filteredListeners = allListeners.filter(listener => {
        // Search only in safe, relevant fields instead of JSON.stringify
        const searchableText = [
            listener.domain || '',
            listener.parent_url || '',
            listener.listener || '',
            listener.hops || ''
        ].join(' ').toLowerCase();

        return searchableText.includes(safeFilterText);
    });
}

// Render listeners
function renderListeners() {
    if (filteredListeners.length === 0) {
        listenersContainer.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon">📭</div>
                <div class="empty-state-title">No Listeners Found</div>
                <div class="empty-state-text">
                    ${allListeners.length === 0
                        ? 'Configure FancyTracker extension to send logs to this server'
                        : 'No listeners match your filter criteria'}
                </div>
            </div>
        `;
        return;
    }

    const grouped = groupListeners(filteredListeners);
    let html = '';

    Object.keys(grouped).forEach(groupKey => {
        const listeners = grouped[groupKey];
        html += `
            <div class="listener-group">
                <div class="group-header" onclick="toggleGroup(this)">
                    <div class="group-title">${escapeHtml(groupKey)}</div>
                    <div class="group-count">${listeners.length} listener${listeners.length !== 1 ? 's' : ''}</div>
                </div>
                <div class="group-content">
                    ${listeners.map(listener => renderListenerCard(listener)).join('')}
                </div>
            </div>
        `;
    });

    listenersContainer.innerHTML = html;
}

// Group listeners by selected criteria
function groupListeners(listeners) {
    const grouped = {};

    listeners.forEach(listener => {
        let key;

        switch (groupBy) {
            case 'domain':
                key = listener.domain || 'Unknown Domain';
                break;
            case 'parent_url':
                key = listener.parent_url || 'Unknown URL';
                break;
            case 'timestamp':
                const date = listener.timestamp ? new Date(listener.timestamp).toLocaleDateString() : 'Unknown Date';
                key = date;
                break;
            default:
                key = 'Unknown';
        }

        if (!grouped[key]) {
            grouped[key] = [];
        }
        grouped[key].push(listener);
    });

    // Sort by timestamp if grouping by time
    if (groupBy === 'timestamp') {
        Object.keys(grouped).forEach(key => {
            grouped[key].sort((a, b) => {
                return new Date(b.timestamp) - new Date(a.timestamp);
            });
        });
    }

    return grouped;
}

// Render individual listener card
function renderListenerCard(listener) {
    const timestamp = listener.timestamp
        ? new Date(listener.timestamp).toLocaleString()
        : 'Unknown';

    const stack = listener.fullstack
        ? listener.fullstack.join('\n')
        : (listener.stack || 'No stack trace available');

    return `
        <div class="listener-card">
            <div class="listener-header">
                <div class="listener-meta">
                    <div class="listener-domain">${escapeHtml(listener.domain || 'Unknown Domain')}</div>
                    <div class="listener-url">${escapeHtml(listener.parent_url || 'Unknown URL')}</div>
                </div>
                <div class="listener-timestamp">${timestamp}</div>
            </div>

            <div class="listener-code">
                ${escapeHtml(listener.listener || 'No listener code available')}
            </div>

            ${listener.hops ? `
                <div class="listener-info">
                    <div class="info-item">
                        <div class="info-label">Hops</div>
                        <div class="info-value">${escapeHtml(listener.hops)}</div>
                    </div>
                </div>
            ` : ''}

            <details>
                <summary style="cursor: pointer; color: #888; font-size: 12px; margin: 10px 0;">
                    Stack Trace
                </summary>
                <div class="listener-stack">${escapeHtml(stack)}</div>
            </details>

            <div style="margin-top: 12px;">
                <button class="delete-btn" onclick="deleteListener(${listener.id})">Delete</button>
            </div>
        </div>
    `;
}

// Toggle group expansion
function toggleGroup(element) {
    const content = element.nextElementSibling;
    content.classList.toggle('expanded');
}

// Delete specific listener
async function deleteListener(id) {
    if (!confirm('Delete this listener?')) return;

    try {
        const response = await fetch(`/api/listeners/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            await loadListeners();
        } else {
            showError('Failed to delete listener');
        }
    } catch (error) {
        console.error('Error deleting listener:', error);
        showError('Failed to delete listener');
    }
}

// Clear all listeners
async function clearAllListeners() {
    if (!confirm('Clear all listeners? This cannot be undone.')) return;

    try {
        const response = await fetch('/api/listeners', {
            method: 'DELETE'
        });

        if (response.ok) {
            await loadListeners();
        } else {
            showError('Failed to clear listeners');
        }
    } catch (error) {
        console.error('Error clearing listeners:', error);
        showError('Failed to clear listeners');
    }
}

// Export for audit
async function exportForAudit() {
    try {
        const response = await fetch('/api/export/audit');
        const data = await response.json();

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `fancytracker-audit-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    } catch (error) {
        console.error('Error exporting audit:', error);
        showError('Failed to export audit file');
    }
}

// Utility functions
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function showError(message) {
    alert(message);
}

// Auto-refresh every 30 seconds
setInterval(loadListeners, 30000);

// Initial load
loadListeners();
