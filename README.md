# GemidaWebsite

A family management and visualization web app built with Next.js (App Router). It provides user authentication, family tree visualization and management, event & timeline features, image uploads, and an admin interface.

---

## 🚀 Features

- User authentication (JWT) and profile management
- Family tree visualization and editing (GoJS-based component)
- Events and timeline management
- Image/file uploads (UploadThing)
- Admin area for managing content, members, and family tree
- Dashboard with charts and key metrics
- TypeScript + Tailwind CSS UI with Radix primitives and reusable components
- Prisma ORM for database modeling and seeding

---

## 🧩 Tech stack

- Next.js 13 (App Router)
- TypeScript
- Tailwind CSS
- Prisma (Postgres or other database supported by Prisma)
- UploadThing (file uploads)
- GoJS (family tree visualization)
- Radix UI, Recharts, React Hook Form, Zod, Sonner, and other UI helpers

---

## ⚙️ Prerequisites

- Node.js 18 or newer
- A database supported by Prisma (e.g., PostgreSQL)
- (Optional) An UploadThing account/config if you plan to enable production uploads

---

## 🛠️ Setup / Development

1. Clone the repo

```bash
git clone <repo-url>
cd GemidaWebsite
```

2. Install dependencies

```bash
npm install
# or `pnpm install` / `yarn` depending on your preference
```

3. Create a `.env` file in the project root with the required environment variables (example below).

4. Setup the database and run migrations

```bash
# generate prisma client + run migrations locally
npx prisma migrate dev --name init
```

5. Seed the database (project includes a seed script)

```bash
npm run seed
```

6. Start the dev server

```bash
npm run dev
```

---

## 📁 Example `.env` / `.env.example` (do NOT commit secrets)

Use the included `.env.example` as a starting point — copy it to `.env` and fill in real secret values.

```
# Example (see .env.example)
DATABASE_URL="postgresql://user:password@localhost:5432/gemida?schema=public"
JWT_SECRET="a_long_random_secret"
# Optional (UploadThing or other keys if used in deployment)
# UPLOADTHING_SECRET=...
# NEXT_PUBLIC_UPLOADTHING_URL=...
```

> Note: The app reads `DATABASE_URL` (used by Prisma) and `JWT_SECRET` (used for auth). For local development, copy `.env.example` -> `.env`. Do NOT commit your `.env` file.

---

## 📜 Available scripts

- `npm run dev` - Start dev server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run seed` - Run the prisma seed script
- `npm test` - Run unit tests (Vitest)

---

## 🗂️ Project structure (high-level)

- `app/` - Next.js app routes and pages (App Router)
- `components/` - Reusable UI components (including `FamilyTreeGoJS` and `ImageUpload`)
- `lib/` - Utilities, API helpers, Prisma client, auth logic
- `prisma/` - Prisma schema and seed data
- `public/` - Static assets

---

## ✅ Development notes & troubleshooting

- If Prisma client is outdated: `npx prisma generate`
- If you get migration errors, check `DATABASE_URL` and re-run `npx prisma migrate dev`
- Ensure `JWT_SECRET` is set for auth-related endpoints

---

## 🤝 Contributing

Contributions are welcome — please open issues or PRs with clear descriptions. Follow branch naming conventions and create focused, small PRs.

---

## 📝 License

This project is licensed under the **MIT License**. See the included `LICENSE` file for details.
