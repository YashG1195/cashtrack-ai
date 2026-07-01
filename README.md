# Cashtrack AI 💰

An AI-powered personal finance tracker built with Next.js and Firebase.

🔗 **Live App:** [https://cashtrack-ai.vercel.app/](https://cashtrack-ai.vercel.app/)

## Features

- 📊 Expense & income tracking with interactive charts
- 💼 Budget management with category-based limits
- 🎯 Savings goals with progress tracking
- 🤖 AI Financial Advisor powered by generative AI
- 🔐 Secure authentication via Firebase Auth
- 🌙 Dark mode first, gold-themed UI

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Auth & Database:** Firebase Authentication + Firestore
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

## Getting Started (Local Development)

1. Clone the repository:
```bash
git clone https://github.com/YashG1195/cashtrack-ai.git
cd cashtrack-ai
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file in the root with your Firebase config:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

4. Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## Deploy on Vercel

The live version is hosted at [https://cashtrack-ai.vercel.app/](https://cashtrack-ai.vercel.app/).

To deploy your own instance, import the repo on [Vercel](https://vercel.com) and add the Firebase environment variables in the project settings.
