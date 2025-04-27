# Venom Lite API

🚀 Simple lightweight WhatsApp API Gateway using `whatsapp-web.js` + `Express.js`, designed to run inside Docker.

## Features
- Scan QR Code via Web
- Send messages via API
- Health check API (`/status`)
- Client info API (`/info`)
- Debug info API (`/debug`)
- Auto-reconnect on disconnect
- Docker ready

## How to use
1. Clone the repository
2. Build and run with Docker Compose:
   ```bash
   docker-compose up -d --build
Access the APIs:

http://your-server:3371/qr → Scan QR Code

POST http://your-server:3371/send → Send message

API Endpoints

Endpoint	Method	Description
/qr	GET	Show QR Code for login
/send	POST	Send WhatsApp message
/status	GET	Client health status
/info	GET	Show client info
/debug	GET	Detailed debug status
Environment
Node.js 18

Docker

Playwright Docker Image