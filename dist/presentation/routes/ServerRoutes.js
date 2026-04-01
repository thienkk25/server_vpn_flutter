"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ServerController_1 = require("../controllers/ServerController");
const GetServersUseCase_1 = require("../../application/usecases/GetServersUseCase");
const SeedDummyDataUseCase_1 = require("../../application/usecases/SeedDummyDataUseCase");
const ServerFirebaseRepository_1 = require("../../infrastructure/repositories/ServerFirebaseRepository");
const router = (0, express_1.Router)();
// DI Setup for this module
const serverRepository = new ServerFirebaseRepository_1.ServerFirebaseRepository();
const getServersUseCase = new GetServersUseCase_1.GetServersUseCase(serverRepository);
const seedDummyDataUseCase = new SeedDummyDataUseCase_1.SeedDummyDataUseCase(serverRepository);
const serverController = new ServerController_1.ServerController(getServersUseCase, seedDummyDataUseCase);
// Routes
router.get('/', serverController.getServers);
router.post('/seed', serverController.seedServers);
exports.default = router;
