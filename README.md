# Server VPN Flutter

This is the backend and admin frontend for the VPN Flutter application.

## Features
- **Server Management**: Create, update, and manage VPN servers.
- **User Management**: Monitor users and premium subscription status.
- **Application Settings**: Control app behavior (Maintenance Mode, Messages, Flash Sales etc).
- **Backup & Restore**: Export the entire Firestore configuration (`vpn_servers`, `subscriptions`, `app_settings`) to a JSON file and restore it effortlessly.

## Architecture
- **Backend**: Express + TypeScript (`/src`)
- **Admin Panel**: React + Vite + TypeScript (`/admin_frontend`)

## Scripts
- `npm run dev` - Run the backend development server.
- `npm run build` - Compile both frontend and backend for production.
- `npm run start` - Run the generated built setup.

## Admin Features

### Backup and Restore
The admin dashboard now offers a one-click Backup and Restore mechanism. 
1. Navigate to the **Backup & Restore** tab in the admin panel.
2. Click **Download Backup** to securely fetch all servers, settings, and subscription metrics as a JSON file.
3. Use the **Upload and Restore** section to overwrite your database with a previously exported state. Note that existing matching documents will be updated/merged, and this should be done with care especially in production environments to avoid data conflicts.
