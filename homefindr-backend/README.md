# HomeFindr Backend API

Nigeria's premier real estate platform — FastAPI backend powering search, listings, offers, payments, messaging, and scheduling across Lagos, Abuja, Port Harcourt, Benin City, and Jos.

---

## Tech Stack

| Layer | Choice | Why |
|---|---|---|
| Framework | **FastAPI 0.115** | Async-native, auto-docs, Pydantic v2 |
| Database | **PostgreSQL** (Railway) | ACID, JSON columns, full-text search |
| ORM | **SQLAlchemy 2.0** async | Type-safe, async-first |
| Migrations | **Alembic** | Autogenerate from models |
| Auth | **JWT** (HS256) + Google OAuth | Stateless, refresh token rotation |
| Real-time | **Socket.IO** (python-socketio) | Buyer ↔ agent live chat |
| Payments | **Stripe** | International cards + NGN |
| Email | **SendGrid** | Transactional, branded templates |
| SMS | **Termii** | Nigerian SMS gateway |
| Storage | **Cloudflare R2** (S3-compatible) | Free egress, global CDN |
| Cache | **Redis** (Railway) | Rate limiting, sessions |

---

## Project Structure

```
homefindr-backend/
├── app/
│   ├── api/
│   │   └── v1/
│   │       ├── deps.py              # Auth dependencies
│   │       ├── router.py            # Aggregate all routers
│   │       └── endpoints/
│   │           ├── auth.py          # Register, login, Google OAuth
│   │           ├── properties.py    # CRUD + search + save
│   │           ├── offers.py        # Submit, review, counter offers
│   │           ├── payments.py      # Stripe payment intents + webhook
│   │           ├── viewings.py      # Schedule property tours
│   │           ├── messages.py      # Conversations + messages
│   │           ├── users.py         # Profile + saved searches
│   │           ├── media.py         # Image uploads → R2
│   │           └── admin.py         # Platform stats + moderation
│   ├── core/
│   │   ├── config.py               # Pydantic Settings from .env
│   │   └── security.py             # JWT + bcrypt
│   ├── db/
│   │   └── session.py              # Async engine + Base model
│   ├── models/
│   │   └── models.py               # All SQLAlchemy ORM models
│   ├── schemas/
│   │   └── schemas.py              # Pydantic request/response models
│   ├── services/
│   │   ├── socketio_app.py         # Socket.IO real-time server
│   │   ├── email.py                # SendGrid transactional emails
│   │   └── sms.py                  # Termii SMS (Nigerian)
│   └── main.py                     # FastAPI app factory + ASGI mount
├── alembic/                        # Database migrations
├── tests/
│   └── test_api.py                 # Full test suite (45+ tests)
├── .env.example                    # Environment variable template
├── requirements.txt
├── railway.toml                    # Railway deployment config
└── Procfile
```

---

## Quick Start (Local)

### 1. Clone and set up

```bash
git clone https://github.com/your-org/homefindr-backend
cd homefindr-backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
```

### 2. Configure environment

```bash
cp .env.example .env
# Edit .env with your credentials
```

Required variables for local dev:
```
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/homefindr
SECRET_KEY=any-random-256-bit-string
```

### 3. Run database migrations

```bash
# Create the DB first
createdb homefindr

# Apply migrations
alembic upgrade head

# (Or in development, tables auto-create on first startup)
```

### 4. Start the server

```bash
uvicorn app.main:combined_app --reload --port 8000
```

API docs available at: **http://localhost:8000/api/docs**

---

## API Endpoints

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/register` | Email/password registration |
| POST | `/api/v1/auth/login` | Login → token pair |
| POST | `/api/v1/auth/refresh` | Rotate access token |
| POST | `/api/v1/auth/google` | Google OAuth code exchange |
| GET | `/api/v1/auth/me` | Current user profile |
| POST | `/api/v1/auth/logout` | Clear session |

### Properties
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/properties` | Search/filter listings |
| GET | `/api/v1/properties/search?q=` | Full-text search |
| GET | `/api/v1/properties/featured` | Homepage featured |
| GET | `/api/v1/properties/{id}` | Single listing |
| POST | `/api/v1/properties` | Create listing (agent) |
| PATCH | `/api/v1/properties/{id}` | Update listing (agent/admin) |
| DELETE | `/api/v1/properties/{id}` | Delete listing |
| POST | `/api/v1/properties/{id}/save` | Toggle save/unsave |
| GET | `/api/v1/properties/saved/me` | Buyer's saved listings |

### Offers
| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/offers` | Submit offer (buyer) |
| GET | `/api/v1/offers/me` | Buyer's offers |
| GET | `/api/v1/offers/property/{id}` | Offers on a listing |
| PATCH | `/api/v1/offers/{id}` | Update status / counter |
| DELETE | `/api/v1/offers/{id}` | Withdraw offer |

### Payments
| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/payments/create-intent` | Stripe payment intent |
| POST | `/api/v1/payments/webhook` | Stripe webhook |
| GET | `/api/v1/payments/me` | Payment history |

### Viewings
| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/viewings` | Schedule viewing |
| GET | `/api/v1/viewings/me` | Buyer's viewings |
| GET | `/api/v1/viewings/agent/upcoming` | Agent's upcoming |
| PATCH | `/api/v1/viewings/{id}` | Reschedule/update |
| DELETE | `/api/v1/viewings/{id}` | Cancel |

### Messages
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/messages/conversations` | All conversations |
| POST | `/api/v1/messages/conversations` | Start conversation |
| GET | `/api/v1/messages/conversations/{id}` | Thread with messages |
| POST | `/api/v1/messages/conversations/{id}/messages` | Send message |
| POST | `/api/v1/messages/conversations/{id}/read` | Mark read |
| GET | `/api/v1/messages/unread-count` | Unread badge count |

### Media
| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/media/upload` | Upload images → R2 |
| DELETE | `/api/v1/media/delete` | Delete from storage |

### Admin
| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/admin/stats` | Platform metrics |
| GET | `/api/v1/admin/listings/pending` | Moderation queue |
| POST | `/api/v1/admin/listings/{id}/approve` | Approve listing |
| POST | `/api/v1/admin/listings/{id}/reject` | Reject listing |
| POST | `/api/v1/admin/listings/{id}/feature` | Toggle featured |

---

## Socket.IO Events (Real-time Chat)

Connect with: `io("https://api.homefindr.ng", { auth: { token: "<access_token>" } })`

| Direction | Event | Payload |
|---|---|---|
| Client → Server | `join_conversation` | `{ conversation_id }` |
| Client → Server | `send_message` | `{ conversation_id, content, attachments? }` |
| Client → Server | `typing_start` | `{ conversation_id }` |
| Client → Server | `typing_stop` | `{ conversation_id }` |
| Server → Client | `message:new` | Full message object |
| Server → Client | `typing:start` | `{ conversation_id, user_id }` |
| Server → Client | `typing:stop` | `{ conversation_id, user_id }` |
| Server → Client | `notification` | `{ title, body, reference_id }` |

---

## Running Tests

```bash
# Install test deps
pip install pytest pytest-asyncio httpx aiosqlite

# Run all tests
pytest tests/ -v

# Run specific class
pytest tests/test_api.py::TestAuth -v
pytest tests/test_api.py::TestProperties -v
```

---

## Deployment (Railway)

### 1. Create Railway project

```bash
railway login
railway new
railway link
```

### 2. Add services in Railway dashboard

- **PostgreSQL** plugin → copy `DATABASE_URL`
- **Redis** plugin → copy `REDIS_URL`

### 3. Set environment variables

Copy all variables from `.env.example` into Railway's environment panel.

### 4. Deploy

```bash
railway up
```

Railway auto-detects `railway.toml` and starts:
```
uvicorn app.main:combined_app --host 0.0.0.0 --port $PORT --workers 2
```

### 5. Run migrations on Railway

```bash
railway run alembic upgrade head
```

---

## Production Checklist

- [ ] `SECRET_KEY` is a cryptographically random 256-bit string
- [ ] `APP_ENV=production` (disables Swagger docs)
- [ ] `ALLOWED_ORIGINS` only includes your Vercel domain
- [ ] `STRIPE_WEBHOOK_SECRET` verified in Stripe dashboard
- [ ] `SENDGRID_API_KEY` configured and sender verified
- [ ] `TERMII_API_KEY` configured for SMS
- [ ] `S3_*` credentials set for Cloudflare R2
- [ ] `GOOGLE_CLIENT_ID` + `SECRET` for OAuth
- [ ] Alembic migrations run before first deploy
- [ ] Railway health check passes (`/health`)

---

## Frontend Integration

The Next.js frontend connects to this API via:

```typescript
// lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

// With auth header
const headers = { Authorization: `Bearer ${token}` };
```

Set `NEXT_PUBLIC_API_URL` in Vercel environment to your Railway API URL.
