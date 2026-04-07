import { IServerRepository } from '../../domain/repositories/IServerRepository';
import { ServerEntity } from '../../domain/entities/ServerEntity';

export class GetAllServersAdminUseCase {
  constructor(private serverRepository: IServerRepository) {}
  async execute(): Promise<ServerEntity[]> {
    return this.serverRepository.getAllServers();
  }
}

export class CreateServerUseCase {
  constructor(private serverRepository: IServerRepository) {}
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
  constructor(private serverRepository: IServerRepository) {}
  async execute(id: string, serverData: Partial<ServerEntity>): Promise<void> {
    await this.serverRepository.updateServer(id, serverData);
  }
}

export class DeleteServerUseCase {
  constructor(private serverRepository: IServerRepository) {}
  async execute(id: string): Promise<void> {
    await this.serverRepository.deleteServer(id);
  }
}
