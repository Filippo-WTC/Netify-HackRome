# Netify API Documentation

Netify's API is the intended integration surface for turning training PDFs, lesson material, and raw learning content into narrated MP4 videos.

This public repository documents the API contract. It does not include the private render backend implementation. During the HackRome demo, the render backend runs locally; the production goal is a hosted render service.

The standard integration is:

1. Upload or host your source PDF at a URL Netify can download.
2. Start a render job with `POST /api/render`.
3. Stream progress with `GET /api/events/{jobId}`.
4. Retrieve the finished MP4 from your configured video storage or delivery layer.

## Base URL

Use the URL of your local or deployed Netify render service:

```text
http://localhost:3002
```

For a hosted deployment, this would become your assigned Netify API URL.

## Authentication

Every `/api/*` endpoint requires a Bearer API key:

```http
Authorization: Bearer netify_sk_test_xxx
```

Keep API keys on your backend. Do not expose them in browser or mobile client code.

## Quick Start

```bash
export NETIFY_BASE_URL="http://localhost:3002"
export NETIFY_API_KEY="netify_sk_test_xxx"
export JOB_ID="9f9c15f4-8359-4f98-a3ef-30b4038cfc64"
export PDF_URL="https://your-storage.example.com/source.pdf"
export USER_ID="customer-or-user-id"

curl -X POST "$NETIFY_BASE_URL/api/render" \
  -H "Authorization: Bearer $NETIFY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "jobId": "'"$JOB_ID"'",
    "pdfUrl": "'"$PDF_URL"'",
    "userId": "'"$USER_ID"'",
    "prompt": "Create a concise onboarding video for new employees."
  }'
```

Then subscribe to progress:

```bash
curl -N "$NETIFY_BASE_URL/api/events/$JOB_ID" \
  -H "Authorization: Bearer $NETIFY_API_KEY"
```

Progress events are Server-Sent Events. Each `data:` payload is JSON:

```json
{"message":"Starting pipeline...","pct":5}
```

`pct: 100` means the job completed. `pct: -1` means the job failed.

## Endpoints

### `GET /health`

Health check.

Response:

```json
{"ok":true}
```

### `POST /api/render`

Starts an asynchronous PDF-to-video render job.

Headers:

```http
Authorization: Bearer <api-key>
Content-Type: application/json
```

Body:

```json
{
  "jobId": "9f9c15f4-8359-4f98-a3ef-30b4038cfc64",
  "pdfUrl": "https://your-storage.example.com/source.pdf",
  "userId": "customer-or-user-id",
  "prompt": "Optional generation guidance"
}
```

Fields:

| Field | Required | Notes |
|---|---:|---|
| `jobId` | Yes | Stable ID used for progress events and storage updates. UUIDs are recommended. |
| `pdfUrl` | Yes | Public or signed URL Netify can download. |
| `userId` | Yes | Owner/customer ID used when storing or tracking the finished video. |
| `prompt` | No | Extra instructions for style, audience, length, or emphasis. |

Success response:

```json
{"ok":true,"jobId":"9f9c15f4-8359-4f98-a3ef-30b4038cfc64"}
```

Error responses:

```json
{"error":"jobId, pdfUrl, userId required"}
```

```json
{"error":"invalid api key"}
```

### `GET /api/events/{jobId}`

Streams progress for a job using Server-Sent Events.

Headers:

```http
Authorization: Bearer <api-key>
Accept: text/event-stream
```

Example event:

```text
data: {"message":"Uploading video...","pct":95}
```

The stream replays buffered log lines when you reconnect.

## Completion Model

Netify renders asynchronously. Your backend should:

1. Create a pending video/job row before calling `/api/render`.
2. Pass that row ID as `jobId`.
3. Listen to `/api/events/{jobId}` or poll your own job state.
4. Expose the final MP4 to your users after the job reaches `pct: 100`.

If your Netify account is connected to Supabase storage, the final MP4 is uploaded to the configured `videos` bucket and the matching video row is updated:

```text
videos.id = jobId
videos.status = done | error
videos.storage_path = <private storage path>
```

## Node Example

See [`examples/node/render-pdf.mjs`](examples/node/render-pdf.mjs).

## Python Example

See [`examples/python/render_pdf.py`](examples/python/render_pdf.py).

## OpenAPI

See [`openapi.yaml`](openapi.yaml).

## Backend Bridge Pattern

Recommended production architecture:

```text
Your app/backend -> Netify API -> Video storage/delivery -> Your users
```

Do not call Netify directly from public browser code. Instead, create a backend route that:

1. Authenticates your user.
2. Creates a job ID.
3. Generates or provides a short-lived PDF URL.
4. Calls Netify with your server-side API key.
5. Streams or relays progress back to your client.

Example server-side environment variables:

```bash
NETIFY_BASE_URL=http://localhost:3002
NETIFY_API_KEY=netify_sk_test_xxx
```

## Optional Supabase Bridge

A private product deployment can bridge browser users to the render service with a server-side web app. The browser should never receive the Netify API key, provider keys, or storage service-role credentials.

For public integrations, use `POST /api/render` and `GET /api/events/{jobId}`.
