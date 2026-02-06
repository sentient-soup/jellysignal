# JellySignal

A modern, minimalist media request tracker for Jellyfin.

## Features

- **Jellyfin SSO** - Sign in with your existing Jellyfin credentials
- **TMDB Search** - Search movies and TV shows with full metadata
- **Request Tracking** - Track what users want added to the library
- **Library Sync** - Auto-detect what's already available in Jellyfin
- **Voting System** - Upvote requests to prioritize what gets added
- **Multiple Themes** - Choose from Solar Flare, Deep Orbit, or Aurora

## Quick Start

### Prerequisites

- Docker and Docker Compose
- Jellyfin server with API key
- TMDB API key (free at https://themoviedb.org)

### Setup

1. Clone and navigate to the project:
   ```bash
   cd utils/jellyrequests
   ```

2. Copy the environment file and add your keys:
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. Start with Docker Compose:
   ```bash
   docker-compose up -d
   ```

4. Open http://localhost:3000 and sign in with Jellyfin credentials

## Environment Variables

| Variable | Description |
|----------|-------------|
| `JELLYFIN_URL` | URL to your Jellyfin server (e.g., `http://jellyfin:8096`) |
| `JELLYFIN_API_KEY` | Jellyfin API key (Dashboard > API Keys) |
| `TMDB_API_KEY` | TMDB API key for metadata |
| `SESSION_SECRET` | Random string for session encryption |
| `DATABASE_URL` | SQLite database path (default: `file:./data/jellysignal.db`) |

## Themes

JellySignal includes three beautiful color themes:

- **Solar Flare** - Warm orange & gold (perihelion-inspired)
- **Deep Orbit** - Cosmic purple & blue
- **Aurora** - Ethereal green & violet

Switch themes using the palette icon in the header.

## Development

```bash
# Install dependencies
npm install

# Generate database migrations
npm run db:generate

# Push schema to database
npm run db:push

# Start development server
npm run dev
```

## Tech Stack

- **Next.js 14** - React framework with App Router
- **Tailwind CSS** - Utility-first styling
- **shadcn/ui** - Accessible component library
- **Framer Motion** - Smooth animations
- **Drizzle ORM** - Type-safe database queries
- **SQLite** - Simple file-based database

## License

MIT
