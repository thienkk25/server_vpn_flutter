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

// Public Legal Pages
import { AdminSettingsUseCases } from './application/usecases/AdminSettingsUseCases';
const settingsUseCase = new AdminSettingsUseCases();

const generateLegalHtml = (title: string, content: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 20px; }
        h1, h2, h3 { color: #222; }
        a { color: #0066cc; }
        .container { background: #fff; padding: 40px; border-radius: 8px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        @media (max-width: 600px) { .container { padding: 20px; } }
    </style>
</head>
<body style="background-color: #f5f5f7;">
    <div class="container">
        ${content || '<h2>Content not available</h2>'}
    </div>
</body>
</html>
`;

app.get('/privacy', async (req: Request, res: Response) => {
    try {
        const settings = await settingsUseCase.getSettings();
        res.send(generateLegalHtml("Privacy Policy", settings.privacyPolicyContent));
    } catch (e) {
        res.status(500).send("Error loading Privacy Policy");
    }
});

app.get('/terms', async (req: Request, res: Response) => {
    try {
        const settings = await settingsUseCase.getSettings();
        res.send(generateLegalHtml("Terms of Service", settings.termsOfServiceContent));
    } catch (e) {
        res.status(500).send("Error loading Terms of Service");
    }
});

app.get('/', (req: Request, res: Response) => {
  res.redirect('/admin');
});

// Start Server
app.listen(port, () => {
  console.log(`[server]: Server is running at ${port}`);
});
