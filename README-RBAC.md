# Opal Role-Based Access Control (RBAC) System

This document describes the role-based permission system implemented for the Opal Learning Management System.

## Overview

The RBAC system defines three user roles:

1. **Student** (default) - Can access and enroll in courses, track their learning progress
2. **Instructor** - Can create and edit courses and lessons, view student progress
3. **Admin** - Has full system access including user role management and advanced settings

## Database Schema

The system extends the User model with a role field:

```prisma
model User {
  // existing fields
  role        String    @default("student") // "student", "instructor", "admin"
  // existing relations
}
```

## Implementation Details

### Authentication Middleware

The system uses a middleware approach to check course access permissions:

- **Location**: `src/middleware/check-course-access.ts`
- **Usage**: Import and use in API routes and server components to verify user permissions

```typescript
import { AccessLevel, checkCourseAccess, handleUnauthorizedAccess } from '@/middleware/check-course-access'

// In API routes:
const accessCheck = await checkCourseAccess({
  courseId: id,
  requiredAccess: AccessLevel.VIEW // or EDIT, MANAGE, ADMIN
})

const unauthorizedResponse = handleUnauthorizedAccess(accessCheck)
if (unauthorizedResponse) return unauthorizedResponse

// Continue with authorized access
```

### Access Level Definitions

The system defines four access levels:

1. **VIEW** - For viewing course content (students, instructors, course owner, admins)
2. **EDIT** - For modifying course content (instructors, course owner, admins)
3. **MANAGE** - For managing course settings/enrollments (course owner, admins)
4. **ADMIN** - For administrative actions (admins only)

### User Management

Admins can manage user roles through the User Management interface:

- **Location**: `/dashboard/[workspaceId]/users`
- **Features**: View users, assign roles, search functionality

## Client-Side Components

The system includes UI components for role-based rendering:

1. **CourseActions** (`src/components/courses/course-actions.tsx`): Renders appropriate action buttons based on user role and permissions
2. **Role badges**: Visual indicators of user roles throughout the interface

## API Endpoints

Role-based API endpoints have been implemented:

1. **GET /api/users**: Fetch all users (admin only)
2. **PATCH /api/users/[id]/role**: Update a user's role (admin only)
3. **Updated course endpoints**: All course-related endpoints now check permissions

## Migration Instructions

To add the role field to your database:

1. Run the migration:
   ```bash
   npx prisma migrate deploy
   ```

2. If needed, apply the migration manually:
   ```sql
   ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'student';
   ```

3. After migration, update Prisma client:
   ```bash
   npx prisma generate
   ```

## Troubleshooting

- If you encounter TypeScript errors related to the role field, run `npx prisma generate` to update types
- Check the roles are correctly assigned in the database
- Verify middleware is correctly imported and used in protected routes

## Security Considerations

- All role checks happen on the server side for security
- Client-side UI conditionally renders based on permissions, but all actions are verified server-side
- Double-check that sensitive operations have appropriate role checks 