/src
├── /app
│   ├── /dashboard
│   │   └── page.tsx              ← Frontend route
│   ├── /auth
│   │   ├── login
│   │   │   └── page.tsx
│   │   └── register
│   │       └── page.tsx
│   └── /api
│       ├── /users
│       │   └── route.ts          ← API route (GET, POST, etc.)
│       └── /auth
│           └── route.ts
│
├── /components
│   ├── Navbar.tsx
│   └── UserCard.tsx             ← UI components
│
├── /lib
│   ├── db.ts                    ← DB connection logic (e.g., Mongoose or Prisma)
│   └── utils.ts                 ← General helpers
│
├── /models
│   └── User.ts                  ← Mongoose/Prisma models
│
├── /controllers
│   ├── userController.ts        ← Controller logic (GET, POST, etc.)
│   └── authController.ts
│
├── /styles
│   └── globals.css              ← Tailwind or CSS
│
├── /middleware.ts              ← For auth / protected routes
├── /types                      ← (Optional) Custom TypeScript types
│   └── user.d.ts
└── /config                     ← (Optional) App-level config
    └── constants.ts
