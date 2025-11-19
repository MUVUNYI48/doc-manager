# Self-Hosted File Storage System

A complete file storage and sharing system built with Next.js, similar to Google Drive but self-hosted.

## Features

- **File Management**: Upload, download, delete, and organize files
- **Authentication**: JWT-based login/register system
- **Role-based Access**: Admin, editor, viewer roles
- **File Sharing**: Secure shareable links with permissions
- **Folder Hierarchy**: Organize files in folders
- **Local Storage**: Files stored on server filesystem
- **Database**: PostgreSQL for metadata storage

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create uploads directory:
```bash
mkdir uploads
```

3. Set environment variables:
```bash
# .env.local
JWT_SECRET=your-secret-key-here
DATABASE_URL=postgresql://username:password@localhost:5432/filestore
```

4. Start development server:
```bash
npm run dev
```

## API Routes

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration

### File Management
- `POST /api/files/upload` - Upload files
- `GET /api/files/list` - List files/folders
- `GET /api/files/download/[id]` - Download file
- `DELETE /api/files/delete` - Delete file

## Database Schema

### Users Table
- `id` - Primary key
- `email` - User email (unique)
- `password` - Hashed password
- `role` - User role (admin/editor/viewer)
- `created_at` - Registration timestamp

### Files Table
- `id` - File UUID
- `name` - Original filename
- `path` - Server file path
- `size` - File size in bytes
- `mime_type` - File MIME type
- `owner_id` - User who uploaded
- `parent_id` - Parent folder ID
- `is_folder` - Boolean for folders
- `created_at` - Upload timestamp
- `updated_at` - Last modified

### Shares Table
- `id` - Share UUID
- `file_id` - Referenced file
- `token` - Share token
- `permissions` - Access level
- `expires_at` - Expiration date
- `created_at` - Share creation

## Usage

1. Register a new account or login
2. Upload files using the file input
3. Navigate folders by clicking "Open"
4. Download files by clicking "Download"
5. Delete files with "Delete" button

## Security Features

- JWT authentication for all API routes
- File ownership verification
- Role-based access control
- Secure file paths to prevent directory traversal
- Password hashing with bcrypt

## File Structure

```
/app
  /api
    /auth
      /login - Authentication endpoint
      /register - User registration
    /files
      /upload - File upload handler
      /list - File listing
      /download/[id] - File download
      /delete - File deletion
/components
  FileExplorer.tsx - Main file browser UI
  LoginForm.tsx - Authentication form
/lib
  db.ts - Database connection and schema
  auth.ts - Authentication utilities
  middleware.ts - Route protection
/uploads - File storage directory
```

This system provides a complete self-hosted alternative to cloud storage services with full control over your data.# doc-manager
