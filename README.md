# 🏙️ CivicConnect — Citizen-Driven Civic Engagement Platform  

[![Android](https://img.shields.io/badge/Platform-Android-green?logo=android)](https://developer.android.com/)
[![Firebase](https://img.shields.io/badge/Backend-Firebase-orange?logo=firebase)](https://firebase.google.com/)
[![Kotlin](https://img.shields.io/badge/Language-Kotlin-blueviolet?logo=kotlin)](https://kotlinlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

> Empowering citizens. Enhancing governance. One report at a time.  

---

## 📖 Overview  

**CivicConnect** is an Android application that enables citizens to report, track, and prioritize civic issues within their community.  
Powered by **Firebase** and **Google Gemini AI**, the platform uses AI-driven prioritization to help local authorities address the most critical issues efficiently.  

---

## ✨ Key Features  

### 🧭 Citizen Module  
- 📸 **Smart Issue Reporting** — Report issues with title, description, photo, and auto-detected location.  
- 📍 **Location Detection** — Integrates Google’s Fused Location Provider for accurate geotagging.  
- 🧠 **AI-Based Priority Scoring (Gemini API)** — Each report receives an urgency score between `0.0` (Low) and `1.0` (High).  
- 🗂️ **Meaningful Categories** —  
  `Roads & Infra`, `Street Lighting`, `Water & Drainage`, `Waste & Sanitation`,  
  `Public Spaces`, `Public Safety`, `Healthcare`, `Transport`, `Environment`, `Civic Services`.  
- 📄 **Status Tracking** — Follow issue progress (Pending → In Progress → Resolved).  
- 🔔 **Real-Time Updates** — Firestore listeners ensure live issue updates.  

---

### 🏛️ Administrator Module  
- 🗃️ **Centralized Dashboard** — Monitor all issues in real time.  
- 📊 **AI-Powered Sorting** — Automatically prioritizes critical issues for faster action.  
- 📝 **Resolution Workflow** — Admins can update issue status, add remarks, or mark duplicates.  
- 💬 **Transparency & Accountability** — Encourages open, citizen-driven civic improvement.  

---

## 🧩 Tech Stack  

| Layer | Technology |
|-------|-------------|
| **Frontend** | Kotlin (Android, Material Design 3) |
| **Backend** | Firebase Firestore, Firebase Storage, Firebase Authentication |
| **AI Integration** | Google **Gemini API** via Firebase Cloud Functions |
| **Cloud Hosting** | Firebase Cloud Functions v2 (Node.js 22 runtime) |
| **APIs Used** | Fused Location Provider, Geocoder |
| **Architecture** | MVVM + LiveData (lightweight) |

---

## 🧠 AI Prioritization Logic  

CivicConnect integrates Google Gemini 2.5 Flash through Firebase Cloud Functions to score reports by urgency.  

```js
// Simplified backend flow
Given (title, description):
  → Send to Gemini API with civic impact prompt
  → Parse response to float(0.0 – 1.0)
  → Return as `priorityScore` for Firestore document
```

Scores reflect **public safety, environmental risk, and civic importance** — ensuring administrators see the most urgent reports first.  

---

## 📸 Screenshots  

| 🏠 Home Page | 📝 Report Issue | 📋 My Issues |
|--------------|----------------|--------------|
| ![Home Page](screenshots/home-page.png) | ![Report Issue](screenshots/report-page.png) | ![My Issues](screenshots/issues-page.png) |

| 🔍 Issue Detail | 👤 Profile | 🧭 Admin Issue List | 🗂️ Admin Issue Detail |
|------------------|------------|---------------------|------------------------|
| ![Issue Detail](screenshots/issue-detail.png) | ![Profile](screenshots/profile-page.png) | ![Admin Issue List](screenshots/admin-viewlist.png) | ![Admin Issue Detail](screenshots/admin-issuedetail.png) |


---

## ⚙️ Setup & Deployment  

### 🧱 Prerequisites  
- Android Studio (Arctic Fox or later)  
- Firebase Project setup  
- Gemini API Key (via Firebase Functions secret)  

### 🧩 Steps  

```bash
# Clone the repository
git clone https://github.com/<your-username>/CivicConnect.git
cd CivicConnect

# Add Firebase config
/app/google-services.json

# Setup Firebase Cloud Functions
cd civicconnect-backend/functions
npm install
firebase functions:secrets:set GEMINI_API_KEY
firebase deploy --only functions
```

Then open the project in **Android Studio**, sync Gradle, and run on a device or emulator (SDK 24+).  

---

## 📊 Example Priority Scores  

| Example Report | Expected Priority |
|----------------|------------------|
| *“Broken streetlight near school”* | 0.8 |
| *“Overflowing garbage bin”* | 0.65 |
| *“Faded zebra crossing lines”* | 0.5 |
| *“Broken park bench”* | 0.3 |

---

## 🔮 Future Enhancements  

- 🧭 Map-based clustering for administrators  
- 🕵️ Duplicate issue detection using semantic similarity  
- 🧾 AI summaries of regional issue trends  
- 📈 Open data dashboard for transparency metrics  

---

## 👨‍💻 Contributors  

**Developed by:** Prakhyat Singh 
**Guided by:** Department of Computer Science — Lovely Professional University

---

> _CivicConnect — A step towards smarter, citizen-driven governance._
