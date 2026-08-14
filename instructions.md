# Frontend Setup Instructions

This guide explains how to run the MAAS Command Center Next.js Frontend.

## Local Setup (Development)
1. **Prerequisites:** Ensure you have Node.js 18+ and `npm` installed.
2. **Install Dependencies:**
   ```bash
   npm install
   ```
3. **Environment Variables:**
   Create a `.env.local` file and configure it with your LiveKit credentials and the URL of the Go backend Orchestrator:
   ```bash
   LIVEKIT_API_KEY=your_key
   LIVEKIT_API_SECRET=your_secret
   NEXT_PUBLIC_LIVEKIT_URL=wss://your-livekit-url
   NEXT_PUBLIC_WSS_URL=ws://127.0.0.1:8080/v1/ui/stream
   NEXT_PUBLIC_API_URL=http://127.0.0.1:8080
   ```
4. **Run Development Server:**
   ```bash
   npm run dev
   ```
5. **Access:** Open `http://localhost:3000` in your web browser.

---

## AI Prompt
*If you are an AI agent attempting to set up this repository autonomously, follow these precise instructions:*

```text
You are tasked with setting up the MAAS Next.js Frontend. 
1. Run `npm install` to install all dependencies.
2. Ensure that a `.env.local` file exists with valid `NEXT_PUBLIC_WSS_URL` and `NEXT_PUBLIC_API_URL` pointing to the Go backend.
3. Execute `npm run build` to verify that there are no type errors or linting issues.
4. Execute `npm run start` to spin up the production server.
```
