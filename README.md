# MediLink - Medical Appointment and Health Record System

## Overview
MediLink is a comprehensive medical appointment and health record management system built using the MERN stack (MongoDB, Express.js, React/Next.js, Node.js) for web and Kotlin with Jetpack Compose for mobile.

## Project Structure
```
medilink/
├── backend/     # Node.js/Express backend
├── web/         # React/Next.js frontend
├── mobile/      # Kotlin/Android app
└── .github/     # GitHub workflows and templates
```

## Features
- User authentication and role management (Patient, Doctor)
- Appointment booking and management
- Medical report upload with OCR
- Profile management
- Role-based dashboards

## Tech Stack
### Backend
- Node.js
- Express.js
- MongoDB
- JWT Authentication

### Web Frontend
- React
- Next.js
- Material-UI/Tailwind CSS

### Mobile
- Kotlin
- Jetpack Compose
- Android SDK

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- Android Studio
- JDK 11 or higher

### Installation
1. Clone the repository
2. Set up the backend:
   ```bash
   cd backend
   npm install
   ```
3. Set up the web frontend:
   ```bash
   cd web
   npm install
   ```
4. Set up the mobile app:
   - Open the mobile directory in Android Studio
   - Sync Gradle files

## Development
- Backend runs on: http://localhost:5000
- Web frontend runs on: http://localhost:3000
- Mobile app can be run on Android emulator or physical device

