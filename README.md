# Resource Reservation Management System

A full-stack web application developed for the PrimeWave Lab (Pvt) Ltd Software Engineering Internship Assessment. The system manages shared resources and reservations while preventing overlapping bookings for the same resource.

## Features

- Dashboard with resource and reservation statistics
- Create, view, update, deactivate, and reactivate resources
- Create and view reservations
- Prevent overlapping confirmed reservations for the same resource
- Cancel reservations
- Validate reservation details and time ranges
- Filter reservations by status

## Technology Stack

- **Frontend:** Next.js, React, TypeScript, Tailwind CSS
- **Backend:** Next.js App Router API routes
- **Database:** PostgreSQL
- **ORM:** Prisma
- **Validation:** Zod
- **Icons:** Lucide React

## Prerequisites

- Node.js (LTS recommended)
- npm
- PostgreSQL

## Installation and Setup

1. Clone the repository:

   ```bash
   git clone YOUR_GITHUB_REPOSITORY_URL
   cd resource-reservation-system
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Create a `.env` file in the project root:

   ```env
   DATABASE_URL="postgresql://USERNAME:PASSWORD@localhost:5432/resource_reservation_db"
   ```

   Replace `USERNAME` and `PASSWORD` with your local PostgreSQL credentials.

4. Apply the database migrations:

   ```bash
   npx prisma migrate deploy
   ```

5. Start the development server:

   ```bash
   npm run dev
   ```

6. Open [http://localhost:3000](http://localhost:3000).

## Useful Commands

```bash
npx prisma studio
npx tsc --noEmit
npm run build
```

## Main Application Pages

- `/` — Dashboard
- `/resources` — Resource management
- `/reservations` — Reservation management

## Reservation Conflict Prevention

The system checks for overlapping confirmed reservations for the same resource. Reservation creation uses a database transaction with serializable isolation and retry handling for transaction conflicts.

## Environment Variables

The application requires `DATABASE_URL`. Do not commit your `.env` file or database credentials to GitHub.

## Project Structure

```text
src/
  app/
    api/
      resources/
      reservations/
    resources/
    reservations/
  lib/
    prisma.ts
    validations.ts
    reservation-validations.ts
prisma/
  schema.prisma
  migrations/
```


