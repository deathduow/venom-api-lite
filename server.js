const { Client, LocalAuth } = require('whatsapp-web.js');
const express = require('express');
const qrcode = require('qrcode-terminal');

const app = express();
const port = 3371;

app.use(express.json());

let latestQr = ''; // Simpan QR terbaru
let clientStatus = {
    ready: false,
    disconnected: false,
    lastError: null,
};

const client = new Client({
    authStrategy: new LocalAuth({ dataPath: './sessions' }),
    puppeteer: {
        headless: true,
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

// ===== Event WhatsApp Client =====
client.on('qr', (qr) => {
    latestQr = qr;
    qrcode.generate(qr, { small: true });
    console.log('📱 QR RECEIVED - scan di browser http://IP-SERVER:3371/qr');
});

client.on('ready', () => {
    console.log('✅ Client is ready!');
    clientStatus.ready = true;
});

client.on('disconnected', (reason) => {
    console.warn('⚠️ Client disconnected:', reason);
    clientStatus.ready = false;
    clientStatus.disconnected = true;
});

client.on('auth_failure', (message) => {
    console.error('❌ Authentication failure:', message);
    clientStatus.lastError = message;
});

client.initialize();

// ===== Endpoint Routes =====

// Home
app.get('/', (req, res) => {
    res.send('✅ Venom Lite API is running...');
});

// QR Page
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

// Info Device
app.get('/info', async (req, res) => {
    try {
        const info = await client.info;
        res.json({ status: true, data: info });
    } catch (error) {
        res.status(500).json({ status: false, error: error.message });
    }
});

// Status Health Check
app.get('/status', (req, res) => {
    if (clientStatus.ready) {
        res.json({ status: true, message: '✅ WhatsApp Client is connected and ready.' });
    } else {
        res.status(503).json({ status: false, message: '❌ WhatsApp Client is not ready.' });
    }
});

// Debug Full
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

// Send Message
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

// Jalankan server
app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Venom Lite API running at http://0.0.0.0:${port}`);
});
