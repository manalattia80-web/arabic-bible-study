# Admin Panel (Next.js 14)

This directory will contain the **Admin CMS** for managing Bible content.

## Status: 🔜 Phase 2 (after backend API is complete)

### Planned Structure

```
admin/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    # Redirect to /login or /dashboard
│   ├── login/
│   │   └── page.tsx               # Admin login screen
│   └── dashboard/
│       ├── layout.tsx             # Sidebar navigation
│       ├── page.tsx               # Stats overview
│       ├── word-mappings/
│       │   ├── page.tsx           # Browse verse word mappings
│       │   └── [verseId]/
│       │       └── page.tsx       # Edit word-by-word alignment
│       ├── strongs/
│       │   ├── page.tsx           # Browse Strong's entries
│       │   └── [strongsId]/
│       │       └── page.tsx       # Edit Arabic translation
│       ├── audio/
│       │   └── page.tsx           # Audio file manager
│       ├── verses/
│       │   └── page.tsx           # Verse text correction
│       ├── audit-log/
│       │   └── page.tsx           # View change history
│       └── users/
│           └── page.tsx           # Admin user management
├── components/
│   ├── WordMappingTable.tsx       # Inline editable interlinear table
│   ├── StrongsEditor.tsx          # Arabic definition editor
│   ├── AudioUploader.tsx          # Drag-and-drop audio upload
│   └── AuditLogViewer.tsx         # Filterable audit log
└── package.json
```

### Tech Stack
- **Framework**: Next.js 14 (App Router)
- **UI**: shadcn/ui + Radix UI
- **Auth**: Supabase Auth (JWT)
- **Styling**: Vanilla CSS (RTL-aware)
- **Hosting**: Vercel
