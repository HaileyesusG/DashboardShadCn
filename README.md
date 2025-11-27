# Multi-Tenant Workspace Application

A comprehensive multi-tenant workspace application built with Next.js, better-auth, PostgreSQL, and shadcn/ui.

## Features

### ✅ Authentication
- **Email/Password Sign Up** - Create new user accounts
- **Email/Password Sign In** - Secure authentication
- **Session Management** - Persistent user sessions with better-auth

### ✅ Organization Management
- **Create Organization** - Users can create new organizations
- **Multi-tenant Architecture** - Complete data isolation per organization
- **Organization Roles** - Owner and Member roles with different permissions

### ✅ Team Management
- **View Members** - See all organization members and their roles
- **Invite Members** - Owners can invite users to join the organization
- **Remove Members** - Owners can remove members from the organization
- **Role-Based Access Control** - Different permissions for owners vs members

### ✅ Outline Management
- **Create Outlines** - Add new outline sections with all required fields
- **Edit Outlines** - Update existing outline entries
- **Delete Outlines** - Remove outline entries
- **View Outlines** - Table view with all outline data
- **Interactive UI** - Sheet component for add/edit operations

## Tech Stack

- **Frontend**: Next.js 14 (App Router), React, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Authentication**: better-auth with organization plugin
- **Database**: PostgreSQL with Prisma ORM
- **UI Components**: shadcn/ui (button, input, table, dialog, sheet, etc.)

## Database Schema

### User
- id, email, name, password, createdAt, updatedAt
- Relations: memberships, sessions

### Organization
- id, name, slug, createdAt, updatedAt
- Relations: members, outlines

### OrganizationMember
- id, role (owner/member), userId, organizationId
- Relations: user, organization

### Outline
- id, header, sectionType, status, target, limit, reviewer, organizationId
- Relations: organization

## Getting Started

### Prerequisites
- Node.js 18+ installed
- PostgreSQL database running
- npm or yarn package manager

### Installation

1. **Clone the repository**
   ```bash
   cd D3Assignment
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Copy `.env.example` to `.env` and update with your credentials:
   ```env
   DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"
   BETTER_AUTH_SECRET="your-secret-key"
   BETTER_AUTH_URL="http://localhost:3000"
   NEXT_PUBLIC_APP_URL="http://localhost:3000"
   ```

4. **Run database migrations**
   ```bash
   npx prisma migrate dev
   ```

5. **Generate Prisma client**
   ```bash
   npx prisma generate
   ```

6. **Start development server**
   ```bash
   npm run dev
   ```

7. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## Project Structure

```
D3Assignment/
├── app/
│   ├── (auth)/
│   │   ├── signin/page.tsx          # Sign in page
│   │   └── signup/page.tsx          # Sign up page
│   ├── (app)/
│   │   ├── create-organization/page.tsx
│   │   └── organization/[orgId]/
│   │       ├── outline/page.tsx     # Outline table page
│   │       └── team/page.tsx        # Team management page
│   ├── api/
│   │   ├── auth/[...all]/route.ts   # better-auth handler
│   │   └── organization/[orgId]/
│   │       ├── members/route.ts     # Team API
│   │       └── outline/
│   │           ├── route.ts         # Outline list/create
│   │           └── [id]/route.ts    # Outline update/delete
│   ├── layout.tsx                   # Root layout
│   ├── page.tsx                     # Home page
│   └── globals.css                  # Global styles
├── components/
│   └── ui/                          # shadcn/ui components
├── lib/
│   ├── auth.ts                      # better-auth config
│   ├── auth-client.ts               # Client-side auth
│   ├── auth-helpers.ts              # Auth utilities
│   ├── prisma.ts                    # Prisma client
│   └── utils.ts                     # Utility functions
├── prisma/
│   └── schema.prisma                # Database schema
└── package.json
```

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create new user
- `POST /api/auth/signin` - Sign in user
- `POST /api/auth/signout` - Sign out user

### Team Management
- `GET /api/organization/[orgId]/members` - List members
- `POST /api/organization/[orgId]/members` - Invite member (owner only)
- `DELETE /api/organization/[orgId]/members?memberId=X` - Remove member (owner only)

### Outline CRUD
- `GET /api/organization/[orgId]/outline` - List outlines
- `POST /api/organization/[orgId]/outline` - Create outline
- `PATCH /api/organization/[orgId]/outline/[id]` - Update outline
- `DELETE /api/organization/[orgId]/outline/[id]` - Delete outline

## Authorization Rules

| Action | Owner | Member |
|--------|-------|--------|
| Access outline data | ✅ | ✅ |
| Invite user | ✅ | ❌ |
| Remove user | ✅ | ❌ |
| Edit outline | ✅ | ✅ |
| Delete outline | ✅ | ✅ |

## User Flow

1. **Sign Up** → Create account at `/signup`
2. **Create Organization** → Set up organization at `/create-organization`
3. **Manage Team** → Invite members at `/organization/[orgId]/team`
4. **Manage Outlines** → Add/edit/delete outlines at `/organization/[orgId]/outline`

## Development

### Database Management
```bash
# View database in Prisma Studio
npx prisma studio

# Create new migration
npx prisma migrate dev --name migration_name

# Reset database
npx prisma migrate reset
```

### Build for Production
```bash
npm run build
npm start
```

## Notes

- **Multi-tenancy**: All data is scoped by organization ID
- **Authorization**: API endpoints verify user membership and role
- **Security**: Passwords are hashed with bcryptjs
- **Session Management**: Handled by better-auth with database storage

## License

MIT
