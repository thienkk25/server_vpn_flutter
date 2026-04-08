import { IServerRepository } from '../../domain/repositories/IServerRepository';
import { ISubscriptionRepository } from '../../domain/repositories/ISubscriptionRepository';

export class GetPrivateServerConfigUseCase {
  constructor(
    private serverRepository: IServerRepository,
    private subscriptionRepository: ISubscriptionRepository
  ) {}

  async execute(userId: string, serverId: string): Promise<any> {
    const subscription = await this.subscriptionRepository.getSubscriptionByUserId(userId);
    const now = Date.now();

    if (!subscription || !subscription.isActive) {
      throw new Error('403: Forbidden - Premium subscription required.');
    }

    // Since our DB uses string IDs but the mock may be something else, let's just get all and find. 
    // Wait, the current IServerRepository doesn't have getServerById, let's check it.
    const servers = await this.serverRepository.getAllServers();
    const server = servers.find(s => s.id === serverId);

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
