# NestXchange

A multi-category marketplace: property and vehicles, rent, buy or sell, all
through one category-agnostic engine rather than two parallel apps. Evolved
from an earlier property-only rental app ("RentNest").

Spring Boot REST API + React single-page client.

---

## Contents

- [Quick start](#quick-start)
- [Configuration](#configuration)
- [Running with Docker](#running-with-docker)
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
| `CORS_ALLOWED_ORIGINS` | Comma-separated browser origins | no |
| `CLOUDINARY_*` | Image hosting credentials | only to upload photos |
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

## Architecture

The whole point of this project is a **category-agnostic core**: one
`Listing` entity/table for both property and vehicle listings, with
category-specific fields (bedrooms vs. mileage, amenities vs. transmission)
living in a JSONB `attributes` column rather than in separate tables. What's
valid per category is declared once in `CategorySchemaRegistry` and read by
search, validation and (eventually) the frontend form — not re-encoded as
`if (category == PROPERTY)` branches scattered through the codebase.

The earlier RentNest property-only model (`Property`, `PropertyController`,
`PropertyService`, ...) still exists and still works side by side with it;
it hasn't been migrated onto the generic engine yet.

```
src/main/java/com/nestxchange/
├── config/          Security, CORS, Cloudinary, OpenAPI, async, dev seeding
├── controller/      REST endpoints under /api/v1
├── dto/             Request and response payloads (entities never cross the wire)
├── entity/          JPA model - Property (legacy) and the generic Listing
├── event/           Application events + async listeners
├── exception/       Typed exceptions and the global handler
├── mapper/          Entity → DTO
├── repository/      Spring Data JPA + Criteria specifications
├── scheduler/       Nightly job expiring stale visit requests
├── schema/          CategorySchemaRegistry + attribute validation
├── search/          The unified listings search query builder
├── security/        JWT filter, token provider, principal, entry points
├── service/         Business logic (interface + impl)
├── statemachine/    Shared AVAILABLE→...→CLOSED lifecycle, rent/sale handlers
└── validation/      Custom bean-validation constraints

nestxchange-frontend/src/
├── api/             Axios client and the endpoint catalogue
├── components/      auth · layout · marketing · property · ui
├── context/         Auth, theme and toast providers
├── hooks/           useAsync, useFavorites, usePageMeta
├── lib/             Formatting, constants, geo helpers
└── pages/           Route components
```

### Design decisions worth knowing

**Authorisation is by ownership, not by role.** Anyone may post a listing
regardless of how they signed up, so permission to edit a listing or decide a
visit request is checked against who owns it. Roles only distinguish staff
(`ADMIN`) from everyone else.

**One search endpoint for every category.** `GET /api/v1/listings/search`
handles PROPERTY and VEHICLE through the same query builder: universal
filters (category, mode, price, location) plus a validated `attr.*` map,
translated into JSONB `->>`/`@>` predicates - never a
`searchProperties()`/`searchVehicles()` split.

**Status only changes through the state machine.** `ListingStateMachineService`
is the one place `AVAILABLE → REQUESTED → CONFIRMED → ACTIVE/COMPLETED →
CLOSED` is enforced; rent vs. sale behaviour is a pluggable handler, not a
second machine.

**Owner contact details are gated.** The public listings feed never carries an
owner's email, and phone numbers are revealed only to signed-in users on a
listing page.

**Open session-in-view is disabled.** Queries that feed a response join their
associations explicitly, which also removes several N+1 patterns.

---

## API

Base path `/api/v1`. Full interactive reference at `/swagger-ui.html`.

### Listings (category-agnostic: PROPERTY + VEHICLE)

| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/listings/search` | Public | Search across every category via universal + `attr.*` filters |
| `GET` | `/listings/{id}` | Public | A single listing |
| `POST` | `/listings` | Bearer | Post a new listing |
| `PUT` | `/listings/{id}` | Bearer, owner | Edit a listing you own |
| `DELETE` | `/listings/{id}` | Bearer, owner | Delete a listing you own |
| `GET` | `/listings/my-listings` | Bearer | Listings you've posted |
| `POST` | `/listings/{id}/transitions` | Bearer | Fire a state-machine event: `REQUEST`, `CONFIRM`, `PROCEED`, `CLOSE` |
| `GET` | `/listings/{id}/transitions` | Bearer | Transition/audit history for a listing |
| `PATCH` | `/admin/listings/{id}/close` | Admin | Force-close a listing (moderation takedown) |

### Legacy property endpoints (pre-dates the generic Listing model)

| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | Public | Create a tenant or owner account |
| `POST` | `/auth/login` | Public | Exchange credentials for a token |
| `GET` | `/properties` | Public | Search listings (paginated) |
| `GET` | `/properties/{id}` | Public | One listing |
| `GET` | `/properties/cities` | Public | Cities with live listings |
| `GET` | `/auth/me` | Bearer | Current user profile |
| `POST` | `/properties` | Bearer | Post a listing (multipart, with photos) |
| `PUT` | `/properties/{id}` | Bearer, owner | Edit a listing you own |
| `DELETE` | `/properties/{id}` | Bearer, owner | Delete a listing you own |
| `GET` | `/properties/my-properties` | Bearer | Your listings |
| `GET` | `/properties/favorites` | Bearer | Your shortlist |
| `POST` | `/properties/{id}/favorite` | Bearer | Toggle shortlist |
| `POST` | `/visits` | Bearer | Request a viewing |
| `GET` | `/visits/my-requests` | Bearer | Viewings you requested |
| `GET` | `/visits/owner-requests` | Bearer | Requests on your listings |
| `PATCH` | `/visits/{id}/status` | Bearer | Accept or reject a request |
| `DELETE` | `/visits/{id}` | Bearer | Withdraw your own request |
| `GET` | `/admin/properties/pending` | Admin | Listings awaiting moderation |
| `PATCH` | `/admin/properties/{id}/approve` | Admin | Publish a held listing |
| `PATCH` | `/admin/properties/{id}/verification` | Admin | Grant or revoke the verified badge |
| `PATCH` | `/admin/properties/{id}/deactivate` | Admin | Take a listing offline |

### Listing search parameters

Universal: `category`, `mode`, `priceMin`, `priceMax`, `location`, `page`, `size`.
Category-specific: `attr.<field>` (exact match), `attr.<field>_min` /
`attr.<field>_max` (numeric range) — valid fields per category come from
`CategorySchemaRegistry` (e.g. `attr.bedrooms`, `attr.mileage_max`,
`attr.make`).

### Legacy property search parameters

`keyword`, `city`, `locality`, `minRent`, `maxRent`, `type` (repeatable),
`bhk` (repeatable), `furnishing`, `tenant`, `verifiedOnly`, `negotiableOnly`,
`availableBy`, `sortBy`, `page`, `size`.

### Error shape

Every failure returns the same envelope. `message` is always safe to show a
user; 5xx responses carry a correlation reference instead of internal detail.

```json
{
  "timestamp": "2024-08-27T10:15:30Z",
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

---

## Security notes

- Passwords are hashed with BCrypt (cost 12) and excluded from `toString`.
- Registration cannot create an `ADMIN`: the wire type only offers
  `TENANT` and `OWNER`, so escalation is not expressible.
- Login failures are deliberately vague and user-not-found is folded into
  bad-credentials, so the form cannot be used to enumerate accounts.
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

Honest list of what is not built:

- **The legacy `Property` model and the generic `Listing` model coexist.**
  Property listings created through `/properties` do not show up in
  `/listings/search` and vice versa - they are two separate tables. Migrating
  `Property` onto `Listing` (as a PROPERTY-category listing) is the natural
  next step but hasn't been done.
- **Listing-transition authorization is coarse.** Any authenticated user can
  fire any state-machine event on any listing; there's no "who requested this
  listing" concept yet to restrict `CONFIRM` to the owner, say.
- **No geocoding.** Listings store a city/locality or free-text location but
  no coordinates. Map markers (legacy property pages) are scattered
  deterministically around the city centre and labelled as approximate.
- **Photos cannot be changed after posting.** Editing a legacy property
  listing covers every other field; image management needs its own endpoints.
  The generic `Listing` model has no image support yet at all.
- **Notifications are logged, not sent.** The visit-request listener is wired up
  end to end but stubs out the mail send.
- **No refresh tokens.** Access tokens last 24 hours and the client signs the
  user out when one is rejected.
- **Testimonials and statistics on the marketing pages are illustrative**, as
  this is a portfolio project rather than a live marketplace.
