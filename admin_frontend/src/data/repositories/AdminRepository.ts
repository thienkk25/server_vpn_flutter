import { apiClient } from '../sources/ApiClient';
import type { ServerEntity, SettingsEntity } from '../../domain/entities/admin';

export class AdminRepository {
    async getServers(): Promise<ServerEntity[]> {
        return await apiClient.get<ServerEntity[]>('/servers');
    }

    async addServer(server: Partial<ServerEntity>): Promise<void> {
        return await apiClient.post('/servers', server);
    }

    async importServers(servers: Partial<ServerEntity>[]): Promise<void> {
        return await apiClient.post('/servers/import', servers);
    }

    async updateServer(id: string, server: Partial<ServerEntity>): Promise<void> {
        return await apiClient.put(`/servers/${id}`, server);
    }

    async deleteServer(id: string): Promise<void> {
        return await apiClient.delete(`/servers/${id}`);
    }

    async getSettings(): Promise<SettingsEntity> {
        return await apiClient.get<SettingsEntity>('/settings');
    }

    async updateSettings(settings: Partial<SettingsEntity>): Promise<void> {
        return await apiClient.put('/settings', settings);
    }
}

export const adminRepository = new AdminRepository();
