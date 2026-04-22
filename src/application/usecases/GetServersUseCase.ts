import { IServerRepository } from '../../domain/repositories/IServerRepository';
import { ServerEntity } from '../../domain/entities/ServerEntity';

export class GetServersUseCase {
  constructor(private serverRepository: IServerRepository) {}

  async execute(): Promise<Partial<ServerEntity>[]> {
    const servers = await this.serverRepository.getAllServers();
    
    // Filter active servers (status === 1)
    const activeServers = servers.filter(s => s.status === 1);

    // Sort A -> Z by country name, then region
    const sorted = activeServers.sort((a, b) => {
      const nameCompare = a.name.localeCompare(b.name);
      if (nameCompare !== 0) return nameCompare;
      return (a.region || '').localeCompare(b.region || '');
    });

    // Map to public info only
    return sorted.map(server => {
      if (server.isVip === 1) {
        const { config, username, password, wireGuardConfig, ...publicInfo } = server;
        return publicInfo;
      }
      return server;
    });
  }
}
