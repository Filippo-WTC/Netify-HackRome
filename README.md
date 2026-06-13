# Netify

Netify is the AI layer that turns PDFs into narrated, animated video lessons.

This repository is the public HackRome submission package for Netify. It includes the story, API contract, demo source material, and public-facing notes from the hackathon build. It intentionally does not include the proprietary generation pipeline, render service source code, web app source code, model prompts, repair logic, provider keys, or generated internals.

## What Netify Does

Netify takes learning content that already exists and turns it into a guided video lesson:

1. Upload a PDF.
2. Analyze the document.
3. Plan the lesson structure.
4. Generate animated scenes.
5. Add ElevenLabs narration.
6. Render a final MP4.
7. Stream progress while the job runs.

The goal is not generic PDF conversion. Netify is designed for teaching: pacing, emphasis, examples, visuals, and voice.

## Hackathon Work

During HackRome, Netify moved from a local generation pipeline toward a product:

- ElevenLabs narration was integrated as the teacher voice layer.
- Supabase was connected for auth, database rows, private PDF storage, and private video storage.
- A local web app flow was built for upload, generation, progress, and library playback.
- A developer API foundation was documented around async render jobs and Server-Sent Events.
- The Devpost explainer PDF was written so Netify could generate the video explaining Netify itself.

## Current Demo Status

The render backend currently runs locally. The final Devpost demo video is generated from:

[media/netify-explainer-source.pdf](media/netify-explainer-source.pdf)

When the generated video is ready, add the public video link to:

[media/final-demo-video-url.md](media/final-demo-video-url.md)

## Repository Map

- [docs/devpost-submission.md](docs/devpost-submission.md): Devpost submission draft and judging notes.
- [docs/hackathon-work.md](docs/hackathon-work.md): public summary of what was built today.
- [docs/public-boundary.md](docs/public-boundary.md): what is intentionally excluded from this repository.
- [docs/submission-checklist.md](docs/submission-checklist.md): remaining submission items.
- [api/README.md](api/README.md): public API contract for the render service.
- [api/openapi.yaml](api/openapi.yaml): OpenAPI description of the API surface.
- [api/examples](api/examples): minimal integration examples.
- [media](media): explainer PDF, source HTML, preview image, and final video link placeholder.

## Public Boundary

This repo is safe to publish because it contains documentation and demo material only. The valuable Netify implementation remains private.

Do not add these folders or files to this public repo:

- `render/`
- `web/`
- generated scene code
- pipeline repair logic
- model prompts
- `.env` files
- API keys or provider credentials
- raw private customer PDFs
