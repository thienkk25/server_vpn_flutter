import { IServerRepository } from '../../domain/repositories/IServerRepository';
import { ServerEntity } from '../../domain/entities/ServerEntity';

export class SeedDummyDataUseCase {
  constructor(private serverRepository: IServerRepository) {}

  async execute(dummyData: ServerEntity[]): Promise<void> {
    await this.serverRepository.seedData(dummyData);
  }
}
