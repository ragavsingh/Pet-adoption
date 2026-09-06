# 🐾 Pet Adoption Platform

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=black)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=flat-square&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL%2015-3ECF8E?style=flat-square&logo=supabase&logoColor=white)](https://supabase.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=flat-square&logo=vercel&logoColor=white)](https://vercel.com/)
[![License: MIT](https://img.shields.io/badge/License-MIT-amber.svg?style=flat-square)](LICENSE)

> **A mission-driven, full-stack digital platform connecting verified rescue providers and shelters with loving families.**  
> Built with a **Foster-to-Own bonding philosophy**, robust PostgreSQL backend, and enterprise-grade Row-Level Security (RLS).

---

## 🌟 Executive Overview

Traditional pet adoption often suffers from fragmented screening, high return rates, and a lack of structured transition support. **Pet Adoption Platform** solves this through a guided, digital-first adoption ecosystem featuring:

- **Foster-to-Own Bonding Trials**: A structured 14-day trial period before legal adoption, complete with daily welfare journals, live countdowns, extension requests, and consensus milestones.
- **Multi-Role Portals**: Tailored interfaces and workflows for **Adopters**, **Verified Rescue Shelters / Providers**, and **Platform Administrators**.
- **Official Adoption Certificates**: High-resolution, printable certificates generated upon adoption completion with confetti celebrations and PNG download options.
- **Full-Stack Cloud Architecture**: Powered by Supabase PostgreSQL with stored procedures (PL/pgSQL RPCs), Row-Level Security (RLS), realtime sync, and transactional email infrastructure.

---

## 🚀 Key Features

### 🐶 Adopter Experience
- **Interactive Pet Discovery**: Search and filter by species, breed, size, apartment compatibility, good with children/dogs/cats, and vaccination status.
- **Multi-Step Application & Verification**: Structured lifestyle questionnaire evaluating home environment, prior experience, and schedule commitment.
- **Foster-to-Own Dashboard**: Monitor your 14-day trial in real-time with day-by-day countdowns, daily care journal entries, and trial extension requests.
- **"Make It Official ❤️" Finalization**: Complete the trial, sign the adoption pledge, and unlock your personalized Certificate of Adoption.
- **Notification Inbox & Saved Pets**: Real-time notifications for status updates and a persistent favorites system.

### 🏠 Rescue Provider & Shelter Portal
- **8-Step Pet Intake Wizard**: Add pet listings with high-res photo uploads, personality tags, care routines, and temperament stats.
- **Applicant Screening Drawer**: Review applications, inspect lifestyle answers, communicate with applicants, and initiate 14-day foster trials.
- **Trial & Placement Oversight**: Track active trials, review journal updates, approve extension requests, or finalize completed adoptions.
- **Shelter Verification**: Build public trust through audited organization credentials and verified rescue badges.

### 🛡️ Platform Administration & Governance
- **Platform Analytics**: Real-time metrics tracking total listings, active trials, finalized adoptions, and pending verifications.
- **Provider Verification Queue**: Review shelter tax IDs, shelter facilities, and credentials before approving public listings.
- **Welfare Report Triage**: Handle user-flagged pet listings and rescue inquiries with resolve/dismiss workflows.
- **Security & RLS Hardening**: Database-level security ensuring users only access authorized records.

---

## 🛠️ Technology Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend Framework** | [React 18](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/) |
| **Styling & UI** | [Tailwind CSS](https://tailwindcss.com/) with custom warm palette (Dark Brown, Beige, Cream, Amber) |
| **Icons & Media** | [Lucide React](https://lucide.dev/), [Canvas-Confetti](https://www.npmjs.com/package/canvas-confetti), [html2canvas](https://html2canvas.hertzen.com/) |
| **Build & Bundling** | [Vite 5](https://vitejs.dev/) |
| **Database & Auth** | [Supabase](https://supabase.com/) (PostgreSQL 15, Row-Level Security, RPCs, Auth, Storage) |
| **Hosting & CI/CD** | [Vercel](https://vercel.com/) with automated GitHub branch deployments and SPA routing |

---

## 📁 Project Structure

```text
PET/
├── public/                       # Static brand assets & logo
│   ├── logo.png                  # High-resolution brand logo
│   └── logo-icon.png             # Paw-face favicon & app icon
│
├── src/
│   ├── components/               # Domain-driven modular components
│   │   ├── adopter/              # FosterTrialCard, AdoptionRequestModal, MakeOfficialModal
│   │   ├── provider/             # AddPetWizard, RequestReviewDrawer
│   │   ├── admin/                # Admin review drawers, user tables, audit queues
│   │   ├── certificate/          # AdoptionCertificate (printable & PNG download)
│   │   ├── common/               # Buttons, UserAvatar, Modal, StatusBadge, TrialCountdown
│   │   ├── discovery/            # PetFilterBar, PetFilterDrawer, search engine
│   │   └── layout/               # Navbar, Footer, AdopterLayout, ProviderLayout, AdminLayout
│   │
│   ├── contexts/                 # Global state providers (Auth, Favorites, Notifications, Toast)
│   ├── data/                     # Seeded companion data & mock fallbacks
│   ├── lib/                      # Supabase client configuration & TypeScript DB types
│   ├── pages/                    # 27+ routed pages across public, adopter, provider, & admin
│   ├── services/                 # Backend API services (adoption, pet, profile, email, sync)
│   ├── types/                    # Core TypeScript models (Pet, User, AdoptionRequest, Trial)
│   ├── utils/                    # Certificate downloader, image optimization, avatar helpers
│   ├── App.tsx                   # Master client-side router
│   ├── main.tsx                  # Application entrypoint
│   └── index.css                 # Tailwind directives & design tokens
│
├── supabase/
│   ├── migrations/               # PostgreSQL schema, RLS policies, triggers, and RPCs
│   └── functions/                # Deno Edge Functions for transactional emails
│
├── vercel.json                   # Single Page Application (SPA) rewrite rules
├── package.json                  # Dependencies & scripts
└── tailwind.config.js            # Design tokens & color system
```

---

## ⚡ Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18.0 or higher)
- [npm](https://www.npmjs.com/) or [yarn](https://yarnpkg.com/)

### Installation & Local Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/ragavsingh/Pet-adoption.git
   cd Pet-adoption
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
   *(The application automatically operates in demo mode if environment variables are omitted).*

4. **Start the Development Server**:
   ```bash
   npm run dev
   ```
   Open **`http://localhost:5173`** in your browser.

5. **Build for Production**:
   ```bash
   npm run build
   ```

---

## 🚢 Deployment (Vercel)

This project is pre-configured for instant deployment on [Vercel](https://vercel.com/):

1. Import the repository on Vercel (`ragavsingh/Pet-adoption`).
2. Framework Preset: **Vite**.
3. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Click **Deploy**.
5. Continuous Deployment is automatically enabled — any `git push` to `main` instantly triggers a live production release.

---

## 👤 Author

**Raghav Singh**  
GitHub: [@ragavsingh](https://github.com/ragavsingh)

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) — feel free to adapt and build upon it for animal rescue and welfare initiatives.
