# ClarifySQL

ClarifySQL is an AI-powered text-to-SQL tool that clarifies ambiguities before generating queries. It ensures accurate results by asking users the right questions when their intent is unclear (e.g., distinguishing "Apple" the brand from "Apple" the company).

## Architecture

```mermaid
graph TD
    User([User]) --> Frontend[Frontend (Next.js)]
    Frontend --> Backend[Backend (FastAPI)]
    Backend --> LLM[LLM / Gemini]
    Backend --> Database[(PostgreSQL)]
```

## Setup Instructions

### Prerequisites
- Python 3.10+
- PostgreSQL
- Node.js (for frontend)

### Database Setup
1. Create a PostgreSQL database named `clarifysql`
   ```sql
   CREATE DATABASE clarifysql;
   ```

### Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows use: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Copy environment template and fill in variables:
   ```bash
   cp .env.example .env
   ```
5. Initialize the database and seed data:
   ```bash
   python -m app.db.init_db
   ```
6. Run the server:
   ```bash
   uvicorn app.main:app --reload
   ```

### Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

- `DATABASE_URL`: Connection string to PostgreSQL (e.g., `postgresql+asyncpg://postgres:postgres@localhost:5432/clarifysql`)
- `LLM_PROVIDER`: Choose from `gemini`, `openai`, or `groq`
- `GEMINI_API_KEY`: Required if using Gemini
- `OPENAI_API_KEY`: Required if using OpenAI
- `GROQ_API_KEY`: Required if using Groq
- `QUERY_TIMEOUT`: Max query execution time in seconds
- `MAX_ROWS`: Limit the number of rows returned by queries

## Tech Stack
- **Backend**: FastAPI, SQLAlchemy (Async), asyncpg, Pydantic, SQLGlot
- **Database**: PostgreSQL
- **AI Models**: Gemini, OpenAI, Groq
