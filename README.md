# NestXchange

[![CI](https://github.com/Manasdbg123/nestxchange-fullstack/actions/workflows/ci.yml/badge.svg)](https://github.com/Manasdbg123/nestxchange-fullstack/actions/workflows/ci.yml)

A multi-category marketplace: property and vehicles, to rent, buy or sell, all
through one category-agnostic engine rather than two parallel apps. Evolved
from an earlier property-only rental app ("RentNest").

Spring Boot REST API + React single-page client.

**Live:** [nestxchange-fullstack.vercel.app](https://nestxchange-fullstack.vercel.app)
· API docs: [`/swagger-ui.html`](https://nestxchange-fullstack.onrender.com/swagger-ui.html)

> The API runs on a free instance that sleeps when idle. The first request after
> a quiet spell takes up to a minute while it starts; the site says so while it
> waits, and everything after that is fast.

---

## Contents

- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Running with Docker](#running-with-docker)
- [Deployment](#deployment)
- [Architecture](#architecture)
- [API](#api)
- [Testing](#testing)
- [Security notes](#security-notes)
- [Known limitations](#known-limitations)

---

## Quick start

**Prerequisites:** JDK 17+, Maven 3.9+, Node 20+, PostgreSQL 16.

### 1. Configure

```bash
cp .env.example .env
```

Fill in at minimum `DB_PASSWORD` and `JWT_SECRET`. Generate a secret with:

```bash
openssl rand -base64 96
```

`JWT_SECRET` must decode to at least 64 bytes — the application refuses to
start otherwise, rather than silently signing tokens with a weak key.

> **`.env` is read automatically by Docker Compose, but not by Maven.** Spring
> Boot reads the *environment*, not the file. For a local `mvn spring-boot:run`
> you must load it into your shell first:
>
> ```bash
> set -a && . ./.env && set +a          # bash / zsh
> ```
> ```powershell
> Get-Content .env | Where-Object { $_ -match '^\s*[^#]' } |
>   ForEach-Object { $k,$v = $_ -split '=',2; [Environment]::SetEnvironmentVariable($k.Trim(), $v.Trim()) }
> ```
>
> Alternatively drop the same keys into `src/main/resources/application-local.yml`
> (already gitignored) and run with `SPRING_PROFILES_ACTIVE=dev,local`.

### 2. Start the API

```bash
mvn spring-boot:run
```

The API listens on **http://localhost:8081**. Interactive docs are at
`/swagger-ui.html`, and a health probe at `/actuator/health`. Flyway applies
schema migrations from `src/main/resources/db/migration` automatically on
startup.

Under the `dev` profile, `DataSeeder` populates 48 sample property listings on
first run and creates a demo owner account using `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD`. The seed is deterministic, so every developer sees the
same catalogue. Set `SEED_ENABLED=false` to skip it.

> No Maven wrapper is committed. If you want one, run `mvn wrapper:wrapper`
> once and commit the generated `mvnw`, `mvnw.cmd` and `.mvn/` files.

### 3. Start the web client

```bash
cd nestxchange-frontend
cp .env.example .env.local
npm install
npm run dev
```

The client runs on **http://localhost:5173**.

---

## Configuration

Every secret is read from the environment; nothing sensitive is committed. See
[`.env.example`](.env.example) for the full list.

| Variable | Purpose | Required |
|---|---|---|
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | PostgreSQL connection | yes |
| `JWT_SECRET` | Token signing key, ≥ 64 bytes | yes (dev has a fallback) |
| `JWT_EXPIRATION_MS` | Token lifetime, default 24 h | no |
| `CORS_ALLOWED_ORIGINS` | Comma-separated browser origins | yes in production |
| `APP_FRONTEND_URL` | Where links in outbound email point | yes in production |
| `CLOUDINARY_*` | Image hosting; blank stores images on local disk | to host photos |
| `RESEND_API_KEY`, `EMAIL_FROM` | Password-reset email; blank logs the email instead | to send email |
| `ASSISTANT_API_KEY` | Groq key for the listing assistant; blank hides it | no |
| `RATE_LIMIT_MAX_REQUESTS`, `RATE_LIMIT_WINDOW_SECONDS` | Limit on the auth endpoints | no |
| `APP_ACCOUNT_LIMIT_MAX_FAILED_LOGINS`, `APP_ACCOUNT_LIMIT_MAX_RESET_REQUESTS`, `APP_ACCOUNT_LIMIT_WINDOW_MINUTES` | Per-account limit on wrong passwords (10) and reset emails (5) per window (15 min) | no |
| `SEED_ENABLED`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Dev sample data | no |
| `DDL_AUTO` | Hibernate schema-validation mode (Flyway owns the schema itself) | no |

Frontend (build-time — Vite inlines these into the bundle, so never put a
secret here):

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | API base including the `/api/v1` prefix |

### Profiles

| Profile | Schema | Seeding | SQL logging |
|---|---|---|---|
| `dev` (default) | Flyway migrations, `validate` | on | on |
| `prod` | Flyway migrations, `validate` | off | off |

Hibernate never mutates the schema in either profile; Flyway migrations under
`src/main/resources/db/migration` are the only way schema changes ship.

---

## Running with Docker

```bash
cp .env.example .env      # fill in DB_PASSWORD, JWT_SECRET
docker compose up --build
```

Brings up PostgreSQL, the API and the web client. Compose waits for the
database health check before starting the API, and both application
containers run as non-root users.

- Web client: http://localhost:5173
- API: http://localhost:8081

---

## Deployment

| Piece | Where | Notes |
|---|---|---|
| Web client | Vercel | `nestxchange-frontend/`, built with `VITE_API_BASE_URL` pointing at the API; `vercel.json` rewrites every path to `index.html` for client-side routing |
| API | Render (Docker) | Root `Dockerfile`, `SPRING_PROFILES_ACTIVE=prod` |
| Database | Managed PostgreSQL | Flyway migrates it on every start |
| Images | Cloudinary | Uploaded through the API, never from the browser |
| Email | Resend | Password-reset links |

Production checklist:

- **Health check:** set the Render health check path to `/actuator/health`, so a
  deploy only goes live once the app is actually up.
- **Email domain:** Resend only delivers to the account owner's own address
  until a sending domain is verified. Verify one at resend.com/domains and set
  `EMAIL_FROM` to an address on it, e.g. `NestXchange <no-reply@yourdomain.com>`.
- **CORS:** `CORS_ALLOWED_ORIGINS` must list the Vercel URL, and
  `APP_FRONTEND_URL` must be that URL too.

---

## Architecture

The whole point of this project is a **category-agnostic core**: one
`Listing` entity/table for both property and vehicle listings, with
category-specific fields (bedrooms vs. mileage, amenities vs. transmission)
living in a JSONB `attributes` column rather than in separate tables. What's
valid per category is declared once in `CategorySchemaRegistry` and read by
search, validation and the frontend form — not re-encoded as
`if (category == PROPERTY)` branches scattered through the codebase.

| Category | Attributes |
|---|---|
| `PROPERTY` | `bedrooms`, `bathrooms`, `sqft`, `propertyType`, `furnishing`, `amenities` |
| `VEHICLE` | `make`, `model`, `year`, `mileage`, `fuelType`, `transmission` |

Every listing has a mode — `RENT`, `BUY` or `SELL` — and moves through one
lifecycle, `AVAILABLE → REQUESTED → CONFIRMED → ACTIVE/COMPLETED → CLOSED`.

```
src/main/java/com/nestxchange/
├── assistant/       Natural-language listing search (Groq, OpenAI-compatible API)
├── config/          Security, CORS, Cloudinary, OpenAPI, async mail, dev seeding
├── controller/      REST endpoints under /api/v1
├── dto/             Request and response payloads (entities never cross the wire)
├── entity/          JPA model: Listing, images, favourites, inquiries, transitions, users
├── exception/       Typed exceptions and the global handler
├── mapper/          Entity → DTO
├── repository/      Spring Data JPA
├── schema/          CategorySchemaRegistry + attribute validation
├── search/          The unified listings search query builder
├── security/        JWT filter, token provider, rate limiting, entry points
├── service/         Business logic (interface + impl)
├── statemachine/    The shared listing lifecycle, rent/sale handlers
└── validation/      Custom bean-validation constraints

nestxchange-frontend/src/
├── api/             Axios client and the endpoint catalogue
├── components/      assistant · auth · layout · listings · marketing · ui
├── context/         Auth, theme and toast providers
├── hooks/           Shared hooks
├── lib/             Formatting, constants, geo helpers
└── pages/           Route components
```

### Design decisions worth knowing

**Authorisation is by ownership, not by role.** Anyone may post a listing, so
permission to edit a listing, manage its photos or answer its inquiries is
checked against who owns it. Roles only distinguish staff (`ADMIN`) from
everyone else.

**One search endpoint for every category.** `GET /api/v1/listings/search`
handles PROPERTY and VEHICLE through the same query builder: universal
filters (category, mode, price, location) plus a validated `attr.*` map,
translated into JSONB `->>`/`@>` predicates — never a
`searchProperties()`/`searchVehicles()` split.

**Status only changes through the state machine.** `ListingStateMachineService`
is the one place the lifecycle is enforced, and it checks who may fire each
event: any signed-in user except the owner may `REQUEST`, only the owner may
`CONFIRM`, and the owner or the requester may `PROCEED` or `CLOSE` — anyone
else gets a 403. Rent vs. sale behaviour is a pluggable handler, not a second
machine. Every transition is recorded for audit.

**Owner contact details are gated.** The public listings feed never carries an
owner's email, and phone numbers are revealed only to signed-in users on a
listing page.

**Open session-in-view is disabled.** Queries that feed a response join their
associations explicitly, which also removes several N+1 patterns.

**The client expects a cold start.** Requests wait up to 90 seconds, the app
pings the API as soon as it loads so it starts waking early, and any request
pending for more than a few seconds shows a "Starting the server…" notice.

---

## API

Base path `/api/v1`. Full interactive reference at `/swagger-ui.html`.

### Accounts

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Create an account |
| `POST` | `/auth/login` | Public | Exchange credentials for a token |
| `GET` | `/auth/me` | Bearer | Current user |
| `POST` | `/auth/forgot-password` | Public | Email a reset link (same response whether or not the account exists) |
| `POST` | `/auth/reset-password` | Public | Set a new password with a reset token |

### Listings

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/listings/search` | Public | Search every category via universal + `attr.*` filters |
| `GET` | `/listings/schemas` | Public | Attribute schema per category (drives the listing form) |
| `GET` | `/listings/{id}` | Public | One listing |
| `POST` | `/listings` | Bearer | Post a listing |
| `PUT` | `/listings/{id}` | Owner | Edit a listing |
| `DELETE` | `/listings/{id}` | Owner | Delete a listing |
| `GET` | `/listings/my-listings` | Bearer | Listings you posted |
| `POST` | `/listings/{id}/images` | Owner | Upload photos (multipart) |
| `DELETE` | `/listings/{id}/images/{imageId}` | Owner | Remove a photo |
| `PATCH` | `/listings/{id}/images/{imageId}/primary` | Owner | Choose the cover photo |
| `POST` | `/listings/{id}/favorite` | Bearer | Toggle a favourite |
| `GET` | `/listings/favorites` | Bearer | Your favourites |
| `POST` | `/listings/{id}/inquiries` | Bearer | Message the owner |
| `GET` | `/listings/{id}/inquiries` | Owner | Inquiries on your listing |
| `GET` | `/listings/inquiries/sent` | Bearer | Inquiries you sent |
| `POST` | `/listings/{id}/transitions` | Bearer | Fire a lifecycle event: `REQUEST`, `CONFIRM`, `PROCEED`, `CLOSE` |
| `GET` | `/listings/{id}/transitions` | Bearer | Transition history |
| `POST` | `/assistant/chat` | Bearer | Describe what you want in plain words; get matching listings |

### Admin

| Method | Path | Auth | Description |
|---|---|---|---|
| `PATCH` | `/admin/listings/{id}/verification` | Admin | Grant or revoke the verified badge |
| `PATCH` | `/admin/listings/{id}/close` | Admin | Force-close a listing (moderation takedown) |

### Search parameters

Universal: `category`, `mode`, `priceMin`, `priceMax`, `location`, `page`, `size`.
Category-specific: `attr.<field>` (exact match), `attr.<field>_min` /
`attr.<field>_max` (numeric range), with valid fields per category taken from
`CategorySchemaRegistry` (e.g. `attr.bedrooms`, `attr.mileage_max`, `attr.make`).

### Error shape

Every failure returns the same envelope. `message` is always safe to show a
user; 5xx responses carry a correlation reference instead of internal detail.

```json
{
  "timestamp": "2026-08-27T10:15:30Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Some of the details you entered are not valid.",
  "path": "/api/v1/listings",
  "fieldErrors": { "price": "Price must be greater than zero" }
}
```

---

## Testing

```bash
mvn test                        # backend unit tests

cd nestxchange-frontend
npm run lint                    # ESLint, including the React hooks rules
npm run build                   # production build
```

CI runs all three on every push and pull request.

---

## Security notes

- Passwords are hashed with BCrypt (cost 12) and excluded from `toString`.
- Registration cannot create an `ADMIN`: the wire type only offers
  `TENANT` and `OWNER`, so escalation is not expressible.
- Login failures are deliberately vague and user-not-found is folded into
  bad-credentials, so the form cannot be used to enumerate accounts.
- The auth endpoints are rate-limited per client before credentials are checked,
  and each account also has its own limit on wrong passwords and reset emails,
  so rotating IP addresses does not buy an attacker more guesses.
- **Password reset** tokens are random, stored only as a SHA-256 hash, single-use
  and short-lived. Requesting a new link retires the old ones. Resetting a
  password signs out every existing session: tokens issued before the change are
  rejected. The reset email is sent off the request thread, so "forgot password"
  answers in the same time whether or not the account exists.
- Unauthenticated requests get a JSON `401`; authenticated-but-forbidden get a
  `403`. Both are distinguishable by the client.
- CSRF protection is disabled deliberately — the API is stateless and
  authenticates with a bearer token a cross-site form post cannot attach.
- Exception messages are never echoed to clients on 5xx.

**If this repository has ever been pushed anywhere, rotate the credentials that
were previously committed in `application.yml`** — a database password, a JWT
signing secret and a Cloudinary API secret. They are removed from the working
tree but remain in git history.

---

## Known limitations

- **No geocoding.** Listings store a city/locality or free-text location but no
  coordinates, so map markers are placed approximately around the city centre
  and labelled as approximate.
- **No refresh tokens.** Access tokens last 24 hours, and the client signs the
  user out when one is rejected.
- **Testimonials and statistics on the marketing pages are illustrative**, as
  this is a portfolio project rather than a live marketplace.
