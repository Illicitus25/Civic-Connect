🏙️ CivicConnect — Citizen-Driven Civic Engagement Platform

CivicConnect is an Android application designed to empower citizens to actively report, track, and prioritize civic issues within their communities. Built with Kotlin, Firebase, and Gemini AI, it bridges the communication gap between the public and local authorities through a transparent, data-driven reporting system.

🚀 Overview

CivicConnect allows users to report local problems such as potholes, broken streetlights, garbage accumulation, or safety hazards directly from their smartphones. Each report is enhanced with location, images, and an AI-generated priority score, helping civic administrators act efficiently on the most critical issues first.

✨ Key Features
🧭 Citizen Module

📸 Smart Issue Reporting – Users can submit issues with title, description, photo, and auto-detected location.

📍 Real-Time Location Integration – Auto-detects user’s current address via Google’s Fused Location Provider API.

🧠 AI-Based Priority Scoring (Gemini API) – Each report is analyzed by Google’s Gemini model to assess urgency from 0.0 (low) to 1.0 (high).

🗂️ Categorization by Type – Choose from meaningful civic categories:
Roads & Infra, Street Lighting, Water & Drainage, Waste & Sanitation,
Public Spaces, Public Safety, Healthcare, Transport, Environment, and Civic Services.

📄 Status Tracking – Monitor your submitted issues (Pending, In Progress, Resolved).

🔔 Real-Time Updates – Firebase Cloud Firestore listeners update issue status instantly.

🏛️ Administrator Module

🗃️ Centralized Dashboard – View all reported issues in real time.

📊 Priority-Based Sorting – Quickly identify high-urgency reports via AI-generated scores.

📝 Issue Verification & Resolution Workflow – Change issue status, add remarks, and track duplicates.

💬 Transparency & Accountability – Promotes open communication between citizens and administration.

🧩 Tech Stack
Layer	Technology
Frontend	Kotlin (Android, Material Design 3)
Backend	Firebase Firestore, Firebase Storage, Firebase Authentication
AI Integration	Google Gemini API (via Firebase Cloud Functions)
Cloud Hosting	Firebase Cloud Functions v2 (Node.js 22 runtime)
APIs Used	Fused Location Provider, Geocoder API
Architecture	MVVM + LiveData (lightweight implementation)
🧠 How the AI Prioritization Works

CivicConnect integrates Google Gemini 2.5 Flash via Cloud Functions:

// Simplified backend flow
Given (Title, Description):
  → Send to Gemini API with a system prompt
  → Parse response into float(0.0–1.0)
  → Return as `priorityScore` to Firestore


The prompt asks Gemini to evaluate urgency based on public safety, environmental risk, and civic impact, returning a normalized score.
This score directly influences sorting and visualization inside the admin dashboard.

📱 Screenshots
Citizen Reporting	Issue Feed	AI Priority in Action
🧾 Report an Issue	🗂️ Recent Issues	⚙️ AI-Generated Score

(Screenshots will be added in final upload — placeholders above.)

⚙️ Setup & Deployment

Clone the repository:

git clone https://github.com/<your-username>/CivicConnect.git
cd CivicConnect


Add your Firebase project configuration (google-services.json) under /app/.

Configure Firebase Functions:

cd civicconnect-backend/functions
npm install
firebase functions:secrets:set GEMINI_API_KEY
firebase deploy --only functions


Build and run the Android app from Android Studio (minimum SDK 24).

📊 Example Priority Scores
Example Report	Expected Priority
“Broken streetlight near school”	0.8
“Overflowing garbage bin”	0.65
“Faded road markings”	0.5
“Broken park bench”	0.3
💡 Future Enhancements

🧭 Route-based clustering for admin view (using Google Maps SDK).

🕵️ Report similarity detection (duplicate issue merging).

🧾 AI summarization of local issue trends.

🗳️ Open data portal for transparency metrics.

👨‍💻 Contributors

Developed by: [Your Name]
Guided by: Department of Computer Science — [Your College Name]
