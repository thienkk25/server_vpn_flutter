const API_BASE = '/api/admin/servers';
const API_USERS = '/api/admin/users';
const API_SETTINGS = '/api/admin/settings';

// DOM Elements
const tbody = document.getElementById('serversList');
const btnRefresh = document.getElementById('btnRefresh');
const btnAddNew = document.getElementById('btnAddNew');
const btnCancelModal = document.getElementById('btnCancelModal');
const btnCloseModal = document.getElementById('btnCloseModal');
const btnConfirmDelete = document.getElementById('btnConfirmDelete');
const btnCancelDelete = document.getElementById('btnCancelDelete');
const serverModal = document.getElementById('serverModal');
const confirmModal = document.getElementById('confirmModal');
const serverForm = document.getElementById('serverForm');
const modalTitle = document.getElementById('modalTitle');
const apiKeyInput = document.getElementById('apiKey');

// SPA Nav Elements
const navItems = document.querySelectorAll('.nav-item');
const sections = document.querySelectorAll('.content-section');
const pageTitle = document.getElementById('pageTitle');
const pageSubtitle = document.getElementById('pageSubtitle');

let currentServers = [];
let deleteTargetId = null;

// Fetch wrapper with API key
async function fetchAPI(url, options = {}) {
    const key = apiKeyInput.value.trim();
    if (!key) {
        alert('Please provide an API Key in the sidebar.');
        throw new Error('No API Key');
    }
    
    const headers = {
        'Content-Type': 'application/json',
        'x-admin-key': key,
        ...(options.headers || {})
    };

    const response = await fetch(url, { ...options, headers });
    const result = await response.json();
    
    if (!response.ok) {
        throw new Error(result.message || 'API Request Failed');
    }
    return result;
}

// Load Servers
async function loadServers() {
    try {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center loading-text">Loading servers...</td></tr>';
        
        const res = await fetchAPI(API_BASE);
        currentServers = res.data || [];
        renderTable();
    } catch (error) {
        tbody.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error: ${error.message}</td></tr>`;
    }
}

// Render Table
function renderTable() {
    if (currentServers.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No servers found. Add one to get started.</td></tr>';
        return;
    }

    tbody.innerHTML = currentServers.map(server => `
        <tr>
            <td><strong>${escapeHtml(server.name)}</strong></td>
            <td>${escapeHtml(server.ip || '-')}</td>
            <td>-</td>
            <td>${server.onWireGuard === 1 ? 'WireGuard' : 'OpenVPN'}</td>
            <td><span class="status-badge ${server.status === 1 ? 'active' : 'offline'}">${server.status === 1 ? 'ACTIVE' : 'OFFLINE'}</span></td>
            <td class="text-right">
                <button class="action-btn edit" onclick="openEditModal('${server.id}')">Edit</button>
                <button class="action-btn delete" onclick="openConfirmDelete('${server.id}')">Del</button>
            </td>
        </tr>
    `).join('');
}

// CRUD Operations Modal Management
function openAddModal() {
    serverForm.reset();
    document.getElementById('serverId').value = '';
    modalTitle.textContent = 'Add New Server';
    serverModal.classList.remove('hidden');
}

function openEditModal(id) {
    const server = currentServers.find(s => s.id === id);
    if (!server) return;
    
    document.getElementById('serverId').value = server.id;
    document.getElementById('serverName').value = server.name || '';
    document.getElementById('serverHost').value = server.ip || '';
    document.getElementById('serverPort').value = '';
    document.getElementById('serverProtocol').value = server.onWireGuard === 1 ? 'WireGuard' : 'OpenVPN';
    document.getElementById('serverStatus').value = server.status === 1 ? 'active' : 'offline';
    document.getElementById('serverPassword').value = server.password || '';
    document.getElementById('serverConfig').value = server.config || '';
    
    modalTitle.textContent = 'Edit Server';
    serverModal.classList.remove('hidden');
}

function closeModal() {
    serverModal.classList.add('hidden');
}

// Handle Form Submit
serverForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btnSaveServer');
    const originalText = btn.textContent;
    btn.textContent = 'Saving...';
    btn.disabled = true;

    try {
        const id = document.getElementById('serverId').value;
        const payload = {
            name: document.getElementById('serverName').value,
            ip: document.getElementById('serverHost').value,
            status: document.getElementById('serverStatus').value === 'active' ? 1 : 0,
            onWireGuard: document.getElementById('serverProtocol').value === 'WireGuard' ? 1 : 0,
            password: document.getElementById('serverPassword').value,
            config: document.getElementById('serverConfig').value,
            version: 3,
            username: 'vpn'
        };

        if (id) {
            // Update
            await fetchAPI(`${API_BASE}/${id}`, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
        } else {
            // Create
            await fetchAPI(API_BASE, {
                method: 'POST',
                body: JSON.stringify(payload)
            });
        }
        
        closeModal();
        await loadServers();
    } catch (error) {
        alert(`Error saving server: ${error.message}`);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
});

// Auto delete flow
function openConfirmDelete(id) {
    deleteTargetId = id;
    confirmModal.classList.remove('hidden');
}

function closeConfirmDelete() {
    deleteTargetId = null;
    confirmModal.classList.add('hidden');
}

btnConfirmDelete.addEventListener('click', async () => {
    if (!deleteTargetId) return;
    
    const btn = btnConfirmDelete;
    const originalText = btn.textContent;
    btn.textContent = 'Deleting...';
    btn.disabled = true;

    try {
        await fetchAPI(`${API_BASE}/${deleteTargetId}`, {
            method: 'DELETE'
        });
        closeConfirmDelete();
        await loadServers();
    } catch (error) {
        alert(`Error deleting server: ${error.message}`);
    } finally {
        btn.textContent = originalText;
        btn.disabled = false;
    }
});

// Events
btnRefresh.addEventListener('click', loadServers);
btnAddNew.addEventListener('click', openAddModal);
btnCloseModal.addEventListener('click', closeModal);
btnCancelModal.addEventListener('click', closeModal);
btnCancelDelete.addEventListener('click', closeConfirmDelete);

// Helper for XSS
function escapeHtml(unsafe) {
    if (!unsafe) return '';
    return unsafe
         .toString()
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// Close modals on overlay click
window.addEventListener('click', (e) => {
    if (e.target === serverModal) closeModal();
    if (e.target === confirmModal) closeConfirmDelete();
});

// Update table when api key changes
let typingTimer;
apiKeyInput.addEventListener('input', () => {
    clearTimeout(typingTimer);
    typingTimer = setTimeout(loadServers, 1000); // 1s debounce
});

// Initial load SPA
document.addEventListener('DOMContentLoaded', () => {
    loadServers();
    
    // SPA Nav Logic
    navItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.preventDefault();
            navItems.forEach(n => n.classList.remove('active'));
            item.classList.add('active');
            
            const target = item.getAttribute('data-target');
            sections.forEach(s => s.classList.add('hidden'));
            document.getElementById(`section-${target}`).classList.remove('hidden');
            
            if (target === 'servers') {
                pageTitle.textContent = 'Server Management';
                pageSubtitle.textContent = 'Monitor and configure your VPN network nodes';
                btnAddNew.style.display = 'inline-flex';
                loadServers();
            } else if (target === 'users') {
                pageTitle.textContent = 'User Management';
                pageSubtitle.textContent = 'Monitor user accounts and subscriptions';
                btnAddNew.style.display = 'none';
                loadUsers();
            } else if (target === 'settings') {
                pageTitle.textContent = 'App Settings';
                pageSubtitle.textContent = 'Configure global application behavior';
                btnAddNew.style.display = 'none';
                loadSettings();
            }
        });
    });
});

// Users Logic
async function loadUsers() {
    const tbodyUsers = document.getElementById('usersList');
    try {
        tbodyUsers.innerHTML = '<tr><td colspan="6" class="text-center loading-text">Loading users...</td></tr>';
        const res = await fetchAPI(API_USERS);
        const currentUsers = res.data || [];
        
        if (currentUsers.length === 0) {
            tbodyUsers.innerHTML = '<tr><td colspan="6" class="text-center text-muted">No users found.</td></tr>';
            return;
        }

        tbodyUsers.innerHTML = currentUsers.map(user => `
            <tr>
                <td><small style="color:var(--text-muted);font-family:monospace">${escapeHtml(user.uid)}</small></td>
                <td><strong>${escapeHtml(user.email)}</strong></td>
                <td>${escapeHtml(user.displayName)}</td>
                <td><span class="status-badge ${user.isPremium ? 'active' : 'offline'}">${user.isPremium ? 'PREMIUM' : 'FREE'}</span></td>
                <td>${new Date(user.creationTime).toLocaleDateString()}</td>
                <td class="text-right">
                    <button class="action-btn delete" onclick="deleteUser('${user.uid}')">Del</button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        tbodyUsers.innerHTML = `<tr><td colspan="6" class="text-center text-danger">Error: ${error.message}</td></tr>`;
    }
}

async function deleteUser(uid) {
    if (!confirm('Are you sure you want to delete this user? It will remove them from Firebase Auth completely.')) return;
    try {
        await fetchAPI(`${API_USERS}/${uid}`, { method: 'DELETE' });
        loadUsers();
    } catch (error) {
        alert('Error: ' + error.message);
    }
}

// Settings Logic
async function loadSettings() {
    try {
        const res = await fetchAPI(API_SETTINGS);
        if (res.data) {
            document.getElementById('setMaintenance').checked = res.data.maintenanceMode || false;
            document.getElementById('setPrivacyUrl').value = res.data.privacyPolicyUrl || '';
            document.getElementById('setTosUrl').value = res.data.termsOfServiceUrl || '';
            document.getElementById('setSystemMessage').value = res.data.systemMessage || '';
        }
    } catch (error) {
        console.error('Error loading settings', error);
    }
}

const settingsForm = document.getElementById('settingsForm');
if(settingsForm) {
    settingsForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnSaveSettings');
        const originalText = btn.textContent;
        btn.textContent = 'Saving...';
        btn.disabled = true;

        try {
            const payload = {
                maintenanceMode: document.getElementById('setMaintenance').checked,
                privacyPolicyUrl: document.getElementById('setPrivacyUrl').value,
                termsOfServiceUrl: document.getElementById('setTosUrl').value,
                systemMessage: document.getElementById('setSystemMessage').value
            };
            await fetchAPI(API_SETTINGS, {
                method: 'PUT',
                body: JSON.stringify(payload)
            });
            alert('Settings saved successfully!');
        } catch (error) {
            alert('Error saving settings: ' + error.message);
        } finally {
            btn.textContent = originalText;
            btn.disabled = false;
        }
    });
}
