# 🍽️ BiteMap


Team Members: Dev Patel, Mahdi Ali, Muhammad Mir
**BiteMap** is a social restaurant discovery platform that lets users search for restaurants, track dining experiences, connect with friends, and earn achievements — all in one place.

---

## 🌿 Branching Strategy

All development should be done on **separate feature branches** — one branch per user story (or logical grouping). **Do not commit directly to `main`.**

### Branch Naming Convention

```
feature/<story-number>-short-description
```

**Examples:**
- `feature/1-anonymous-search`
- `feature/6-user-profile-setup`
- `feature/13-leveling-system`

### Workflow

1. Branch off from `main` (or a shared `dev` branch if one exists):
   ```bash
   git checkout main
   git pull
   git checkout -b feature/<story-number>-short-description
   ```
2. Implement the feature for your assigned story.
3. Open a **Pull Request (PR)** back into `main` (or `dev`) when complete.
4. Request at least **one code review** before merging.

---

## �️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **HTML** | Page structure and semantic markup |
| **CSS** | Styling, layout, and responsive design |
| **JavaScript** | Interactivity and client-side logic |

### Backend
| Technology | Purpose |
|------------|---------|
| **Supabase** | Database (PostgreSQL), authentication, and real-time API |

---

## �📋 User Stories

### 1. Core Search & Discovery

| # | User Story |
|---|------------|
| 1 | As a single/anonymous user, I want to search for restaurants, so that I can find a place to eat without needing to create an account. |
| 2 | As a user, I want to search for restaurants by specific cuisines (tags) and names, so that I can find exactly the type of food I'm craving. |
| 3 | As a user, I want to use a search bar to look up specific restaurant names, so that I can quickly find a business I already know. |
| 4 | As a user, I want to see tags like "Cheap" or "Good" on restaurant listings, so that I can make a decision based on value and quality. |
| 5 | As a user, I want to see a restaurant's website and address, so that I can get the information I need to visit. |

---

### 2. User Profiles & Social

| # | User Story |
|---|------------|
| 6 | As a registered user, I want to set up a personal profile, so that I can save my preferences and track my restaurant history. |
| 7 | As a user, I want to search for other user profiles, so that I can see what my friends are recommending. |
| 8 | As a user, I want to follow or add friends, so that I can stay updated on their dining activities. |
| 9 | As a user, I want to "match" with other profiles based on shared interests, so that I can discover like-minded food explorers. |

---

### 3. Ratings, Reviews & Personal Tracking

| # | User Story |
|---|------------|
| 10 | As a user, I want to rate restaurants and leave comments, so that I can share my experience with the community. |
| 11 | As a user, I want to tag restaurants as "Want to go," "Visited," or "Would go again," so that I can organize my personal dining map. |
| 12 | As a user, I want a personal dashboard (separate tab), so that I can view all my saved restaurants and activities in one place. |

---

### 4. Gamification & UX

| # | User Story |
|---|------------|
| 13 | As a user, I want to "level up" my profile through app activity, so that the experience of reviewing and visiting restaurants feels like a game. |
| 14 | As a user, I want to land on a dedicated landing page, so that I can clearly understand what BiteMap offers before I start searching. |
| 15 | As a user, I want to earn specific badges (e.g., "Sushi Scout" or "Super Eater"), so that I feel a sense of achievement for exploring different cuisines. |

---

## 🚀 Getting Started

> _(Setup and installation instructions will be added here as the project is configured.)_

---

## 👥 Team

> _(Team member names and assigned stories will be added here.)_

## Daily Workflow 

# Make sure you're on your dev branch before working
git checkout dev
# After making changes, commit and push
git add .
git commit -m "your message"
git push
# When ready to merge into main, open a PR on GitHub:
# dev → main
