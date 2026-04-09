import { apiClient } from '../sources/ApiClient';
import type { ServerEntity, UserEntity, SettingsEntity } from '../../domain/entities/admin';

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

    async getUsers(): Promise<UserEntity[]> {
        return await apiClient.get<UserEntity[]>('/users');
    }

    async addUser(user: Partial<UserEntity> & { password?: string }): Promise<void> {
        return await apiClient.post('/users', user);
    }

    async updateUser(uid: string, user: Partial<UserEntity> & { password?: string }): Promise<void> {
        return await apiClient.put(`/users/${uid}`, user);
    }

    async deleteUser(uid: string): Promise<void> {
        return await apiClient.delete(`/users/${uid}`);
    }

    async getSettings(): Promise<SettingsEntity> {
        return await apiClient.get<SettingsEntity>('/settings');
    }

    async updateSettings(settings: Partial<SettingsEntity>): Promise<void> {
        return await apiClient.put('/settings', settings);
    }
}

export const adminRepository = new AdminRepository();
