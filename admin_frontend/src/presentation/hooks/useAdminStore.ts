import { create } from 'zustand';
import type { ServerEntity, UserEntity, SettingsEntity } from '../../domain/entities/admin';
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

    // Users
    users: UserEntity[];
    isLoadingUsers: boolean;
    fetchUsers: () => Promise<void>;
    saveUser: (uid: string | null, user: Partial<UserEntity> & { password?: string }) => Promise<void>;
    deleteUser: (uid: string) => Promise<void>;

    // Settings
    settings: SettingsEntity | null;
    isLoadingSettings: boolean;
    fetchSettings: () => Promise<void>;
    updateSettings: (settings: Partial<SettingsEntity>) => Promise<void>;
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

    users: [],
    isLoadingUsers: false,
    fetchUsers: async () => {
        set({ isLoadingUsers: true });
        try {
            const users = await adminRepository.getUsers();
            set({ users });
        } catch (error) {
            console.error('Failed to fetch users:', error);
            throw error;
        } finally {
            set({ isLoadingUsers: false });
        }
    },
    saveUser: async (uid, user) => {
        try {
            if (uid) {
                await adminRepository.updateUser(uid, user);
            } else {
                await adminRepository.addUser(user);
            }
            await get().fetchUsers();
        } catch (error) {
            console.error('Failed to save user:', error);
            throw error;
        }
    },
    deleteUser: async (uid) => {
        try {
            await adminRepository.deleteUser(uid);
            await get().fetchUsers();
        } catch (error) {
            console.error('Failed to delete user:', error);
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
    }
}));
