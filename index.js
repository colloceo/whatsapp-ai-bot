const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const qrcode = require("qrcode-terminal");
const axios = require('axios');

// --- START OF AI CONFIGURATION ---

const personalityPrompt = process.env.BOT_PERSONALITY_PROMPT || "You are a helpful assistant. Keep your replies short and friendly.";
const openRouterApiKey = process.env.OPENROUTER_API_KEY;

async function getAIReply(message) {
  if (!openRouterApiKey || !message) {
    console.error("Missing API key or message.");
    return null;
  }

  console.log(`Sending message to AI: "${message}"`);
  const apiUrl = 'https://openrouter.ai/api/v1/chat/completions';
  const requestData = {
    model: "mistralai/mistral-7b-instruct:free",
    messages: [
      { role: "system", content: personalityPrompt },
      { role: "user", content: message },
    ],
  };
  const headers = {
    'Authorization': `Bearer ${openRouterApiKey}`,
    'Content-Type': 'application/json'
  };

  try {
    const response = await axios.post(apiUrl, requestData, { headers });
    const reply = response.data.choices[0].message.content;
    console.log(`AI generated reply: "${reply}"`);
    return reply;
  } catch (error) {
    if (error.response) {
      console.error("Error getting AI reply:", error.response.data);
    } else {
      console.error("Error getting AI reply:", error.message);
    }
    return "Sorry, I'm having a little trouble thinking right now. 😅";
  }
}

// --- END OF AI CONFIGURATION ---


// --- START OF WHATSAPP BOT LOGIC ---

async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");

  const sock = makeWASocket({
    logger: pino({ level: "silent" }),
    auth: state,
  });

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) {
      console.log("QR code generated. Please scan with your phone.");
      qrcode.generate(qr, { small: true });
    }
    if (connection === "close") {
      const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      const statusCode = (lastDisconnect.error)?.output?.statusCode;
      console.log("Connection closed due to ", lastDisconnect.error, ", reconnecting ", shouldReconnect);
      
      // Don't reconnect on auth failures (401) - require fresh QR scan
      if (statusCode === 401) {
        console.log("Authentication failed. Please clear auth folder and restart for fresh QR code.");
        return;
      }
      
      if (shouldReconnect) {
        connectToWhatsApp();
      }
    } else if (connection === "open") {
      console.log("WhatsApp connection opened successfully!");
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];

    if (!msg.message || msg.key.fromMe || msg.key.remoteJid.endsWith('@g.us')) {
      return;
    }

    const incomingMessage = msg.message.conversation || msg.message.extendedTextMessage?.text;

    if (incomingMessage) {
      console.log(`Received message from ${msg.pushName} (${msg.key.remoteJid}): "${incomingMessage}"`);
      const aiReply = await getAIReply(incomingMessage);
      if (aiReply) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        await sock.sendMessage(msg.key.remoteJid, { text: aiReply });
        console.log(`Sent reply to ${msg.pushName}.`);
      }
    }
  });
}

// Start the bot
connectToWhatsApp();