# Shijian — Lost & Found

Shijian (拾见) is a multilingual lost-and-found application for communities. People can post a lost or found item, browse related clues, and contact one another to arrange a return.

## Highlights

- Publish a lost or found item with a photo, category, approximate location, time, and identifying details.
- Browse public community records and review ranked match suggestions.
- Compare clues written in different languages using English-normalized text when available.
- Use AI-assisted photo analysis and image comparison to help identify distinctive item features.
- Contact a record owner through a private in-app request.
- Receive in-app notifications for new contact requests, match confirmations, and return updates.
- Manage, close, or delete your own records.
- Confirm a suggested match and mark an item as returned after both parties confirm the handover.
- Use the responsive interface on desktop and mobile.

## How matching works

The application first ranks opposite-type records using details such as category, location, time, color, and item description. When AI services are configured and available, it can also normalize submitted text for cross-language comparison, analyze item photos, and compare photos among the strongest candidates.

Match results are suggestions, not proof that two posts refer to the same item. The two record owners confirm the match and later confirm the return separately.

## Languages

The interface supports English (default), Simplified Chinese, Malay, Tamil, and Thai. The selected language is saved in the current browser.

## Technology

| Area | Technologies |
| --- | --- |
| Frontend | React 18, Vite, Three.js, Lucide React |
| Backend API | Python, FastAPI |
| Local storage | SQLite and the local file system |
| Hosted storage and authentication | Neon and Vercel Blob |
| AI-assisted analysis | DeepSeek API |

## Run locally

### Requirements

- Node.js 20 or later
- Python 3.10 or later

### 1. Start the API

In the project root, create a Python environment and install the backend packages:

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### 2. Start the frontend

Open a second terminal in the project root:

```powershell
npm install
npm run dev
```

Open <http://localhost:5173>. The Vite development server forwards API and uploaded-image requests to the local FastAPI server.

The API documentation is available at <http://localhost:8000/docs>, and the health endpoint is <http://localhost:8000/api/health>.

Authentication is required for publishing and managing personal records. AI-assisted analysis requires the backend service to be configured; credentials belong in the local or hosting environment and should never be committed to the repository.

## Privacy notes

- Photos and clue details appear on the public community board. Do not include home addresses, identity numbers, or other sensitive details in a post.
- Contact requests and match updates appear in the notification inbox and My Records. The app does not send email or browser push notifications.
- When AI analysis is enabled, submitted photos and text are sent to DeepSeek for analysis and matching support. The original text remains the version shown in the application.
- AI scores can be incomplete or incorrect. Users should verify item details and arrange the handover themselves.

## Project structure

```text
app/                 FastAPI application and matching logic
frontend/            React pages, components, styles, and translations
public/              Built frontend assets served by the application
scripts/             Data preparation and evaluation utilities
requirements.txt     Python dependencies
package.json         Frontend dependencies and commands
vite.config.js       Frontend development and build configuration
```

## Available commands

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite development server |
| `npm run build` | Build the frontend into `public/` |
| `python -m uvicorn app.main:app --reload --port 8000` | Start the local FastAPI API |
