# CodeLens v5

AI-powered code error detector with step-by-step solutions.
Uses **Groq (free)** + **Llama-3.3-70b** for fast, accurate analysis.

## Supported Languages

| Language   | Error Types Detected |
|------------|----------------------|
| Python     | syntax, logical, conceptual, runtime, type, security |
| JavaScript | conceptual, logical, runtime, type, security |
| TypeScript | type, conceptual, runtime, logical |
| Java       | syntax, runtime, conceptual, type, security |
| C          | security, logical, runtime, type |
| C++        | security, logical, runtime, type |
| C#         | runtime, type, conceptual, logical |
| SQL        | logical, security, conceptual |
| HTML       | syntax, conceptual |
| CSS        | syntax, conceptual |

## Setup

### 1. Get Free Groq API Key
1. Go to **https://console.groq.com**
2. Sign up (free)
3. Click **API Keys** → **Create Key**
4. Copy the key (starts with `gsk_`)

### 2. Backend

```bash
cd backend
pip install -r requirements.txt
cp .env.example .env
# Open .env and paste your key:
# GROQ_API_KEY=gsk_your_key_here
python app.py
```

Backend runs at http://localhost:5000

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173

## API Reference

### POST /api/analyze

```json
{
  "code": "def foo()\n    pass",
  "language": "python",
  "mode": "specification"
}
```

**Response fields:**
- `has_error` — true/false
- `detected_language` — auto-detected language name
- `error_type` — syntax | logical | conceptual | runtime | type | security | none
- `severity` — low | medium | high | none
- `error_line` — line number or null
- `error_description` — what the error is
- `misconception` — what the programmer misunderstood
- `explanation` — beginner-friendly explanation
- `fix_suggestion` — corrected snippet for primary error
- `corrected_full_code` — complete fixed code
- `step_by_step_solution` — array of {step, description, before, after}
- `additional_errors` — array of other errors found
- `learning_tip` — tip to avoid this mistake

### POST /api/run
Runs Python code only (live execution).
```json
{ "code": "print('hello')", "stdin": "", "language": "python" }
```

### GET /api/examples
Returns 20 example code snippets with intentional bugs.

### GET /api/health
Returns API status and model info.

## Deployment (Render + Vercel)

**Backend on Render:**
- Build: `pip install -r requirements.txt`
- Start: `gunicorn app:app`
- Env var: `GROQ_API_KEY=gsk_...`

**Frontend on Vercel:**
- Update `frontend/src/utils/api.js` → set `BASE` to your Render URL
