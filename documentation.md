# BiteMap Project Architecture & Documentation

Welcome to the root level of the BiteMap project. This repository is built as a highly responsive, modern vanilla web application wrapped with the Vite build tool. The tech stack utilizes vanilla standard HTML/CSS/JS running on the frontend with Supabase handling the backend user data and authentication.

## Core Configuration Files
- **`index.html`**: The primary landing page and Vite's single developmental entry point. When users land on the domain unprotected by auth walls, they arrive here. It features the primary hero banners, marketing copy, and routes to discovery flows.
- **`package.json` & `package-lock.json`**: This defines all the npm dependencies. Crucially, it manages the `vite` dependency and the specific scripts for running the application.
- **`vite.config.js`**: The Vite configuration explicitly explicitly maps out all additional HTML entries. Without this setup file, Vite by default only maps the singular `index.html` file into its rollup bundle.
- **`.gitignore`**: Defines the exclusion rules preventing `.env` keys, `node_modules`, and compiled build outputs (`dist/`) from being bloated or exposed on GitHub.
- **`README.md`**: Main public-facing read component for development onboarding.

## Environment Runners
- **`run.bat` & `run.sh`**: Helper scripts tailored to quickly prepare the local development environment on different terminals (Windows vs. macOS/Linux).
- **`run_project.py`**: The underlying Python orchestration script that detects python runtime states and cascades commands to do `npm install` followed by `npm run dev`.

## Directory Overview
- **`data/`**: Datasets (like initial CSV seeds) meant to act as generic storage pools for geographic mapping records.
- **`pages/`**: All auxiliary site views wrapped behind logical barriers. Each file corresponds to a localized screen.
- **`public/`**: Stores static images and global elements like favicons and core identity logos. Everything here is resolved directly from the application's root `/` URL in Vite.
- **`src/`**: Houses all structured code containing the project’s intelligence across nested JS and CSS.
