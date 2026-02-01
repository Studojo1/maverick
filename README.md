# Maverick Blog Editor

Blog editor application for Studojo, built with React Router v7.

## Overview

Maverick is a rich text blog editor that allows users with "ops" or "admin" roles to create, edit, and manage blog posts. It uses TipTap for rich text editing and integrates with Azure Blob Storage for image uploads.

## Features

- Rich text editing with TipTap
- Image upload to Azure Blob Storage
- SEO metadata management
- Category and tag management
- Draft/published status
- Reading time calculation
- Slug generation with uniqueness checks

## Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL database (shared with frontend)
- Azure Blob Storage (or LocalStack for local development)

### Installation

```bash
cd apps/maverick
npm install
```

### Environment Variables

Create a `.env.local` file:

```env
DATABASE_URL=postgresql://studojo:studojo@localhost:5432/postgres
VITE_AUTH_URL=http://localhost:3000
AZURE_STORAGE_ACCOUNT_NAME=your-account-name
AZURE_STORAGE_ACCOUNT_KEY=your-account-key
AZURE_STORAGE_CONTAINER_NAME=blog-images
USE_LOCALSTACK=true  # For local development
LOCALSTACK_ENDPOINT=http://localhost:4566
```

### Development

```bash
npm run dev
```

The application will be available at `http://localhost:3002`.

### Building for Production

```bash
npm run build
npm start
```

## Authentication

Maverick uses the same authentication system as the frontend. Users must have either "ops" or "admin" role to access the application.

To set a user as "ops":
```sql
UPDATE "user" SET role = 'ops' WHERE email = 'user@example.com';
```

## Domain

Production domain: `maverick.studojo.pro`

SSL certificates are automatically managed via cert-manager in Kubernetes.

