# ResearchHub — Academic Project Materials

A responsive academic project-topic catalogue and research-material storefront built with Next.js App Router, Supabase, Cloudinary, and Paystack (Nigeria-first payment flow).

## Features
- Searchable project topics and departments
- Topic detail pages and material request workflow
- Supabase authentication and role-based admin foundation
- Admin-managed departments, topics, orders, and content
- Cloudinary upload integration for authorized cover/document assets
- Paystack checkout initialization and webhook verification
- SEO metadata, responsive layouts, and accessible UI

## Setup
1. Install Node.js 20+ and run npm install.
2. Copy .env.example to .env.local and fill in Supabase, Cloudinary, and Paystack credentials.
3. Apply supabase/schema.sql to your Supabase project.
4. Run npm run dev.

Payment and private document delivery require valid provider credentials and production webhook configuration; never store secret keys in client-side code.

## Environment variables
See .env.example.
