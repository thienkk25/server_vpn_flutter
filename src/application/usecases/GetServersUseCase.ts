import { IServerRepository } from '../../domain/repositories/IServerRepository';
import { ServerEntity } from '../../domain/entities/ServerEntity';

export class GetServersUseCase {
  constructor(private serverRepository: IServerRepository) {}

  async execute(): Promise<Partial<ServerEntity>[]> {
    const servers = await this.serverRepository.getAllServers();
    
    // Filter active servers (status === 1)
    const activeServers = servers.filter(s => s.status === 1);

    // Basic Load Balancing: Random shuffle
    const shuffled = activeServers.sort(() => 0.5 - Math.random());

    // Map to public info only
    return shuffled.map(server => {
      if (server.isVip === 1) {
        const { config, username, password, wireGuardConfig, ...publicInfo } = server;
        return publicInfo;
      }
      return server;
    });
  }
}
