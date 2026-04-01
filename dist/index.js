"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const ServerRoutes_1 = __importDefault(require("./presentation/routes/ServerRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
// Middlewares
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Main Routes
app.use('/api/servers', ServerRoutes_1.default);
// Health Check
app.get('/health', (req, res) => {
    res.status(200).send('VPN Backend Server is running healthy');
});
// Start Server
app.listen(port, () => {
    console.log(`[server]: Server is running at http://localhost:${port}`);
    console.log(`[server]: Check servers api at http://localhost:${port}/api/servers`);
});
