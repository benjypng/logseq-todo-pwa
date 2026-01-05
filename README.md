# Logseq Todo PWA

A lightweight, distraction-free Progressive Web App (PWA) designed to manage Logseq tasks on the go.

This project connects directly to a running Logseq instance via the HTTP API, allowing you to view and complete tasks without opening the full Logseq mobile app. It features a "Focus Mode" to help you concentrate on one task at a time.

## 🚀 Why build this?
* **Distraction-Free:** Looking at a massive task list in Logseq can be overwhelming. This app isolates tasks to help you focus.
* **Reliable Sync:** By connecting to a desktop instance hosted on a home server, sync issues are minimized. Changes update in real-time.
* **Speed:** A dedicated PWA is often faster and lighter than loading the full Logseq graph on mobile.

## ✨ Features
* **Focus Mode:** View one task at a time.
* **Real-time Sync:** Changes (completing a task) are reflected immediately in your Logseq graph.
* **Mobile Optimized:** Designed as a PWA; installable on iOS and Android for a native app-like experience.
* **Secure Access:** Designed to run behind a VPN (Tailscale) for secure remote access without exposing ports to the public internet.

## 🛠 Prerequisites
Before running the app, ensure you have the following setup:

1.  **Logseq Desktop** running on a generic machine (or a VM/Home Server).
2.  **Tailscale** (or another VPN) set up to allow remote access to that machine.
3.  **Node.js** or **Bun** installed on the machine hosting the PWA.

## ⚙️ Configuration
### 1. Configure Logseq API
1.  Open Logseq on your host machine.
2.  Go to **Settings** > **Features** and enable the **HTTP API Server**.
3.  Set a secure **Authorization Token**.
4.  Note the **API Server Host** and **Port** (default is usually `127.0.0.1:12315`).

### 2. Setup the PWA
Clone the repository and install dependencies:

    git clone [https://github.com/benjypng/logseq-todo-pwa.git](https://github.com/benjypng/logseq-todo-pwa.git)
    cd logseq-todo-pwa
    npm install 
    # OR if using Bun
    bun install

### 3. Environment Variables
Create a `.env` file in the root directory and add your Logseq API token:

    VITE_LOGSEQ_API_TOKEN=your_secret_token_here
    VITE_LOGSEQ_API_URL=[http://127.0.0.1:12315](http://127.0.0.1:12315)

## 🏃‍♂️ Usage
### Running Locally
Run the development server with the host flag to expose it to your local network/VPN:

    # Using npm
    npm run dev -- --host

    # Using Bun
    bun run dev -- --host

Ensure the app is accessible by visiting `http://<YOUR_SERVER_IP>:5173` from another device on the same network.

### Accessing on Mobile (Tailscale)
1.  **Enable Tailscale** on your mobile device.
2.  Open your mobile browser and navigate to `http://<YOUR_TAILSCALE_IP>:5173`.
3.  **Install as PWA**:
    * **iOS:** Tap the "Share" button -> "Add to Home Screen".
    * **Android:** Tap the menu (three dots) -> "Install App" or "Add to Home Screen".

### (Optional) DNS Setup
For easier access, configure your router or local DNS to map a friendly name to your server IP.
* Example: Access via `http://logseq-tasks:5173` instead of the raw IP address.

## 📝 Query Logic
By default, the app pulls blocks that match specific criteria (e.g., tagged with `#Task` or explicitly marked as `TODO`). You can modify the query logic in `src/api.ts` or `src/hooks/use-tasks.ts` to fit your workflow.

## 📄 License
[MIT](LICENSE)
