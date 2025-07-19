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
  res.send('<h1>WhatsApp AI Bot is alive! (GroqCloud + Memory)</h1>');
});
app.listen(port, () => {
  console.log(`Web server listening on port ${port}.`);
});
// --- END OF WEB SERVER SETUP ---

// --- NEW: MEMORY MANAGEMENT ---
const conversationHistory = {}; // Stores conversation logs for each user
const MEMORY_LIMIT = 10; // Number of past messages to remember (user + bot)
// --- END OF MEMORY MANAGEMENT ---


// --- START OF AI CONFIGURATION (GroqCloud) ---
const personalityPrompt = process.env.BOT_PERSONALITY_PROMPT || "You are a helpful assistant.";
const groqApiKey = process.env.GROQ_API_KEY;

// UPDATED FUNCTION: Now accepts a history of past messages
async function getAIReply(userMessage, history = []) {
  if (!groqApiKey || !userMessage) {
    console.error("CRITICAL: Groq API Key or message is missing!");
    console.error("API Key present:", !!groqApiKey);
    console.error("API Key length:", groqApiKey ? groqApiKey.length : 0);
    console.error("Message present:", !!userMessage);
    return null;
  }

  const apiUrl = 'https://api.groq.com/openai/v1/chat/completions';

  // Construct the message list with full history
  const messages = [
    { role: "system", content: personalityPrompt },
    ...history, // Spread the past messages into the array
    { role: "user", content: userMessage } // Add the new user message
  ];

  const requestData = {
    model: "llama3-8b-8192",
    messages: messages, // Send the full conversation
    temperature: 0.7,
    max_tokens: 150,
  };

  const headers = {
    'Authorization': `Bearer ${groqApiKey}`,
    'Content-Type': 'application/json'
  };

  console.log(`Sending prompt to GroqCloud with ${history.length} past messages...`);
  console.log(`Total messages in request: ${messages.length}`);
  console.log(`API Key first 10 chars: ${groqApiKey ? groqApiKey.substring(0, 10) + '...' : 'MISSING'}`);

  try {
    const response = await axios.post(apiUrl, requestData, { headers });
    const reply = response.data.choices[0].message.content.trim();

    console.log(`Groq AI generated reply: "${reply}"`);
    return reply;
  } catch (error) {
    console.error("--- ERROR CALLING GROQ API ---");
    if (error.response) {
      console.error("Data:", error.response.data);
      console.error("Status:", error.response.status);
    } else {
      console.error("Error Message:", error.message);
    }
    return "Aii, AI yangu iko na issue kidogo. Try again in a moment. 😅";
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
    
    console.log("Connection update:", connection);
    
    if (qr) {
      console.log("\n=== QR CODE GENERATED ===");
      console.log("Please scan this QR code with your WhatsApp:");
      qrcode.generate(qr, { small: true });
      console.log("========================\n");
    }
    
    if (connection === "close") {
      console.log("Connection closed. Reason:", lastDisconnect?.error?.output?.statusCode);
      const shouldReconnect = (lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut;
      if (shouldReconnect) { 
        console.log("Attempting to reconnect...");
        connectToWhatsApp(); 
      }
    } else if (connection === "open") {
      console.log("✅ WhatsApp connection opened successfully!");
    } else if (connection === "connecting") {
      console.log("🔄 Connecting to WhatsApp...");
    }
  });

  sock.ev.on("creds.update", saveCreds);

  // UPDATED MESSAGE HANDLER WITH MEMORY
  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
    if (!msg.message || msg.key.fromMe || msg.key.remoteJid.endsWith('@g.us')) {
      return;
    }

    const incomingMessage = msg.message.conversation || msg.message.extendedTextMessage?.text;
    const remoteJid = msg.key.remoteJid; // User's WhatsApp ID

    if (incomingMessage) {
      console.log(`Received message from ${msg.pushName} (${remoteJid}): "${incomingMessage}"`);

      // 1. Initialize history for new users
      if (!conversationHistory[remoteJid]) {
        conversationHistory[remoteJid] = [];
      }
      const userHistory = conversationHistory[remoteJid];

      // 2. Get AI reply, passing the current user's history
      const aiReply = await getAIReply(incomingMessage, userHistory);

      if (aiReply) {
        // 3. Update history with the new exchange
        userHistory.push({ role: 'user', content: incomingMessage });
        userHistory.push({ role: 'assistant', content: aiReply });

        // 4. Trim the history to the memory limit
        if (userHistory.length > MEMORY_LIMIT) {
          conversationHistory[remoteJid] = userHistory.slice(userHistory.length - MEMORY_LIMIT);
          console.log(`History for ${remoteJid} trimmed to ${MEMORY_LIMIT} messages.`);
        }

        // 5. Send the reply
        await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 500));
        await sock.sendMessage(remoteJid, { text: aiReply });
        console.log(`Sent reply to ${msg.pushName}.`);
      }
    }
  });
}

// Start the bot
connectToWhatsApp();