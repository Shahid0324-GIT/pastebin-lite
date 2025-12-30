# Pastebin Lite

A simple pastebin application built with Next.js 15 and Redis, allowing users to create and share text pastes with optional expiry and view limits.

## Features

- Create text pastes with shareable URLs
- Optional time-based expiry (TTL)
- Optional view count limits
- Automatic cleanup of expired pastes
- Deterministic time testing support

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Persistence**: Redis (Upstash)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **ID Generation**: nanoid

## Prerequisites

- Node.js 18+
- Redis instance (Upstash recommended for deployment)

## Setup Instructions

### 1. Clone the repository

```bash
git clone <your-repo-url>
cd pastebin-lite
```

### 2. Install dependencies

```bash
npm install
```

### 3. Configure environment variables

Create a `.env.local` file in the root directory:

```env
UPSTASH_REDIS_REST_URL=https://your-redis-instance.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_token_here
NEXT_PUBLIC_BASE_URL=localhost:3000
TEST_MODE=0
```

**Getting Redis credentials:**

1. Sign up at [Upstash](https://upstash.com/)
2. Create a new Redis database
3. Copy the REST URL and REST TOKEN from the dashboard

### 4. Run locally

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### 5. Build for production

```bash
npm run build
npm start
```

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard:
   - `UPSTASH_REDIS_REST_URL`
   - `UPSTASH_REDIS_REST_TOKEN`
   - `NEXT_PUBLIC_BASE_URL` (your-app.vercel.app)
   - `TEST_MODE=1` (for automated testing)
4. Deploy

## API Endpoints

### Health Check

```
GET /api/healthz
```

Returns service health status and Redis connectivity.

### Create Paste

```
POST /api/pastes
Content-Type: application/json

{
  "content": "Your text here",
  "ttl_seconds": 3600,    // Optional
  "max_views": 10         // Optional
}
```

### Fetch Paste (API)

```
GET /api/pastes/:id
```

Returns paste content and metadata. Each fetch counts as a view.

### View Paste (HTML)

```
GET /p/:id
```

Renders paste content in browser.

## Persistence Layer

**Choice: Redis (Upstash)**

**Rationale:**

- **Serverless-friendly**: Works perfectly with Vercel's serverless functions
- **Built-in TTL**: Native expiration support reduces manual cleanup
- **Atomic operations**: Safe view count incrementing under concurrency
- **Fast**: Sub-millisecond latency for read/write operations
- **HTTP-based**: No persistent connections needed (Upstash REST API)

**Data Structure:**

```
Key: paste:{id}
Value: {
  content: string,
  created_at: timestamp,
  ttl_seconds: number | null,
  max_views: number | null,
  view_count: number
}
```

## Design Decisions

1. **Atomic View Counting**: Each API fetch increments view_count and checks constraints before returning data
2. **Deterministic Testing**: When `TEST_MODE=1`, the `x-test-now-ms` header overrides system time for TTL calculations

3. **Graceful Expiry**: Redis TTL is set slightly longer than paste TTL to prevent premature deletion

4. **ID Generation**: Using nanoid(10) for short, URL-safe unique IDs

5. **Error Handling**: All unavailable pastes (expired, view limit, not found) return 404 with JSON error

6. **HTML Safety**: Paste content is rendered as plain text to prevent XSS

## Testing

The application supports automated testing with deterministic time:

```bash
# Set environment variable
TEST_MODE=1

# Send request with test time header
curl -H "x-test-now-ms: 1704067200000" \
     https://your-app.vercel.app/api/pastes/abc123
```

## Project Structure

```
├── app/
│   ├── api/
│   │   ├── healthz/route.ts       # Health check endpoint
│   │   └── pastes/
│   │       ├── route.ts            # Create paste
│   │       └── [id]/route.ts       # Fetch paste API
│   ├── p/
│   │   └── [id]/page.tsx           # View paste HTML
│   └── page.tsx                    # Home page (create UI)
├── lib/
│   └── redis.ts                    # Redis client configuration
└── README.md
```
