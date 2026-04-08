import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import serverRoutes from './presentation/routes/ServerRoutes';
import iapRoutes from './presentation/routes/IapRoutes';
import adminRoutes from './presentation/routes/AdminRoutes';
import { startSubscriptionCronJob } from './infrastructure/cron/SubscriptionCron';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());

// Serve Static Admin Dashboard
app.use('/admin', express.static(path.join(__dirname, '../public/admin')));

// Main Routes
app.use('/api/servers', serverRoutes);
app.use('/api/iap', iapRoutes);
app.use('/api/admin', adminRoutes);

// 
app.get('/', (req: Request, res: Response) => {
  res.status(200).send('VPN Backend Server is running');
});

// Start Background Jobs
startSubscriptionCronJob();

// Start Server
app.listen(port, () => {
  console.log(`[server]: Server is running at ${port}`);
});
