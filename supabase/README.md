# Pet Adoption — Supabase Database Architecture & Migrations

This directory contains the production-oriented relational schema, Row Level Security (RLS) authorization policies, and automated security verification tests for the Pet Adoption platform.

---

## 📁 Migration Files

1. [`migrations/20260904120000_create_pet_adoption_schema.sql`](file:///c:/Users/ragha/OneDrive/Desktop/PET/supabase/migrations/20260904120000_create_pet_adoption_schema.sql)
   - Full relational schema covering all 14 core tables, foreign keys, cascade rules, check constraints, performance indexes, timestamps auto-updater, and `auth.users` registration trigger.

2. [`migrations/20260904130000_enable_row_level_security.sql`](file:///c:/Users/ragha/OneDrive/Desktop/PET/supabase/migrations/20260904130000_enable_row_level_security.sql)
   - Enables RLS on all 14 application tables.
   - Implements non-recursive database-level `is_admin()` and `get_current_user_role()` helper functions (`SECURITY DEFINER` with fixed `search_path`).
   - Privilege escalation triggers blocking unauthorized client role updates (`role = 'admin'`), provider self-verification, trial date manipulation, and direct adoption request approvals.
   - Enforces strict public vs. private boundaries using `auth.uid()`.

3. [`tests/rls_security_tests.sql`](file:///c:/Users/ragha/OneDrive/Desktop/PET/supabase/tests/rls_security_tests.sql)
   - Automated 15-scenario test suite validating public reading, anonymous restrictions, cross-user read/write isolation, privilege escalation prevention, and audit immutability.

---

## 🏗️ Table Architecture & Entity Relationships

```
auth.users
   │ (1:1 ON DELETE CASCADE)
   ▼
profiles
   ├── adopter_profiles (1:1 child table)
   └── provider_profiles (1:1 child table)
         │
         ├── provider_verifications (1:N audit / review records)
         │
         └── pets (1:N provider listings)
               │
               ├── pet_images (1:N gallery ordering, primary image flag)
               │
               ├── favorites (M:N adopter <-> pet, UNIQUE constraint)
               │
               └── adoption_requests (adopter <-> pet <-> provider)
                     │
                     └── adoptions (official adoption certificate record)
                           │
                           └── foster_trials (Foster-to-Own / trial period)
                                 │
                                 └── trial_extension_requests (3, 7, 14 days)
```

Platform Wide:
- `notifications`: User inbox for timeline/request/trial milestones.
- `reports`: Moderation reports for suspicious listings or behavior.
- `audit_logs`: Immutable state change traceability for requests, approvals, and trials.

---

## 🚀 How to Apply Migrations

### Option A: Supabase Dashboard (Fastest / Recommended)
1. Open your project on [supabase.com](https://supabase.com/dashboard).
2. Go to the **SQL Editor** tab from the left sidebar.
3. Click **New query**.
4. Paste and run [`supabase/migrations/20260904120000_create_pet_adoption_schema.sql`](file:///c:/Users/ragha/OneDrive/Desktop/PET/supabase/migrations/20260904120000_create_pet_adoption_schema.sql).
5. Open another query, paste and run [`supabase/migrations/20260904130000_enable_row_level_security.sql`](file:///c:/Users/ragha/OneDrive/Desktop/PET/supabase/migrations/20260904130000_enable_row_level_security.sql).
6. To run the automated security tests, paste and run [`supabase/tests/rls_security_tests.sql`](file:///c:/Users/ragha/OneDrive/Desktop/PET/supabase/tests/rls_security_tests.sql) (runs in a self-contained transaction and rolls back).

### Option B: Supabase CLI
```bash
npx supabase db push
```

---

## 🛡️ Security & Role Assignment Rules
- **Public Signup**: Handled via `auth.users` trigger (`handle_new_user()`). Restricts role assignment strictly to `'adopter'` or `'provider'`.
- **Role Immutability**: Protected by `trg_prevent_role_escalation`. Normal users cannot modify their `role` column via client updates.
- **Admin Verification**: Computed strictly via `public.is_admin()`, querying database records rather than trusting client state or headers.
- **Adoption Finalization & Trials**: State transitions to `'approved'`, `'completed'`, or altering trial dates are intercepted and restricted to server-side workflows.
