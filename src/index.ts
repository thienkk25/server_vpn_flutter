import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import serverRoutes from './presentation/routes/ServerRoutes';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Main Routes
app.use('/api/servers', serverRoutes);

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.status(200).send('VPN Backend Server is running healthy');
});

// Start Server
app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
  console.log(`[server]: Check servers api at http://localhost:${port}/api/servers`);
});
