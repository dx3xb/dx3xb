# Release and rollback

## Release gate

1. Run `npm ci` and `npm run release:check`.
2. Run `supabase db push --linked --dry-run`; review the exact migration list.
3. Apply database migrations before code that depends on them.
4. Deploy with `vercel --prod`, then verify `/api/health`, `/studio`, one public game, and protected API 401 responses.
5. Record the Git commit, Vercel deployment URL, and Supabase migration versions in the release note.

## Application rollback

Use Vercel's deployment history to promote the last healthy production deployment. Do not rebuild an old commit when an immutable healthy deployment already exists. Re-run health and smoke checks after promotion.

## Database recovery

Database migrations are forward-only. Never edit a migration already recorded remotely and never use destructive rollback SQL during an incident. Create a new corrective migration that restores compatibility with both the old and new application versions. For data loss, stop writes and restore from Supabase point-in-time recovery before promoting application traffic.

## Compatibility rule

Schema changes must follow expand, migrate, contract: add compatible structures, deploy readers/writers, migrate data, and remove old structures only in a later release.
