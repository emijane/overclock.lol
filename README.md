# Overwatch LFG Platform

Find your duo. Build your team. Run scrims.

A structured Looking For Group (LFG) platform for Overwatch 2 that combines fast matchmaking with social profiles and threaded posts — built to replace messy Discord servers and unstructured LFG systems.

---

## Features

### Duo Finder
- Find long-term or casual duo partners
- Filter by rank, role, region, and playstyle
- Designed for consistent matchmaking, not one-off games

### Team Recruitment
- Create or join competitive teams
- Specify roles needed, rank range, and schedule
- Built for organized play and team growth

### Scrim Finder
- Coordinate team vs team scrims
- Set time, format (bo3, bo5), and rank requirements
- Easily find practice matches

### Threaded Posts
- Reddit-style discussions under every post
- Coordinate, ask questions, and respond directly
- Keeps communication structured and persistent

### Social Profiles
- Rank, peak rank, roles, and main heroes
- Availability and playstyle tags
- “Looking for” preferences (duo, team, scrims)

### Fast Filtering
- Role (Tank / DPS / Support)
- Rank (Bronze → GM)
- Region (NA / EU / etc.)
- Platform (PC / Console)
- Post type (Duo / Team / Scrim)

---

## Why This Exists

Discord LFG servers are:
- cluttered
- fast-moving
- hard to filter
- not built for long-term connections

This platform solves that by combining:
- structured LFG posts
- powerful filtering
- persistent threads
- user identity and profiles

---

## Core Idea

A Reddit-style Overwatch community focused specifically on duos, teams, and scrims.

Not a general forum.  
Not a chatroom.  
A purpose-built matchmaking and community platform.

---

## Tech Stack

- Frontend: Next.js + TypeScript + Tailwind CSS
- Backend: Supabase (Auth, Database, Realtime)
- Database: PostgreSQL (via Supabase)
- Realtime: Supabase subscriptions (for live LFG feed)

---

## Database Overview

### Users
- id
- username
- rank
- peak_rank
- region
- platform
- roles (array)
- heroes (array)
- bio

### Posts
- id
- user_id
- type (duo / team / scrim)
- title
- description
- rank
- roles_needed (array)
- region
- platform
- created_at

### Comments
- id
- post_id
- user_id
- parent_id
- content

### Join Requests
- id
- post_id
- user_id
- status (pending / accepted / rejected)

---

## Roadmap

### MVP
- [ ] Authentication
- [ ] Create posts (duo / team / scrim)
- [ ] Threaded comments
- [ ] Filtering system
- [ ] Basic user profiles
- [ ] Join/request system

### V2
- [ ] Real-time chat
- [ ] Notifications
- [ ] Reputation system
- [ ] Saved filters
- [ ] Mobile optimization

### V3
- [ ] Matchmaking algorithm
- [ ] Team dashboards
- [ ] Scrim history tracking
- [ ] Clip uploads / highlights

---

## Vision

To become the go-to platform for:
- finding consistent teammates
- building competitive teams
- organizing scrims efficiently

All in one place.

---

## Disclaimer

This project is not affiliated with or endorsed by Blizzard Entertainment or Overwatch.

---

## Contributing

Contributions are welcome.  
Feel free to open issues or submit pull requests.

---

## Status

In development — MVP coming soon