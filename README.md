# Vim AI Scribe Demo App

[![npm version](https://img.shields.io/npm/v/@vimconnect/app-sdk.svg)](https://www.npmjs.com/package/@vimconnect/app-sdk)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An AI scribe built on the [Vim Connect App SDK](https://developer-docs.getvim.ai/docs). The provider starts a visit from the Vim Hub, the app records through the microphone, and the resulting SOAP note, ICD-10 diagnoses, and CPT codes are written back to the open encounter in the EHR. Built with React + Vite, with [Cloudflare Pages Functions](https://developers.cloudflare.com/pages/functions/) for the OAuth endpoints.

The transcription is simulated: the app captures the microphone to show the recording flow, but no audio leaves the browser, and every visit produces the same sample note. Swap in your own speech-to-text and note generation to make it real.

Use [vim-demo-app](https://github.com/vimconnect/vim-demo-app) for the full SDK surface. Use this one when you are building a documentation or ambient-listening app and want to see microphone access, the microphone badge, and encounter writeback end to end.

## Quick Start

```bash
# 1. Clone
git clone https://github.com/vimconnect/vim-ai-scribe-demo-app.git
cd vim-ai-scribe-demo-app/vim--ai-scribe--react

# 2. Install
npm install

# 3. Configure
cat > .dev.vars <<'EOF'
CLIENT_ID=<your client ID>
CLIENT_SECRET=<your client secret>
REDIRECT_URL=http://localhost:8788
EOF

# 4. Run
npm run dev
```

App runs at [http://localhost:8788](http://localhost:8788). `npm run dev` starts Vite on port 5173 and Wrangler on port 8788; Wrangler serves the `/api/*` functions and proxies everything else to Vite, so use port 8788 everywhere.

You don't need a Cloudflare account to run the app locally.

## Prerequisites

- **Node.js** 20 (see [`.nvmrc`](.nvmrc))
- **Vim Connect Chrome extension** installed ([setup guide](https://developer-docs.getvim.ai/docs/getting-started#prerequisites))
- **Vim Connect account** with an app created in the Vim Console
- **OAuth credentials** (client ID + client secret) from the [Vim Console](https://developer-docs.getvim.ai/docs/developer-account#getting-your-client-id-and-secret)
- **A microphone**, and an EHR encounter to write the note into (the Sandbox EHR works)

## Environment Variables

Set these in `vim--ai-scribe--react/.dev.vars` (git-ignored). Wrangler loads them into the functions.

| Variable | Required | Description |
|----------|----------|-------------|
| `CLIENT_ID` | Yes | Your OAuth client ID |
| `CLIENT_SECRET` | Yes | Your OAuth client secret (server-side only) |
| `REDIRECT_URL` | No | Where Vim returns the provider after authorization. Defaults to `http://localhost:8788`; must be listed in the manifest's **Allowed iframe URLs** |
| `VIM_AUTHORIZE_ENDPOINT` | No | Overrides the authorize URL (default `https://api.getvim.ai/app-auth/authorize`) |
| `VIM_TOKEN_ENDPOINT` | No | Overrides the token URL (default `https://api.getvim.ai/app-auth/token`) |
| `VIM_ISSUER` | No | Expected `iss` of the ID token (default `https://connect.getvim.ai`) |
| `VIM_JWKS_URL` | No | Where the ID token's signing keys are fetched (default `https://api.getvim.ai/app-auth/.well-known/jwks.json`) |
| `CLIENT_SECRET_FALLBACK` | No | A second secret tried when the first is rejected, for rotating secrets without downtime |

To switch between credential sets, keep them in `.dev.vars-local` and `.dev.vars-prod` and run `npm run dev:local` or `npm run dev:prod`; each copies its file over `.dev.vars` before starting.

## Vim Console Setup

In your app's manifest (or a local environment override):

| Field | Value for local development |
|-------|-----------------------------|
| **Launch Endpoint** | `http://localhost:8788/api/launch` |
| **Token Endpoint** | `http://localhost:8788/api/token` |
| **Allowed iframe URLs** | `http://localhost:8788` |

On the **App UX** tab, enable **Allow Microphone** and **Push Notification**. Without **Allow Microphone**, `getUserMedia` fails with `NotAllowedError` before any prompt appears. On the **EHR** tab, declare the patient's name and date of birth, the encounter's diagnoses, and update access to the encounter sections the note is written to. See [Filling in the manifest](https://developer-docs.getvim.ai/docs/developer-account#filling-in-the-manifest) and [Microphone and Camera](https://developer-docs.getvim.ai/docs/vim-hub#microphone-and-camera).

## What This Demo Shows

- **OAuth 2.0 flow** — `/api/launch` redirects to Vim's authorize endpoint; `/api/token` exchanges the code server-side and verifies the ID token against Vim's JWKS
- **SDK initialization** — `initVimSDK()` with a configured token endpoint, so the SDK fetches its own access token
- **Patient context** — The patient's name and age from `chart_open:patient` and `encounter_open:patient`, held across the chart-to-encounter transition
- **Microphone access** — `getUserMedia` inside the Hub, the microphone badge while recording, and `hub.consumeGrantedDevices()` to resume the recording after the provider allows the microphone for the first time
- **Encounter writeback** — Map each note section to an encounter field, then write the note, ICD-10 diagnoses, and CPT procedure codes with `encounter.update()` after the capability and permission checks
- **Hub controls** — Activation status and a push notification on launch

## Project Structure

```
vim--ai-scribe--react/
├── functions/api/
│   ├── launch.ts               # Launch endpoint (redirects to Vim authorize)
│   └── token.ts                # Token endpoint (code exchange + ID token check)
└── src/
    ├── providers/              # SDK initialization and the note form
    ├── vimSdk/                 # SDK hooks: patient, encounter writeback
    └── components/organisms/ai-scribe-demo/
        ├── AiScribeDemo.tsx    # Screen flow: welcome, recording, transcribing, notes
        ├── useRecorder.ts      # Microphone capture and the microphone badge
        └── NotesScreen.tsx     # Field mapping and push to EHR
```

## Documentation

- [Vim Connect App SDK Documentation](https://developer-docs.getvim.ai/docs)
- [`@vimconnect/app-sdk` on npm](https://www.npmjs.com/package/@vimconnect/app-sdk)
- [OAuth Integration Guide](https://developer-docs.getvim.ai/docs/authentication)
- [Vim Hub](https://developer-docs.getvim.ai/docs/vim-hub) — microphone access and the microphone badge
- [EHR Support Matrix](https://developer-docs.getvim.ai/docs/ehr-support)

## Scripts

Run from `vim--ai-scribe--react/`.

| Command | Description |
|---------|-------------|
| `npm run dev` | Start Vite (port 5173) and the Wrangler functions proxy (port 8788) |
| `npm run dev:local` / `npm run dev:prod` | Copy `.dev.vars-local` / `.dev.vars-prod` to `.dev.vars`, then start |
| `npm run build` | Type-check and build for production |
| `npm test` | Run the unit tests (Vitest) |
| `npm run lint` | Run ESLint |

## License

[MIT](LICENSE)
