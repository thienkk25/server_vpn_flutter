import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import serverRoutes from './presentation/routes/ServerRoutes';
import adminRoutes from './presentation/routes/AdminRoutes';
import appSettingsRoutes from './presentation/routes/AppSettingsRoutes';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Serve Static Admin Dashboard
app.use('/admin', express.static(path.join(__dirname, '../public/admin')));

// Main Routes
app.use('/api/servers', serverRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/app-settings', appSettingsRoutes);

// 
app.get('/', (req: Request, res: Response) => {
  res.redirect('/admin');
});

// Start Server
app.listen(port, () => {
  console.log(`[server]: Server is running at ${port}`);
});
