"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SeedDummyDataUseCase = void 0;
class SeedDummyDataUseCase {
    serverRepository;
    constructor(serverRepository) {
        this.serverRepository = serverRepository;
    }
    async execute(dummyData) {
        await this.serverRepository.seedData(dummyData);
    }
}
exports.SeedDummyDataUseCase = SeedDummyDataUseCase;
