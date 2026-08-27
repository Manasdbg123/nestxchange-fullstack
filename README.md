# RentNest

A zero-brokerage property rental marketplace: owners list directly, tenants
search, shortlist and book viewings without an agent in between.

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

**Prerequisites:** JDK 17+, Maven 3.9+, Node 20+, MySQL 8.

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
`/swagger-ui.html`, and a health probe at `/actuator/health`.

Under the `dev` profile, `DataSeeder` populates 48 sample listings on first run
and creates a demo owner account using `SEED_ADMIN_EMAIL` /
`SEED_ADMIN_PASSWORD`. The seed is deterministic, so every developer sees the
same catalogue. Set `SEED_ENABLED=false` to skip it.

> No Maven wrapper is committed. If you want one, run `mvn wrapper:wrapper`
> once and commit the generated `mvnw`, `mvnw.cmd` and `.mvn/` files.

### 3. Start the web client

```bash
cd rentnest-frontend
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
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | MySQL connection | yes |
| `JWT_SECRET` | Token signing key, ≥ 64 bytes | yes (dev has a fallback) |
| `JWT_EXPIRATION_MS` | Token lifetime, default 24 h | no |
| `CORS_ALLOWED_ORIGINS` | Comma-separated browser origins | no |
| `CLOUDINARY_*` | Image hosting credentials | only to upload photos |
| `SEED_ENABLED`, `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` | Dev sample data | no |
| `DDL_AUTO` | Hibernate schema strategy | no |

Frontend (build-time — Vite inlines these into the bundle, so never put a
secret here):

| Variable | Purpose |
|---|---|
| `VITE_API_BASE_URL` | API base including the `/api/v1` prefix |

### Profiles

| Profile | Schema | Seeding | SQL logging |
|---|---|---|---|
| `dev` (default) | `update` | on | on |
| `prod` | `validate` | off | off |

`prod` validates the schema rather than mutating it. Apply schema changes
deliberately before deploying.

---

## Running with Docker

```bash
cp .env.example .env      # fill in DB_PASSWORD, MYSQL_ROOT_PASSWORD, JWT_SECRET
docker compose up --build
```

Brings up MySQL, the API and the web client. Compose waits for the database
health check before starting the API, and both application containers run as
non-root users.

- Web client: http://localhost:5173
- API: http://localhost:8081

---

## Architecture

```
src/main/java/com/rentnest/
├── config/          Security, CORS, Cloudinary, OpenAPI, async, dev seeding
├── controller/      REST endpoints under /api/v1
├── dto/             Request and response payloads (entities never cross the wire)
├── entity/          JPA model
├── event/           Application events + async listeners
├── exception/       Typed exceptions and the global handler
├── mapper/          Entity → DTO
├── repository/      Spring Data JPA + Criteria specifications
├── scheduler/       Nightly job expiring stale visit requests
├── security/        JWT filter, token provider, principal, entry points
├── service/         Business logic (interface + impl)
└── validation/      Custom bean-validation constraints

rentnest-frontend/src/
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

**Search runs entirely server-side.** Every filter the UI offers maps to a query
parameter, built into a Criteria specification. Filters are mirrored into the
URL, so a search is shareable and survives a refresh.

**Owner contact details are gated.** The public listings feed never carries an
owner's email, and phone numbers are revealed only to signed-in users on a
listing page.

**Open session-in-view is disabled.** Queries that feed a response join their
associations explicitly, which also removes several N+1 patterns.

---

## API

Base path `/api/v1`. Full interactive reference at `/swagger-ui.html`.

### Public

| Method | Path | Description |
|---|---|---|
| `POST` | `/auth/register` | Create a tenant or owner account |
| `POST` | `/auth/login` | Exchange credentials for a token |
| `GET` | `/properties` | Search listings (paginated) |
| `GET` | `/properties/{id}` | One listing |
| `GET` | `/properties/cities` | Cities with live listings |

### Requires a bearer token

| Method | Path | Description |
|---|---|---|
| `GET` | `/auth/me` | Current user profile |
| `POST` | `/properties` | Post a listing (multipart, with photos) |
| `PUT` | `/properties/{id}` | Edit a listing you own |
| `DELETE` | `/properties/{id}` | Delete a listing you own |
| `GET` | `/properties/my-properties` | Your listings |
| `GET` | `/properties/favorites` | Your shortlist |
| `POST` | `/properties/{id}/favorite` | Toggle shortlist |
| `POST` | `/visits` | Request a viewing |
| `GET` | `/visits/my-requests` | Viewings you requested |
| `GET` | `/visits/owner-requests` | Requests on your listings |
| `PATCH` | `/visits/{id}/status` | Accept or reject a request |
| `DELETE` | `/visits/{id}` | Withdraw your own request |

### Admin only

| Method | Path | Description |
|---|---|---|
| `GET` | `/admin/properties/pending` | Listings awaiting moderation |
| `PATCH` | `/admin/properties/{id}/approve` | Publish a held listing |
| `PATCH` | `/admin/properties/{id}/verification` | Grant or revoke the verified badge |
| `PATCH` | `/admin/properties/{id}/deactivate` | Take a listing offline |

### Search parameters

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
  "path": "/api/v1/properties",
  "fieldErrors": { "rentAmount": "Rent must be a positive multiple of 100..." }
}
```

---

## Testing

```bash
mvn test                        # backend unit tests

cd rentnest-frontend
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
were previously committed in `application.yml`** — a MySQL password, a JWT
signing secret and a Cloudinary API secret. They are removed from the working
tree but remain in git history.

---

## Known limitations

Honest list of what is not built:

- **No geocoding.** Listings store a city and locality but no coordinates. Map
  markers are scattered deterministically around the city centre and labelled
  as approximate.
- **No schema migrations.** Hibernate manages the schema (`update` in dev,
  `validate` in prod). Flyway or Liquibase is the right next step before this
  handles real data.
- **Photos cannot be changed after posting.** Editing a listing covers every
  other field; image management needs its own endpoints.
- **Notifications are logged, not sent.** The visit-request listener is wired up
  end to end but stubs out the mail send.
- **No refresh tokens.** Access tokens last 24 hours and the client signs the
  user out when one is rejected.
- **Testimonials and statistics on the marketing pages are illustrative**, as
  this is a portfolio project rather than a live marketplace.
