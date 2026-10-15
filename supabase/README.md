# Supabase setup
1. Create a Supabase project and apply schema.sql in the SQL editor.
2. Add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY to the deployment environment.
3. Add SUPABASE_SERVICE_ROLE_KEY only as a server-side secret. Never prefix it with NEXT_PUBLIC.
4. Enable email/password authentication.
5. To grant the first admin, create a user through Supabase Auth, then create/update that user's row in public.profiles with role = 'admin'.
6. Keep requests and orders inaccessible to anonymous clients. Use server routes for writes and server-side role checks for admin operations.
