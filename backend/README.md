# Backend API (Fastify)

This directory will contain the **Fastify REST API** for the Arabic AVD Bible Study App.

## Status: 🔜 Phase 1 (coming after database import is complete)

### Planned Structure

```
backend/
├── src/
│   ├── server.js           # Fastify server entry point
│   ├── plugins/
│   │   ├── auth.js         # JWT authentication plugin
│   │   ├── supabase.js     # Supabase client plugin
│   │   └── redis.js        # Upstash Redis caching plugin
│   ├── routes/
│   │   ├── admin/
│   │   │   ├── auth.js           # POST /admin/auth/login, logout
│   │   │   ├── word-mappings.js  # CRUD word mappings
│   │   │   ├── strongs-ar.js     # CRUD Arabic Strong's translations
│   │   │   ├── verses.js         # PATCH verse text
│   │   │   ├── audio.js          # Upload audio files
│   │   │   └── users.js          # Admin user management
│   │   └── public/
│   │       ├── navigation.js     # Testaments, books, chapters, verses
│   │       ├── word-study.js     # Word mappings + Strong's detail
│   │       └── search.js         # Full-text search
│   └── middleware/
│       ├── auth-guard.js         # JWT verification
│       └── audit-logger.js       # Automatic audit log writes
├── package.json
└── .env.example
```

### Endpoints (29 total)

See the full API specification in `../implementation_plan.md`
