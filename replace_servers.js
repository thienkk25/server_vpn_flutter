const fs = require('fs');

let content = fs.readFileSync('admin_frontend/src/presentation/pages/ServersPage.tsx', 'utf8');

// Add import
content = content.replace("import type { ServerEntity } from '../../domain/entities/admin';", "import type { ServerEntity } from '../../domain/entities/admin';\nimport { useTranslation } from 'react-i18next';");

// Add hook
content = content.replace("export default function ServersPage() {\n    const { servers", "export default function ServersPage() {\n    const { t } = useTranslation();\n    const { servers");

const replacements = [
    ["Are you sure you want to delete ${selectedIds.length} server(s)?", "confirm_delete_server"],
    ["'Failed to delete some servers'", "t('failed_delete_server')"],
    ["'Data should be an array of servers.'", "t('failed_import_json')"],
    ["Found ${data.length} servers in file. Proceed to import?", "found_servers", true],
    ["'Import successful!'", "t('import_successful')"],
    ["'Failed to parse or import JSON: ' + error.message", "t('failed_import_json') + ' ' + error.message"],
    ["'Failed to read config file: ' + error.message", "t('failed_read_config') + ' ' + error.message"],
    ["'Failed to save server'", "t('failed_save_server')"],
    ["'Are you sure you want to delete this server?'", "t('confirm_delete_server')"],
    ["'Failed to delete server'", "t('failed_delete_server')"],
    ["{isDeletingBulk ? 'Deleting...' : `Delete Selected (${selectedIds.length})`}", "{isDeletingBulk ? t('deleting') : t('delete_selected', { count: selectedIds.length })}"],
    [">\\s*Import JSON\\s*<", ">{t('import_json')}<", true], // Regex
    ["<RefreshCw size={16} /> Refresh", "<RefreshCw size={16} /> {t('refresh')}"],
    ["<Plus size={16} /> New Server", "<Plus size={16} /> {t('new_server')}"],
    ["<th>Name</th>", "<th>{t('name')}</th>"],
    ["<th>Host / IP</th>", "<th>{t('host_ip')}</th>"],
    ["<th>Protocol</th>", "<th>{t('protocol')}</th>"],
    ["<th>Status</th>", "<th>{t('status')}</th>"],
    ["<th>Tier</th>", "<th>{t('tier')}</th>"],
    ["<th className=\"text-right\">Actions</th>", "<th className=\"text-right\">{t('actions')}</th>"],
    ["Loading servers...", "{t('loading_servers')}"],
    ["No servers found. Add one to get started.", "{t('no_servers_found')}"],
    ["'Both (OpenVPN & WireGuard)'", "t('both_protocol')"],
    ["'WireGuard'", "t('wireguard')", true],
    ["'OpenVPN'", "t('openvpn')", true], // Wait, this might replace variable names or conditions. Let's be careful.
    ["{server.status === 1 ? 'ACTIVE' : 'OFFLINE'}", "{server.status === 1 ? t('active') : t('offline')}"],
    ["{server.isVip === 1 ? 'VIP' : 'FREE'}", "{server.isVip === 1 ? t('vip') : t('free')}"],
    ["<Edit2 size={14} /> Edit", "<Edit2 size={14} /> {t('edit')}"],
    ["{deletingId === server.id ? 'Deleting...' : 'Del'}", "{deletingId === server.id ? t('deleting') : t('del')}"],
    ["{editingServer \\? 'Edit Server' : 'Add New Server'}", "{editingServer ? t('edit_server') : t('add_new_server')}", true],
    ["<label>Server Name</label>", "<label>{t('server_name')}</label>"],
    ["placeholder=\"e.g. US East 1\"", "placeholder={t('eg_us_east_1')}"],
    ["<label>Region</label>", "<label>{t('region')}</label>"],
    ["placeholder=\"e.g. US, SG...\"", "placeholder={t('eg_us_sg')}"],
    ["<label>Host (IP/Domain)</label>", "<label>{t('host_ip_domain')}</label>"],
    ["<label>Protocol</label>", "<label>{t('protocol')}</label>"],
    ["<option value=\"OpenVPN\">OpenVPN</option>", "<option value=\"OpenVPN\">{t('openvpn')}</option>"],
    ["<option value=\"WireGuard\">WireGuard</option>", "<option value=\"WireGuard\">{t('wireguard')}</option>"],
    ["<option value=\"Both\">Both (OpenVPN & WireGuard)</option>", "<option value=\"Both\">{t('both_protocol')}</option>"],
    ["<label>Status</label>", "<label>{t('status')}</label>"],
    ["<option value=\"active\">Active</option>", "<option value=\"active\">{t('active')}</option>"],
    ["<option value=\"offline\">Offline</option>", "<option value=\"offline\">{t('offline')}</option>"],
    ["<label htmlFor=\"serverIsVip\" style={{ margin: 0, padding: 0 }}>Require VIP Subscription</label>", "<label htmlFor=\"serverIsVip\" style={{ margin: 0, padding: 0 }}>{t('require_vip_sub')}</label>"],
    ["<label>Username</label>", "<label>{t('username')}</label>"],
    ["placeholder=\"e.g. vpn\"", "placeholder={t('eg_vpn')}"],
    ["<label>Version</label>", "<label>{t('version')}</label>"],
    ["placeholder=\"e.g. 1\"", "placeholder={t('eg_1')}"],
    ["<label>Password (Optional)</label>", "<label>{t('password_optional')}</label>"],
    ["placeholder=\"Leave empty if none\"", "placeholder={t('leave_empty_if_none')}"],
    ["<label style={{ margin: 0 }}>OpenVPN Config</label>", "<label style={{ margin: 0 }}>{t('openvpn_config')}</label>"],
    ["Upload File", "{t('upload_file')}"], // Will replace 3 instances
    ["placeholder=\"Paste OpenVPN config here...\"", "placeholder={t('paste_openvpn_config')}"],
    ["<label style={{ margin: 0 }}>WireGuard Config</label>", "<label style={{ margin: 0 }}>{t('wireguard_config')}</label>"],
    ["placeholder=\"Paste WireGuard config here...\"", "placeholder={t('paste_wireguard_config')}"],
    ["<label style={{ margin: 0 }}>Raw Config</label>", "<label style={{ margin: 0 }}>{t('raw_config')}</label>"],
    ["disabled={isSaving}>Cancel</button>", "disabled={isSaving}>{t('cancel')}</button>"],
    ["{isSaving ? 'Saving...' : 'Save Server'}", "{isSaving ? t('saving') : t('save_server')}"]
];

for (const rep of replacements) {
    if (rep[2]) {
        content = content.replace(new RegExp(rep[0], 'g'), rep[1] === "found_servers" ? "t('found_servers', { count: data.length })" : rep[1]);
    } else {
        content = content.split(rep[0]).join(rep[1]);
    }
}

// Careful with these openvpn / wireguard replacements, they should only replace UI strings, not variable checks
content = content.replace("? 'Both (OpenVPN & WireGuard)'", "? t('both_protocol')");
content = content.replace(": (server.onWireGuard === 1 ? 'WireGuard' : 'OpenVPN')", ": (server.onWireGuard === 1 ? t('wireguard') : t('openvpn'))");

// Fix confirm messages
content = content.replace("`Are you sure you want to delete ${selectedIds.length} server(s)?`", "t('confirm_delete_server')");

fs.writeFileSync('admin_frontend/src/presentation/pages/ServersPage.tsx', content);

