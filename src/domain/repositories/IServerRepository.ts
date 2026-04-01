import { ServerEntity } from '../entities/ServerEntity';

export interface IServerRepository {
  getAllServers(): Promise<ServerEntity[]>;
  seedData(servers: ServerEntity[]): Promise<void>;
}
