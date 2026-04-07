import { ServerEntity } from '../entities/ServerEntity';

export interface IServerRepository {
  getAllServers(): Promise<ServerEntity[]>;
  createServer(server: ServerEntity): Promise<void>;
  updateServer(id: string, serverData: Partial<ServerEntity>): Promise<void>;
  deleteServer(id: string): Promise<void>;
  seedData(servers: ServerEntity[]): Promise<void>;
}
