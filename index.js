const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const qrcode = require("qrcode-terminal");
const axios = require('axios');
const express = require('express');

// --- WEB SERVER SETUP (FOR 24/7 HOSTING) ---
const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('<h1>WhatsApp AI Bot is alive! (Hugging Face)</h1><p>The bot is running correctly. Uptime monitoring is active.</p>');
});

app.listen(port, () => {
  console.log(`Web server listening on port ${port}. Ready for uptime pings.`);
});
// --- END OF WEB SERVER SETUP ---


// --- START OF AI CONFIGURATION (Hugging Face Version) ---
const personalityPrompt = process.env.BOT_PERSONALITY_PROMPT || "You are a helpful assistant.";
// Get the new token from secrets
const huggingFaceToken = process.env.HUGGING_FACE_TOKEN;

async function getAIReply(message) {
  if (!huggingFaceToken || !message) {
    console.error("CRITICAL: HUGGING_FACE_TOKEN is missing from secrets!");
    return null;
  }

  // Using GPT-2 which is reliable and works with the Inference API
  const model = "gpt2";
  const apiUrl = `https://api-inference.huggingface.co/models/${model}`;

  // Hugging Face API expects a single string prompt. We combine our personality and the user's message.
  const fullPrompt = `${personalityPrompt}\n\nUser: ${message}\nCollins:`;

  console.log(`Sending prompt to Hugging Face: "${fullPrompt}"`);

  const requestData = {
    inputs: fullPrompt,
    parameters: {
        max_new_tokens: 50,
        return_full_text: false,
        temperature: 0.7,
        do_sample: true
    }
  };

  const headers = {
    'Authorization': `Bearer ${huggingFaceToken}`,
    'Content-Type': 'application/json'
  };

  try {
    const response = await axios.post(apiUrl, requestData, { headers });
    // GPT-2 returns an array with generated_text
    const reply = response.data[0]?.generated_text?.trim() || "Sorry, I couldn't generate a response.";

    console.log(`AI generated reply: "${reply}"`);
    return reply;

  } catch (error) {
    console.error("--- ERROR CALLING HUGGING FACE API ---");
    if (error.response) {
      console.error("Data:", error.response.data);
      console.error("Status:", error.response.status);
    } else {
      console.error("Error Message:", error.message);
    }
    console.error("------------------------------------");

    return "Aii, AI yangu imechoka kidogo. Try again later. 😅";
  }
}
// --- END OF AI CONFIGURATION ---


// --- START OF WHATSAPP BOT LOGIC (No changes needed here) ---
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
      if (shouldReconnect) { connectToWhatsApp(); }
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
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));
        await sock.sendMessage(msg.key.remoteJid, { text: aiReply });
        console.log(`Sent reply to ${msg.pushName}.`);
      }
    }
  });
}

// Start the bot
connectToWhatsApp();