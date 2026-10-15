# ResearchHub deployment and Supabase setup

This project uses Supabase Auth and Postgres for account registration, saved research briefs, and support requests. The Next.js frontend can build without credentials, but account and request persistence will remain disabled until the production environment is configured.

## 1. Vercel environment variables

In the **ResearchHub** Vercel project (`projectbiuld`), add these variables for Production. Add them to Preview/Development too if you want those environments to work:

| Variable | Value source | Required for |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL | Browser/server Supabase connection |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project's anon/public key | Sign-up, sign-in, session-aware user access |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service-role key | Server-side support-request storage and admin inbox |
| `NEXT_PUBLIC_SITE_URL` | `https://projectbiuld.vercel.app` | Canonical metadata URL |

Keep `SUPABASE_SERVICE_ROLE_KEY` encrypted and server-only. Never prefix it with `NEXT_PUBLIC_`, place it in client code, or commit its value to GitHub. After changing environment variables, redeploy the project so the Next.js build receives the public variables.

## 2. Apply the database SQL

- For a **new/empty Supabase database**, run `supabase/schema.sql` once in Supabase SQL Editor.
- If the base tables in `schema.sql` are already installed, run only `supabase/migrations/20261015_researchhub_project_drafts.sql` to add private saved-project storage and the safe profile trigger.

Do not repeatedly run the original `schema.sql` without first making its existing policy statements idempotent. The migration creates a `project_drafts` table with row-level security: each authenticated student can read and manage only their own drafts. New profiles are assigned the `customer` role server-side; user-supplied metadata never grants administrator access.

## 3. Configure Supabase Auth URLs

In Supabase Authentication URL Configuration, set the production Site URL to `https://projectbiuld.vercel.app`. Add that site's sign-in/confirmation redirect URL (`https://projectbiuld.vercel.app/login`) to the allowed redirect URLs. Add only the exact preview URLs you intend to use for testing.

## 4. Grant the first administrator

Create the trusted administrator's account through the ResearchHub sign-up page first. Then run this statement in the Supabase SQL Editor, replacing the placeholder with that exact account email:

```sql
update public.profiles as p
set role = 'admin'
from auth.users as u
where p.id = u.id
  and lower(u.email) = lower('YOUR-ADMIN-EMAIL@example.com');
```

Check that exactly one intended row was updated. Do not provide a public form or client-side control that lets users promote themselves to admin. Sign in and visit `/admin/requests` to access the private support-request inbox.

## 5. Verify the workflows

1. Sign up with an email you control and complete email confirmation if required.
2. Sign in and visit `/account`.
3. Build a planning brief, choose **Save to my account**, then check that it appears in `/account` and downloads only for the signed-in owner.
4. Submit a test request at `/request`. Only the request-success page should appear after the server confirms the database insert.
5. Sign in as the administrator and check the new record in `/admin/requests`; move its status through New, Reviewing, Responded, and Closed as appropriate.
6. Open a topic, download the editable Word guide, and run scholarly discovery. Verify publication metadata and read each original source before citing it.

## Current product boundaries

Topic packs are editable research-planning guides with suggested objectives, questions, literature themes, possible methods, and sample prompts. They are not represented as completed five-chapter reports, and the platform must not invent real-world data, sources, quotations, or results. Live publication discovery currently uses OpenAlex metadata and offers Google Scholar/Crossref search links as alternatives.

Automated email notifications, Paystack checkout, paid delivery of institution-approved full materials, and AI-generated long-form research assistance are not active merely because the frontend exists. Before enabling those flows, configure the relevant provider credentials, upload/license genuine source material, implement payment verification server-side, and test them end to end.
