import { IServerRepository } from '../../domain/repositories/IServerRepository';
import { ServerEntity } from '../../domain/entities/ServerEntity';
import crypto from 'crypto';

export class GetAllServersAdminUseCase {
  constructor(private serverRepository: IServerRepository) { }
  async execute(): Promise<ServerEntity[]> {
    return this.serverRepository.getAllServers();
  }
}

export class CreateServerUseCase {
  constructor(private serverRepository: IServerRepository) { }
  async execute(server: ServerEntity): Promise<void> {
    const newServer = {
      ...server,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    await this.serverRepository.createServer(newServer);
  }
}

export class UpdateServerUseCase {
  constructor(private serverRepository: IServerRepository) { }
  async execute(id: string, serverData: Partial<ServerEntity>): Promise<void> {
    await this.serverRepository.updateServer(id, serverData);
  }
}

export class DeleteServerUseCase {
  constructor(private serverRepository: IServerRepository) { }
  async execute(id: string): Promise<void> {
    await this.serverRepository.deleteServer(id);
  }
}

export class ImportServersUseCase {
  constructor(private serverRepository: IServerRepository) { }
  async execute(serversData: any[]): Promise<void> {
    const newServers = serversData.map(server => {
      const mapped: Partial<ServerEntity> = {
        id: server.id || crypto.randomUUID(),
        createdAt: server.createdAt || Date.now(),
        updatedAt: server.updatedAt || Date.now(),
        deletedAt: server.deletedAt || Date.parse('1990-01-01'),
        name: server.display_name || server.name || '',
        region: server.country || server.region || '',
        ip: server.ip || '',
        config: server.config || '',
        username: server.username || '',
        password: server.password || '',
        version: server.version !== undefined ? server.version : 1,
        status: server.status !== undefined ? server.status : 1,
        onWireGuard: server.wireguard || server.wireGuardConfig ? 1 : (server.onWireGuard !== undefined ? server.onWireGuard : 0),
        wireGuardConfig: typeof server.wireGuardConfig === 'string' && server.wireGuardConfig
            ? server.wireGuardConfig
            : typeof server.wireguard === 'string' && server.wireguard
                ? server.wireguard
                : '',
        isVip: server.isVip !== undefined ? server.isVip : 0,
      };

      // Remove undefined and null fields to avoid Firestore errors
      Object.keys(mapped).forEach(key => {
        if ((mapped as any)[key] === undefined || (mapped as any)[key] === null) {
          delete (mapped as any)[key];
        }
      });

      return mapped as ServerEntity;
    });

    // We reuse seedData as it uses firestore batch to set documents
    await this.serverRepository.seedData(newServers);
  }
}
