import { IServerRepository } from '../../domain/repositories/IServerRepository';

export class GetPrivateServerConfigUseCase {
  constructor(
    private serverRepository: IServerRepository
  ) {}

  async execute(serverId: string): Promise<any> {
    const servers = await this.serverRepository.getAllServers();
    const server = servers.find(s => s.id?.toString() === serverId);

    if (!server) {
      throw new Error('404: Server not found.');
    }

    if (server.status !== 1) {
      throw new Error('400: Server is currently inactive.');
    }

    return {
      config: server.config,
      username: server.username,
      password: server.password,
      wireGuardConfig: server.wireGuardConfig,
    };
  }
}
