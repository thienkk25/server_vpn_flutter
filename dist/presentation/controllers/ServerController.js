"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ServerController = void 0;
const dummyData_1 = require("../../infrastructure/data/dummyData");
class ServerController {
    getServersUseCase;
    seedDummyDataUseCase;
    constructor(getServersUseCase, seedDummyDataUseCase) {
        this.getServersUseCase = getServersUseCase;
        this.seedDummyDataUseCase = seedDummyDataUseCase;
    }
    getServers = async (req, res) => {
        try {
            const servers = await this.getServersUseCase.execute();
            res.status(200).json({
                success: true,
                data: servers,
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error',
            });
        }
    };
    seedServers = async (req, res) => {
        try {
            await this.seedDummyDataUseCase.execute(dummyData_1.dummyVpnServers);
            res.status(200).json({
                success: true,
                message: 'Successfully seeded VPN servers.',
            });
        }
        catch (error) {
            res.status(500).json({
                success: false,
                message: error.message || 'Internal server error',
            });
        }
    };
}
exports.ServerController = ServerController;
