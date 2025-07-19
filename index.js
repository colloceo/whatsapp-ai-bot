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
  res.send('<h1>WhatsApp AI Bot is alive! (GroqCloud + Memory + Status + Channel Filter)</h1>');
});
app.listen(port, () => {
  console.log(`Web server listening on port ${port}.`);
});
// --- END OF WEB SERVER SETUP ---

// --- MEMORY MANAGEMENT ---
const conversationHistory = {};
const MEMORY_LIMIT = 10;
// --- END OF MEMORY MANAGEMENT ---

// --- AI CONFIGURATION (GroqCloud) ---
const personalityPrompt = process.env.BOT_PERSONALITY_PROMPT || "You are a helpful assistant.";
const groqApiKey = process.env.GROQ_API_KEY;

async function getAIReply(userMessage, history = []) {
  if (!groqApiKey || !userMessage) {
    console.error("CRITICAL: Groq API Key or message is missing!");
    return null;
  }
  const apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
  const messages = [
    { role: "system", content: personalityPrompt },
    ...history,
    { role: "user", content: userMessage }
  ];
  const requestData = {
    model: "llama3-8b-8192",
    messages: messages,
    temperature: 0.7,
    max_tokens: 150,
  };
  const headers = { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' };
  console.log(`Sending prompt to GroqCloud with ${history.length} past messages...`);
  try {
    const response = await axios.post(apiUrl, requestData, { headers });
    const reply = response.data.choices[0].message.content.trim();
    console.log(`Groq AI generated reply: "${reply}"`);
    return reply;
  } catch (error) {
    console.error("--- ERROR CALLING GROQ API ---");
    if (error.response) console.error("Data:", error.response.data);
    else console.error("Error Message:", error.message);
    return "Aii, AI yangu iko na issue kidogo. Try again in a moment. 😅";
  }
}
// --- END OF AI CONFIGURATION ---

// --- START OF WHATSAPP BOT LOGIC ---
async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
  const sock = makeWASocket({ logger: pino({ level: "silent" }), auth: state });

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
    const remoteJid = msg.key.remoteJid;

    // --- NEW, MORE ROBUST FILTER AT THE TOP ---
    // This now ignores messages from self, empty messages, and messages from channels.
    if (!msg.message || msg.key.fromMe || remoteJid.endsWith('@newsletter')) {
      if (remoteJid && remoteJid.endsWith('@newsletter')) {
        console.log(`[CHANNEL] Ignored a message from channel: ${remoteJid}`);
      }
      return;
    }
    // --- END OF NEW FILTER ---

    // Feature: View Statuses Automatically
    if (remoteJid === 'status@broadcast') {
      const sender = msg.key.participant || msg.participant;
      console.log(`[STATUS] Detected a new status update from ${sender}`);
      try {
        await new Promise(resolve => setTimeout(resolve, 3000));
        await sock.readMessages([msg.key]);
        console.log(`[STATUS] Successfully marked status from ${sender} as read.`);
      } catch (err) {
        console.error(`[STATUS] Failed to mark status as read for ${sender}:`, err);
      }
      return;
    }

    // Ignore group chats for AI replies
    if (remoteJid.endsWith('@g.us')) {
      return;
    }

    // Process direct messages with AI
    const incomingMessage = msg.message.conversation || msg.message.extendedTextMessage?.text;
    if (incomingMessage) {
      console.log(`Received message from ${msg.pushName} (${remoteJid}): "${incomingMessage}"`);
      if (!conversationHistory[remoteJid]) {
        conversationHistory[remoteJid] = [];
      }
      const userHistory = conversationHistory[remoteJid];
      const aiReply = await getAIReply(incomingMessage, userHistory);

      if (aiReply) {
        userHistory.push({ role: 'user', content: incomingMessage });
        userHistory.push({ role: 'assistant', content: aiReply });
        if (userHistory.length > MEMORY_LIMIT) {
          conversationHistory[remoteJid] = userHistory.slice(-MEMORY_LIMIT);
        }
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
        await sock.sendMessage(remoteJid, { text: aiReply });
        console.log(`Sent reply to ${msg.pushName}.`);
      }
    }
  });
}

// Start the bot
connectToWhatsApp();