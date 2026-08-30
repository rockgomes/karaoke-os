# Database

The schema for this project lives here, as the migrations that built it.

Supabase is the only place these have ever run. Everything up to and including
`20260830185031` was applied straight to the hosted project during development
and back-filled into this folder afterwards, so the file names match
`supabase_migrations.schema_migrations` exactly and the CLI treats them as
already applied.

## Rules

- **One change, one file.** Never edit a migration that has run. Write a new one.
- **Name it `<version>_<name>.sql`**, where `version` is `YYYYMMDDHHMMSS` in UTC.
  This is what the Supabase CLI matches on.
- **Say why in the file.** These are the record of how the tenancy boundary was
  built. A file that only says what it does is half a record.

## Applying

```
supabase link --project-ref tczjrhcnufvehcthsens
supabase db push
```

Row level security is the tenancy boundary for this app, not a second line of
defence behind the interface. A migration that adds a table without enabling
RLS on it is a bug, whatever the interface does.
