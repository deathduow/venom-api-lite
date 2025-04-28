require('dotenv').config(); // <<< Load .env
const { Client, LocalAuth } = require('whatsapp-web.js');
const { executablePath } = require('puppeteer');
const puppeteerExtra = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const express = require('express');
const qrcode = require('qrcode-terminal');
const rateLimit = require('express-rate-limit');

const app = express();
const port = process.env.PORT || 3371;
const API_KEY = process.env.API_KEY;

puppeteerExtra.use(StealthPlugin());

app.use(express.json());

// 🛡️ API Rate Limiter
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 menit
  max: 30, // Maksimal 30 request per menit
  message: { status: false, message: '⚠️ Too many requests, slow down.' },
});
app.use(limiter);

// 🛡️ API Key Middleware
app.use((req, res, next) => {
    const apiKey = req.headers['x-api-key'];
    if (!apiKey || apiKey !== API_KEY) {
        return res.status(403).json({ status: false, message: 'Forbidden: Invalid API Key' });
    }
    next();
});

let latestQr = '';
let clientStatus = {
    ready: false,
    disconnected: false,
    lastError: null,
};

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './sessions' }),
    puppeteer: puppeteerExtra,
    puppeteerOptions: {
        headless: false,
        executablePath: executablePath(),
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-zygote',
            '--disable-gpu',
            '--window-size=1920,1080',
        ],
    }
});

// 🛠️ Auto Reconnect Logic
function reinitializeClient() {
    console.log('🔄 Reinitializing client...');
    client.initialize();
}

client.on('qr', (qr) => {
    latestQr = qr;
    qrcode.generate(qr, { small: true });
    console.log('📱 QR RECEIVED - scan di browser http://IP-SERVER:3371/qr');
});

client.on('ready', () => {
    console.log('✅ Client is ready!');
    clientStatus.ready = true;
    clientStatus.disconnected = false;
});

client.on('disconnected', (reason) => {
    console.warn('⚠️ Client disconnected:', reason);
    clientStatus.ready = false;
    clientStatus.disconnected = true;
    setTimeout(reinitializeClient, 5000); // Coba reconnect 5 detik kemudian
});

client.on('auth_failure', (message) => {
    console.error('❌ Authentication failure:', message);
    clientStatus.lastError = message;
    setTimeout(reinitializeClient, 5000); // Reconnect setelah auth failure
});

client.initialize();

// ===== Endpoint Routes =====
app.get('/', (req, res) => {
    res.send('✅ Venom Lite API is running...');
});

app.get('/qr', (req, res) => {
    if (!latestQr) {
        return res.send('⚠️ QR Code belum tersedia. Tunggu sebentar...');
    }
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(latestQr)}&size=300x300`;
    res.send(`
        <html>
            <head><title>Scan QR</title></head>
            <body style="text-align: center; font-family: Arial, sans-serif;">
                <h2>Scan QR Code untuk login WhatsApp</h2>
                <img src="${qrImageUrl}" alt="QR Code" />
                <p>Reload halaman ini kalau QR Code expired.</p>
            </body>
        </html>
    `);
});

app.get('/info', async (req, res) => {
    try {
        const info = await client.info;
        res.json({ status: true, data: info });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
});

app.get('/status', (req, res) => {
    if (clientStatus.ready) {
        res.json({ status: true, message: '✅ WhatsApp Client is connected and ready.' });
    } else {
        res.status(503).json({ status: false, message: '❌ WhatsApp Client is not ready.' });
    }
});

app.get('/debug', async (req, res) => {
    try {
        const info = await client.info;
        res.json({
            status: true,
            clientReady: clientStatus.ready,
            disconnected: clientStatus.disconnected,
            pushname: info.pushname || null,
            wid: info.wid || null,
            platform: info.platform || null,
        });
    } catch (error) {
        res.status(500).json({ status: false, message: error.message });
    }
});

app.post('/send', async (req, res) => {
    const { number, message } = req.body;

    if (!number || !message) {
        return res.status(400).json({ status: false, message: '❌ Number and message are required.' });
    }

    try {
        const chatId = number.includes('@c.us') ? number : `${number}@c.us`;
        const isRegistered = await client.isRegisteredUser(chatId);

        if (!isRegistered) {
            console.warn(`⚠️ Nomor tidak terdaftar WhatsApp: ${number}`);
            return res.status(422).json({ status: false, message: '❌ Number is not registered on WhatsApp.' });
        }

        const response = await client.sendMessage(chatId, message);
        console.log('📨 SendMessage Response:', response);

        res.json({
            status: true,
            message: '✅ Message sent successfully.',
            sendResult: response
        });
    } catch (error) {
        console.error('❌ Send message error:', error);
        res.status(500).json({ status: false, message: error.message });
    }
});

app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Venom Lite API running at http://0.0.0.0:${port}`);
});
