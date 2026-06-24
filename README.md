# LinguaSwap

A language-learning web app for practising vocabulary. Create word libraries with translations
in multiple languages, then practise them in any direction (e.g. Spanish → English) with an
intelligent **Leitner** spaced-repetition algorithm and three difficulty levels. Tracks your
learning statistics.

## Tech stack

- **Frontend:** React + TypeScript (Vite)
- **Backend:** ASP.NET Core Web API (.NET 10), EF Core + SQLite, JWT auth

## Prerequisites

- [.NET 10 SDK](https://dotnet.microsoft.com/download)
- [Node.js LTS](https://nodejs.org)

## Getting started

Run the backend (from the repo root):

```bash
dotnet run --project backend/LinguaSwap.Api
```

- API: http://localhost:5299 · Swagger UI: http://localhost:5299/swagger

In a second terminal, run the frontend:

```bash
npm --prefix frontend install   # first time only
npm --prefix frontend run dev
```

- App: http://localhost:5173

## Features

- Multiple user accounts (register / login / manage your profile / delete account)
- Word libraries with full create/read/update/delete
- Words with translations across several languages
- Practice a library in a chosen direction with Easy / Medium / Hard difficulty
- Leitner spaced-repetition scheduling
- Learning statistics

See `CLAUDE.md` for development details and conventions.
