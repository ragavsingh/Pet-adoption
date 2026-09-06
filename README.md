# 🐾 PET ADOPTION — Frontend Platform

**Academic Mini-Project (Semester V)**  
*Department of Computer Science & Engineering, Quantum University, Roorkee*  
**Team**: Raghav Singh, Shreyansh Tripathi, Rahul Kumar Sharma, Badal Kumar  
**Supervisors**: Mr. Deepak Bhatt & Mr. Ankush

---

## 📁 Systematic Project Structure (Easy & Non-Hectic to Edit)

This project has been systematically organized so that any team member can easily locate and edit components, pages, services, styles, or mock data without confusion.

```text
PET/
├── public/                       # Static brand assets & logo
│   ├── logo.png                  # High-resolution brand logo (Dark brown paw + warm beige face)
│   ├── logo-icon.png             # Paw-face favicon & app icon
│   ├── logo-on-dark.png          # Logo variant for dark backgrounds
│   └── logo-on-beige.png         # Logo variant for beige backgrounds
│
├── src/
│   ├── components/               # All UI Components (Categorized by domain)
│   │   ├── adopter/              # Components used exclusively by Adopters
│   │   │   ├── AdoptionRequestModal.tsx   # Multi-step application submission popup
│   │   │   ├── FosterTrialCard.tsx        # 14-day Foster-to-Own countdown & journal
│   │   │   └── RequestTimeline.tsx        # 4-stage adoption progression timeline
│   │   │
│   │   ├── certificate/          # Official Adoption Milestone
│   │   │   └── AdoptionCertificate.tsx    # Printable Certificate of Adoption with confetti
│   │   │
│   │   ├── common/               # Universal Reusable Components
│   │   │   ├── Button.tsx                 # Pill-shaped brand buttons (variants: primary, secondary, cream, outline, ghost)
│   │   │   ├── DemoRoleBar.tsx            # Floating 1-click role switcher (Adopter, Provider, Admin, Visitor)
│   │   │   ├── Logo.tsx                   # Brand logo with text and tagline
│   │   │   ├── Modal.tsx                  # Accessible dialog modal
│   │   │   ├── PetCard.tsx                # Pet card with photo, badges, tags, and heart favorite
│   │   │   ├── ReportModal.tsx            # Welfare report dialog
│   │   │   └── StatusBadge.tsx            # Pill status badges (Available, Adopted, Pending, etc.)
│   │   │
│   │   ├── discovery/            # Pet Search & Filtering
│   │   │   ├── PetFilterBar.tsx           # Desktop sticky filter bar (species, breed, size, habits)
│   │   │   └── PetFilterDrawer.tsx        # Mobile slide-out filter drawer
│   │   │
│   │   ├── layout/               # Page wrappers & navigation
│   │   │   ├── Navbar.tsx                 # Sticky blur navigation with profile & notification preview
│   │   │   ├── Footer.tsx                 # 4-column footer with academic citation
│   │   │   ├── PublicLayout.tsx           # Layout for landing & visitor pages
│   │   │   ├── AdopterLayout.tsx          # Layout for Adopter portal with sub-nav
│   │   │   ├── ProviderLayout.tsx         # Layout for Provider portal with sub-nav
│   │   │   └── AdminLayout.tsx            # Layout for Admin governance portal
│   │   │
│   │   └── provider/             # Components used exclusively by Pet Providers
│   │       ├── AddPetWizard.tsx           # 8-step pet listing wizard with photo previews
│   │       └── RequestReviewDrawer.tsx    # Slide-over drawer to review & approve applicants
│   │
│   ├── contexts/                 # Global UI State Providers
│   │   ├── AuthContext.tsx       # Simulates user login/logout and role switching
│   │   ├── FavoritesContext.tsx  # Manages saved/favorited pets with heart animation
│   │   ├── NotificationsContext.tsx # Manages in-app notification count and read states
│   │   └── ToastContext.tsx      # Slide-in toast alerts (success, error, heart, info)
│   │
│   ├── data/                     # Mock Database (50+ realistic pets)
│   │   └── mockData.ts           # 50 fully detailed Indian dog & cat profiles, demo users, requests
│   │
│   ├── pages/                    # Routed Application Pages
│   │   ├── public/               # Public Visitor Pages
│   │   │   ├── HomePage.tsx               # 13-section landing page
│   │   │   ├── PetsPage.tsx               # Pet discovery catalog with filters & search
│   │   │   ├── PetDetailsPage.tsx         # Full pet profile, gallery, health, and provider insight
│   │   │   ├── HowItWorksPage.tsx         # 4-step Foster-to-Own guide
│   │   │   ├── AboutPage.tsx              # Mission, zero-breeder policy, and university credits
│   │   │   ├── ForProvidersPage.tsx       # Shelter tools and verification guide
│   │   │   └── ContactPage.tsx            # Contact form and emergency rescue info
│   │   │
│   │   ├── auth/                 # Authentication Pages
│   │   │   ├── LoginPage.tsx              # Login page with 1-click demo fill buttons
│   │   │   ├── SignupPage.tsx             # Signup with "I WANT TO ADOPT" vs "I WANT TO LIST" fork
│   │   │   ├── ForgotPasswordPage.tsx     # Password recovery form
│   │   │   └── ResetPasswordPage.tsx      # New password creation
│   │   │
│   │   ├── adopter/              # Adopter Portal Pages
│   │   │   ├── AdopterDashboard.tsx       # "My Adoption Journey" with stats & active trial
│   │   │   ├── AdopterProfilePage.tsx     # 80% completion indicator & lifestyle edit form
│   │   │   ├── AdopterFavoritesPage.tsx   # Saved pets gallery
│   │   │   ├── AdopterRequestsPage.tsx    # List of submitted adoption applications
│   │   │   ├── AdopterRequestDetailsPage.tsx # Request timeline, notes, & foster countdown
│   │   │   ├── AdopterAdoptionsPage.tsx   # Completed adoptions & certificate links
│   │   │   ├── AdopterNotificationsPage.tsx # Notification inbox with "Mark All Read"
│   │   │   └── AdopterSettingsPage.tsx    # Privacy and alert preferences
│   │   │
│   │   ├── provider/             # Pet Provider Portal Pages
│   │   │   ├── ProviderDashboard.tsx      # "Good evening, Sarah 👋" with stats & quick actions
│   │   │   ├── ProviderPetsPage.tsx       # Manage listings with Pause, Resume, Delete
│   │   │   ├── AddPetPage.tsx             # Page hosting the 8-step Add Pet Wizard
│   │   │   ├── EditPetPage.tsx            # Edit pet listing details
│   │   │   ├── ProviderRequestsPage.tsx   # Incoming applications list & review drawer trigger
│   │   │   ├── ProviderAdoptionsPage.tsx  # Completed adoptions by this provider
│   │   │   ├── ProviderProfilePage.tsx    # Verified rescue NGO profile
│   │   │   ├── ProviderNotificationsPage.tsx # Provider alert notifications
│   │   │   └── ProviderSettingsPage.tsx   # Shelter intake criteria & video verification
│   │   │
│   │   ├── admin/                # Admin Portal Pages
│   │   │   ├── AdminDashboard.tsx         # 9 platform metrics labeled DEMO DATA & charts
│   │   │   ├── AdminUsersPage.tsx         # User table (adopters and shelters)
│   │   │   ├── AdminProvidersPage.tsx     # Shelter verification queue
│   │   │   ├── AdminPetsPage.tsx          # All pets overview
│   │   │   ├── AdminRequestsPage.tsx      # Adoption request audit log
│   │   │   ├── AdminReportsPage.tsx       # Welfare reports with Resolve & Dismiss buttons
│   │   │   └── AdminSettingsPage.tsx      # 1-click button to reset & reseed mock data
│   │   │
│   │   └── AdoptionSuccessPage.tsx # "IT'S OFFICIAL ❤️" certificate celebration
│   │
│   ├── services/                 # Business Logic & Backend-Ready Interfaces
│   │   ├── petService.ts         # Pet search, filters, CRUD, and status updates
│   │   ├── adoptionService.ts    # Request lifecycle, 14-day foster trials, journal notes
│   │   ├── favoriteService.ts    # Favorites toggling
│   │   ├── notificationService.ts # In-app alerts
│   │   └── reportService.ts      # Flagged listings moderation
│   │
│   ├── types/                    # Clean TypeScript Definitions
│   │   ├── pet.ts                # Pet, species, health, stats, provider insight types
│   │   ├── user.ts               # User, AdopterProfile, ProviderProfile types
│   │   ├── adoptionRequest.ts    # AdoptionRequest, Trial, TimelineStep types
│   │   ├── notification.ts       # AppNotification types
│   │   └── report.ts             # ReportItem types
│   │
│   ├── App.tsx                   # Master router connecting all 27+ routes
│   ├── main.tsx                  # React DOM entry point with all Context providers
│   └── index.css                 # Tailwind CSS & custom animations
│
├── package.json                  # Dependencies: React 18, Vite, Tailwind, Lucide, Canvas-Confetti
└── tailwind.config.js            # Custom color palette (Dark Brown, Warm Beige, Cream, Off-White)
```

---

## ⚡ How to Run the Project

Open a terminal (PowerShell or Command Prompt) inside this `PET` directory:

```bash
# 1. Start the development server
npm run dev

# 2. Build for production (checks for zero TypeScript errors)
npm run build
```

The app will be available at **`http://localhost:5173/`**.

---

## 🎯 How to Make Changes Without Headache

| If you want to change... | Go to this file: |
| :--- | :--- |
| **Add / Edit Pets, Descriptions, Photos** | `src/data/mockData.ts` |
| **Colors, Brand Palette, Shadows** | `tailwind.config.js` |
| **Navbar Links or Header Look** | `src/components/layout/Navbar.tsx` |
| **Footer, Team Names, Supervisors** | `src/components/layout/Footer.tsx` or `src/pages/public/AboutPage.tsx` |
| **Landing Page Content & Hero** | `src/pages/public/HomePage.tsx` |
| **How It Works Steps** | `src/pages/public/HowItWorksPage.tsx` |
| **Pet Details Layout & Provider's Insight**| `src/pages/public/PetDetailsPage.tsx` |
| **Certificate of Adoption Design** | `src/components/certificate/AdoptionCertificate.tsx` |
| **Role Switcher Floating Bar** | `src/components/common/DemoRoleBar.tsx` |
| **Backend Integration (Connecting Supabase)**| `src/services/` (Replace `localStorage` calls with `supabase` calls) |
