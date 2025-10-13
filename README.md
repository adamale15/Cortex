# Cortex - AI-Powered Universal Learning Assistant

Cortex is an intelligent learning platform that captures, organizes, and helps you learn from everything you encounter. Using advanced AI and context synthesis, it becomes your personal knowledge assistant.

## 🚀 Features

- **Multi-format Data Storage** - Notes, files, videos, audio, PDFs, bookmarks, and more
- **AI-Powered Chat** - Ask questions about your content using advanced AI
- **Smart Summarization** - Automatic content summarization
- **Voice Notes** - Record and transcribe audio
- **Drag & Drop Upload** - Easy content addition
- **Related Content** - AI-powered recommendations
- **Daily Reminders** - "Do This Day" recall features
- **Cross-Platform** - Works seamlessly across devices

## 🛠️ Tech Stack

### Frontend
- **Next.js 14** - React framework with App Router
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Beautiful, accessible components
- **Framer Motion** - Smooth animations
- **Zustand** - State management
- **TanStack Query** - Server state management
- **Tiptap** - Rich text editor

### Backend
- **Supabase** - Backend-as-a-Service (Auth, Database, Storage)
- **PostgreSQL** - Primary database with vector support
- **Edge Functions** - Serverless functions

### AI & ML
- **OpenAI/Anthropic** - LLM APIs
- **Vector Database** - For RAG implementation

### Integrations
- **Stripe** - Payment processing
- **Resend** - Transactional emails
- **Upstash** - Rate limiting
- **PostHog** - Analytics
- **Sentry** - Error tracking

## 📦 Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn or pnpm
- Supabase account
- OpenAI/Anthropic API key (for AI features)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd cortex
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set up environment variables**
   
   Copy the example env file and fill in your values:
   ```bash
   cp .env.example .env.local
   ```

   Required environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anon/public key
   - `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key
   - `OPENAI_API_KEY` or `ANTHROPIC_API_KEY` - For AI features

4. **Set up Supabase**
   
   - Create a new project at [supabase.com](https://supabase.com)
   - Run the database migrations (coming soon)
   - Enable Row Level Security (RLS) policies

5. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎨 Adding UI Components

This project uses shadcn/ui. To add components:

```bash
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add dialog
# etc.
```

## 📁 Project Structure

```
cortex/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   ├── (auth)/            # Authentication pages
│   ├── (dashboard)/       # Dashboard pages
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Home page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   └── providers.tsx     # Context providers
├── lib/                   # Utility functions
│   ├── supabase/         # Supabase clients
│   └── utils.ts          # Helper functions
├── store/                 # Zustand stores
├── types/                 # TypeScript types
└── public/               # Static assets
```

## 🔒 Environment Variables

See `.env.example` for all required environment variables.

**Never commit `.env.local` to version control!**

## 🚢 Deployment

### Deploy to Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add environment variables
4. Deploy!

### Other Platforms

This is a standard Next.js app and can be deployed to:
- Netlify
- Railway
- Render
- Any platform supporting Node.js

## 📝 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run type-check` - Run TypeScript type checking

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

[Your chosen license]

## 🔗 Links

- [Documentation](link-to-docs)
- [Live Demo](link-to-demo)
- [Report Bug](link-to-issues)
- [Request Feature](link-to-issues)

## 💡 Roadmap

- [ ] Mobile apps (iOS/Android)
- [ ] Browser extension
- [ ] Advanced AI features
- [ ] Team collaboration
- [ ] API for third-party integrations

---

Built with ❤️ using Next.js, Supabase, and AI

