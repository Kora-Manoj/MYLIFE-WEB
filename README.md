# MYLIFE — Unified Life Operating System

A privacy-first, offline-capable mobile and web application for personal life management. Built with React, TypeScript, Tailwind CSS, Lucide icons, and Vite PWA.

---

## 🌟 Modules & Features

1. **Money Management**
   - Bank & UPI statement review and automated parser
   - Income and expense tracking with category breakdown
   - Real-time balance and cash flow analysis
   - Monthly and yearly trend visualizations

2. **Knowledge Base**
   - Personal notes, ideas, book summaries, and snippets
   - Tagging, full-text search, and markdown support
   - Categorized by domains (Learning, Work, Tech, Personal)

3. **Health & Wellness**
   - Daily vitals tracking (sleep, steps, water, workouts, mood)
   - Habit streak tracker and consistency metrics
   - Medication and supplement schedules

4. **Document Vault**
   - Secure personal document management (IDs, policies, receipts, certificates)
   - Expiry reminders and document categorization

5. **Action Planning & Tasks**
   - Eisenhower Matrix priority planner (Urgent/Important)
   - Goal milestones, project checklists, and daily to-dos
   - Progress and velocity tracker

6. **Mobile First & PWA (Progressive Web App)**
   - Installable on iOS (Safari Add to Home Screen) and Android (Chrome Install)
   - Offline functionality with cached assets and service workers
   - Responsive touch gestures and native-feeling bottom navigation

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or bun

### Installation
```bash
git clone <your-repo-url>
cd mylife
npm install
```

### Development
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

### Production Build
```bash
npm run build
npm run preview
```

---

## 🛠️ Tech Stack

- **Framework**: React 19 (TypeScript)
- **Bundler**: Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **PWA**: vite-plugin-pwa (Web App Manifest + Service Worker)
- **Charts & Visuals**: Canvas & Tailwind UI components

---

## 📱 Mobile Installation (PWA)

- **Android**: Open the URL in Chrome, tap the menu (⋮) -> **Install app** or **Add to Home screen**.
- **iOS**: Open the URL in Safari, tap the Share button (⎋) -> **Add to Home Screen**.
