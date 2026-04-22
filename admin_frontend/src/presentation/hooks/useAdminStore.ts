import { create } from 'zustand';
import type { ServerEntity, SettingsEntity } from '../../domain/entities/admin';
import { adminRepository } from '../../data/repositories/AdminRepository';
import { apiClient } from '../../data/sources/ApiClient';

interface AdminState {
    apiKey: string;
    setApiKey: (key: string) => void;
    
    // Servers
    servers: ServerEntity[];
    isLoadingServers: boolean;
    fetchServers: () => Promise<void>;
    saveServer: (id: string | null, server: Partial<ServerEntity>) => Promise<void>;
    deleteServer: (id: string) => Promise<void>;
    importServers: (servers: Partial<ServerEntity>[]) => Promise<void>;

    // Settings
    settings: SettingsEntity | null;
    isLoadingSettings: boolean;
    fetchSettings: () => Promise<void>;
    updateSettings: (settings: Partial<SettingsEntity>) => Promise<void>;
    deleteServerRaw: (id: string) => Promise<void>;
    importServersRaw: (servers: Partial<ServerEntity>[]) => Promise<void>;
}

export const useAdminStore = create<AdminState>((set, get) => ({
    apiKey: '',
    setApiKey: (key: string) => {
        set({ apiKey: key });
        apiClient.setApiKey(key);
    },

    servers: [],
    isLoadingServers: false,
    fetchServers: async () => {
        set({ isLoadingServers: true });
        try {
            const servers = await adminRepository.getServers();
            set({ servers });
        } catch (error) {
            console.error('Failed to fetch servers:', error);
            throw error;
        } finally {
            set({ isLoadingServers: false });
        }
    },
    saveServer: async (id, server) => {
        try {
            if (id) {
                await adminRepository.updateServer(id, server);
            } else {
                await adminRepository.addServer(server);
            }
            await get().fetchServers();
        } catch (error) {
            console.error('Failed to save server:', error);
            throw error;
        }
    },
    deleteServer: async (id) => {
        try {
            await adminRepository.deleteServer(id);
            await get().fetchServers();
        } catch (error) {
            console.error('Failed to delete server:', error);
            throw error;
        }
    },
    importServers: async (servers) => {
        try {
            await adminRepository.importServers(servers);
            await get().fetchServers();
        } catch (error) {
            console.error('Failed to import servers:', error);
            throw error;
        }
    },

    settings: null,
    isLoadingSettings: false,
    fetchSettings: async () => {
        set({ isLoadingSettings: true });
        try {
            const settings = await adminRepository.getSettings();
            set({ settings });
        } catch (error) {
            console.error('Failed to fetch settings:', error);
            throw error;
        } finally {
            set({ isLoadingSettings: false });
        }
    },
    updateSettings: async (settings) => {
        try {
            await adminRepository.updateSettings(settings);
            set({ settings: { ...get().settings, ...settings } as SettingsEntity });
        } catch (error) {
            console.error('Failed to update settings:', error);
            throw error;
        }
    },
    deleteServerRaw: async (id: string) => {
        try {
            await adminRepository.deleteServer(id);
        } catch (error) {
            console.error('Failed to raw delete server:', error);
            throw error;
        }
    },
    importServersRaw: async (servers) => {
        try {
            await adminRepository.importServers(servers);
        } catch (error) {
            console.error('Failed to raw import servers:', error);
            throw error;
        }
    }
}));
