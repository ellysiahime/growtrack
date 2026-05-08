# GrowTrack <img src="./public/growtrack_logo.png" alt="GrowTrack Logo" width="40"/>

**GrowTrack** is a private AI-enhanced full-stack academic tracker built to help monitor a child’s educational progress — from exam schedules and subject scores to weekly timetables, performance trends, and AI-generated learning insights. 

Originally developed for private family use, it serves as a centralized academic dashboard with rich visual analytics, data-driven progress monitoring, and contextual AI feedback across multiple terms and school years.

---

## 🧰 Built With

- ⚡️ [Next.js](https://nextjs.org/) – React framework for full-stack web apps
- 🛠 [Supabase](https://supabase.com/) – Postgres database, Auth, RLS, and Storage  
- ✨ [OpenAI API](https://platform.openai.com/docs/overview) – AI-generated academic insights based on completed scored exams
- 💬 [Supabase Auth UI](https://supabase.com/docs/guides/auth/auth-helpers/nextjs) – Role-based authentication 
- 🎨 [Tailwind CSS](https://tailwindcss.com/) – Utility-first CSS framework   
- 📊 [Recharts](https://recharts.org/) – Lightweight charting library for data visualization  
- 💻 Built & developed in [Cursor](https://www.cursor.sh/) with AI pair programming

![Next.js](https://img.shields.io/badge/Next.js-000?logo=nextdotjs&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?logo=supabase&logoColor=white)
![OpenAI API](https://shields.io/badge/OpenAI-412991?style=flat&logo=openai&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/TailwindCSS-38B2AC?logo=tailwind-css&logoColor=white)
![Recharts](https://img.shields.io/badge/Recharts-888?logo=chart&logoColor=white)
![Vercel](https://img.shields.io/badge/Deployed%20on-Vercel-black?logo=vercel)

---

## 🚀 Features (MVP Complete)

### 📊 Dashboard  
- Overview of average scores across all subjects (all-time) 
- Latest exam results  
- Upcoming exams calendar 
- Subjects performance chart showing top-performing subjects by rank
- Quick access to AI Insight generation from the homepage

### 📅 Exam Calendar  
- Define exam periods (Term 1/2/3, Midterm/Final) with start & end dates
- Add subject-specific exam schedules tied to each period
- View exams in calendar widget

### 📈 Score Tracker  
- Record marks per subject under a specific exam period
- Bar chart view by class, term, or average year  
- Line chart for progress over time filtered by subject 
- Excludes non-numeric results (e.g., "Pass" for Art) from charts

### 📚 Subject Manager  
- Add and manage all subjects  
- Fully synced with scores, exam schedules and timetable  
- Integrated with Supabase and protected via RLS (Row Level Security)  

### 🕒 Weekly Timetable  
- Editable timetable grid  
- Assign subjects to time slots by day  
- Subjects populated from Subject Manager 

### ✨ AI Insight Dashboard
- Dedicated AI Insight page with strengths, weaknesses, study recommendations, notable trends, and motivational feedback
- Uses all completed exam periods that contain numeric scores
- Ignores future or unfinished exams, and does not regenerate when there is no newly eligible academic data
- Loads the latest saved insight from Supabase and only calls OpenAI when the user clicks `Generate AI Insight`

### 📱 Mobile-Responsive UI  
- Fully responsive for phones, tablets, and desktops
- Optimized layout for narrow screens (charts adapt as needed)  

### 🔐 Authentication  
- Supabase Auth with role-based access: 
  - `Owner` (author): Full access to add/edit/delete
  - `Other users` (guests): Read-only access  

---

## 🌐 Live Demo

View with Read-only access 👉 [https://growtrack-kappa.vercel.app](https://growtrack-kappa.vercel.app)

---

## 🔭 Future Roadmap (Phase 2)

- 📝 Diary or daily log for notes and reflections  
- 💰 Allowance tracker and expense log
- 📋 Printable reports or export to PDF
- 📅 Event reminders for non-academic activities  

---

## 🙌 Author Note

GrowTrack is not a commercial product or SaaS platform—it's a **custom-built private tool** tailored to support my child’s academic development. If you're a parent, guardian, or educator interested in building something similar, feel free to take inspiration or fork it as a starting point!

---
