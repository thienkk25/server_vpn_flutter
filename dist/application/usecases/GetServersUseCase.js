"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GetServersUseCase = void 0;
class GetServersUseCase {
    serverRepository;
    constructor(serverRepository) {
        this.serverRepository = serverRepository;
    }
    async execute() {
        return this.serverRepository.getAllServers();
    }
}
exports.GetServersUseCase = GetServersUseCase;
