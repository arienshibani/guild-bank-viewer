# 🏦 Guild Bank Viewer

A modern, responsive web application for managing and sharing World of Warcraft Classic bank character inventory via the web. 
Built with Next.js, Supabase, and Tailwind CSS.

Check it out here 👉 [https://guild-bank-viewer.vercel.app](https://guild-bank-viewer.vercel.app)

![Guild Bank Viewer](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)


### 🎯 **Core Functionality**
- **📦 Item Management**: Add, edit, and remove items and currency from guild bank slots
- **🔒 Password Protection**: Secure editing with per-bank passwords
- **📝 Admin Notes**: Public notes for bank alt names, event logs etc
- **🔗 Shareable Links**: Easy sharing with unique bank codes
- **⚡ Real-time Updates**: Instant synchronization across all viewers as soon as the manager makes changes.

### 🛡️ **Security & Privacy**
- **🔐 Secure Passwords**: SHA-256 hashed passwords with random salts
- **👁️ Public Viewing**: Anyone can view with the share code
- **✏️ Protected Editing**: Only password holders can modify contents
- **🔒 Database Security**: Supabase Row Level Security (RLS) enabled

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- Supabase account


### 📁 **Project Structure**
```
guild-bank-viewer/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   ├── bank/              # Bank pages
│   └── globals.css        # Global styles
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   └── *.tsx             # Feature components
├── lib/                  # Utilities and configurations
├── scripts/              # Database migration scripts
└── public/               # Static assets
```

### 🔧 **Key Technologies**
- **Next.js 14**: React framework with App Router
- **TypeScript**: Type-safe development
- **Supabase**: Backend-as-a-Service with PostgreSQL
- **Tailwind CSS**: Utility-first CSS framework
- **Lucide React**: Beautiful icon library
- **Wowhead API**: WoW item data and icons


---

<div align="center">

**⭐ Star this repository if you find it useful!**

Made with ❤️ for the WoW Classic community

[![GitHub stars](https://img.shields.io/github/stars/arienshibani/classic-guild-bank?style=social)](https://github.com/arienshibani/classic-guild-bank/stargazers)


</div>
