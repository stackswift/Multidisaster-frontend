# MAAS Frontend Vercel Deployment Guide

This guide outlines the steps required to deploy the **MAAS Command Center (Next.js Frontend)** to **Vercel** and connect it to the live cloud backend on AWS.

---

## 1. Prerequisites
- Ensure all recent changes are pushed to your GitHub repository (e.g. `Multidisaster-frontend`).
- Ensure you have access to a [Vercel](https://vercel.com/) account.

---

## 2. Create the Vercel Project
1. Log in to [Vercel Dashboard](https://vercel.com/dashboard) and click **Add New** > **Project**.
2. Select your GitHub repository (`Multidisaster-frontend`).
3. Vercel will auto-detect the framework preset as **Next.js**.
4. Keep the **Build Command** (`next build`) and **Output Directory** (`.next`) as defaults.

---

## 3. Environment Variables Configuration

Before clicking **Deploy**, open the **Environment Variables** section in Vercel and add the following key-value pairs:

| Variable Name | Environment | Value | Description |
| :--- | :--- | :--- | :--- |
| `LIVEKIT_API_KEY` | Production, Preview, Dev | `APIVKkdqFpXgYjP` | LiveKit API Key for WebRTC video streaming |
| `LIVEKIT_API_SECRET` | Production, Preview, Dev | `RZarlBA7Ue9cLgZM1kHff2ge3wVZPapzJnYHzPq0RMCA` | LiveKit API Secret for server-side token generation |
| `NEXT_PUBLIC_LIVEKIT_URL` | Production, Preview, Dev | `wss://maas-oa7qe4cw.livekit.cloud` | LiveKit Cloud WebSockets endpoint |
| `NEXT_PUBLIC_WSS_URL` | Production, Preview, Dev | `ws://54.157.223.9:8080/v1/ui/stream` | AWS Graviton Telemetry WebSocket stream |
| `NEXT_PUBLIC_API_URL` | Production, Preview, Dev | `http://54.157.223.9:8080` | AWS Graviton REST API endpoint for Swarm controls (Launch, Hold, RTL) |
| `NEXT_PUBLIC_VOD_API_URL` | Production, Preview, Dev | `http://54.157.223.9:8080` | Microservice endpoint for video analysis |

---

## 4. Deploy & Verify
1. Click **Deploy**.
2. Vercel will install dependencies, compile the TypeScript code, and publish the Next.js app to a live `.vercel.app` domain.
3. Open the generated deployment URL.
4. Verify that:
   - The 2.5D Mapbox map renders properly.
   - Drone telemetry connects via WebSocket.
   - Swarm controls broadcast commands to the cloud backend (`http://54.157.223.9:8080`).
   - LiveKit video grid displays active camera streams.

---

## 5. Troubleshooting
- **No Video / Spinning Loader:** Double-check `NEXT_PUBLIC_LIVEKIT_URL` in Vercel settings and verify LiveKit token API route `/api/livekit/token`.
- **Drones Not Moving / Blank Sit-Rep:** Open browser DevTools (`F12`). If WebSocket connection fails, check `NEXT_PUBLIC_WSS_URL` and ensure port `8080` is open on the AWS security group.
- **REST Command Failures (Launch/RTL):** Ensure `NEXT_PUBLIC_API_URL` is set to `http://54.157.223.9:8080` and not `localhost`. Re-deploy on Vercel after saving environment variables.
