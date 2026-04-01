import { IServerRepository } from '../../domain/repositories/IServerRepository';
import { ServerEntity } from '../../domain/entities/ServerEntity';

export class GetServersUseCase {
  constructor(private serverRepository: IServerRepository) {}

  async execute(): Promise<ServerEntity[]> {
    return this.serverRepository.getAllServers();
  }
}
