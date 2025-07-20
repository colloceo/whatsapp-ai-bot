const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const qrcode = require("qrcode-terminal");
const axios = require('axios');
const express = require('express');

// --- KENYAN TIME HELPER ---
/**
 * Gets the current date and time formatted for Kenya (EAT, UTC+3).
 * @returns {string} Formatted date and time string.
 */
function getKenyanTime() {
  const now = new Date();
  const options = {
    timeZone: 'Africa/Nairobi',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  };
  return new Intl.DateTimeFormat('en-GB', options).format(now);
}
// --- END OF TIME HELPER ---

// --- HELP & WELCOME MESSAGE ---
const HELP_MESSAGE = `*Welcome! I'm Collins' AI Assistant* 🤖

I can chat with you, but I also have some special features. Here's what you can do:

*Chat Normally*
Just send a message and I'll reply!

*Games*
➡️ To start a text adventure, type: \`start game: adventure\`
➡️ To play 20 Questions, type: \`start game: 20 questions\`
➡️ To play Two Truths & a Lie, type: \`game: truths about [topic]\` (e.g., \`game: truths about the ocean\`)
➡️ To quit any game, type: \`exit game\`

*Other Commands*
➡️ For a list of all commands, type: \`help\`

Enjoy!
`;
// --- END OF HELP & WELCOME MESSAGE ---

// --- WEB SERVER SETUP (FOR 24/7 HOSTING) ---
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => {
  res.send(`<h1>WhatsApp AI Bot is alive!</h1><p>Last check: ${getKenyanTime()}</p>`);
});
app.listen(port, () => {
  console.log(`[${getKenyanTime()}] Web server listening on port ${port}.`);
});
// --- END OF WEB SERVER SETUP ---

// --- MEMORY & GAME MANAGEMENT ---
const conversationHistory = {};
const MEMORY_LIMIT = 10;

const GAME_PROMPTS = {
  adventure: "You are a fantasy role-playing game master named Kai. Start by describing an interesting and mysterious scene where the player has just woken up in a dark, ancient forest with no memory of how they arrived. Describe their surroundings in two or three sentences, then ask 'What do you do?'. From then on, you will take the user's reply and describe the outcome, continuing the story based on their choices. Be creative, dramatic, and engaging. Never break character.",
  twenty_questions: "You are the host of a '20 Questions' game. Your task is to silently think of a specific person, character, or object. Do NOT reveal what you have thought of. The user will ask you yes/no questions. You must answer them truthfully. Keep track of the questions asked. If the user guesses correctly, your ONLY response must be in the format `CORRECT! It was [Your Answer].`. If they guess incorrectly, say 'That's not it. Keep trying!'. If they run out of 20 questions, reveal the answer. Start the game now by saying 'I have thought of something. You have 20 questions. Go ahead!'",
  truths: "You are a fact-generating AI for a game of 'Two Truths and a Lie'. When the user gives you a topic, you must generate two true, interesting facts and one plausible but false fact about it. Randomize the order. Format your response ONLY as follows, with nothing before or after:\n1. [Fact 1]\n2. [Fact 2]\n3. [Fact 3]\nLIE:[Number of the lie]"
};
const gameState = {};
// --- END OF MANAGEMENT ---

// --- AI CONFIGURATION (GroqCloud) ---
const personalityPrompt = process.env.BOT_PERSONALITY_PROMPT || "You are a helpful assistant.";
const groqApiKey = process.env.GROQ_API_KEY;

async function getAIReply(userMessage, history = [], systemPrompt = personalityPrompt) {
  if (!groqApiKey || !userMessage) {
    console.error(`[${getKenyanTime()}] CRITICAL: Groq API Key or message is missing!`);
    return null;
  }
  const kenyanTime = getKenyanTime();
  const dynamicSystemPrompt = `${systemPrompt}\n\nCurrent Kenyan time is ${kenyanTime}. Use this for context if needed.`;

  const apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
  const messages = [
    { role: "system", content: dynamicSystemPrompt },
    ...history,
    { role: "user", content: userMessage }
  ];
  const requestData = { model: "llama3-8b-8192", messages: messages, temperature: 0.8, max_tokens: 200 };
  const headers = { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' };
  console.log(`[${getKenyanTime()}] Sending prompt to GroqCloud...`);
  try {
    const response = await axios.post(apiUrl, requestData, { headers });
    const reply = response.data.choices[0].message.content.trim();
    console.log(`[${getKenyanTime()}] Groq AI generated reply: "${reply}"`);
    return reply;
  } catch (error) {
    console.error(`[${getKenyanTime()}] --- ERROR CALLING GROQ API ---`);
    if (error.response) console.error("Data:", error.response.data);
    else console.error("Error Message:", error.message);
    return "Aii, AI yangu iko na issue kidogo. 😅";
  }
}
// --- END OF AI CONFIGURATION ---

// --- START OF WHATSAPP BOT LOGIC ---
async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
  const sock = makeWASocket({ logger: pino({ level: "silent" }), auth: state });

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) { console.log(`[${getKenyanTime()}] QR code generated.`); qrcode.generate(qr, { small: true }); }
    if (connection === "close") {
      const reason = (lastDisconnect.error)?.output?.statusCode;
      console.log(`[${getKenyanTime()}] Connection closed. Reason: ${reason}. Reconnecting...`);
      if (reason !== DisconnectReason.loggedOut) { connectToWhatsApp(); }
    } else if (connection === "open") {
      console.log(`[${getKenyanTime()}] WhatsApp connection opened successfully!`);
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
    const remoteJid = msg.key.remoteJid;

    if (!msg.message || msg.key.fromMe || remoteJid.endsWith('@newsletter')) return;

    if (remoteJid === 'status@broadcast') {
      const sender = msg.key.participant || msg.participant;
      console.log(`[${getKenyanTime()}] [STATUS] Detected status from ${sender}`);
      try {
        await new Promise(resolve => setTimeout(resolve, 3000));
        await sock.readMessages([msg.key]);
        console.log(`[${getKenyanTime()}] [STATUS] Marked status from ${sender} as read.`);
      } catch (err) { console.error(`[STATUS] Failed to mark status as read:`, err); }
      return;
    }

    if (remoteJid.endsWith('@g.us')) return;

    const incomingMessage = msg.message.conversation || msg.message.extendedTextMessage?.text;
    if (!incomingMessage) return;

    const messageLower = incomingMessage.toLowerCase();
    const isFirstTimeUser = !conversationHistory[remoteJid] && !gameState[remoteJid];

    if (isFirstTimeUser) {
        await sock.sendMessage(remoteJid, { text: HELP_MESSAGE });
    }

    if (messageLower === 'help' || messageLower === 'menu' || messageLower === 'commands') {
        await sock.sendMessage(remoteJid, { text: HELP_MESSAGE });
        return;
    }

    const userState = gameState[remoteJid];
    if (messageLower === 'exit game') {
      if (userState) {
        delete gameState[remoteJid];
        await sock.sendMessage(remoteJid, { text: "Game ended. It was fun playing with you! 🙂" });
        return;
      }
    }

    if (messageLower.startsWith('start game:')) {
      const game = messageLower.replace('start game:', '').trim();
      if (GAME_PROMPTS[game]) {
        gameState[remoteJid] = { game: game, history: [] };
        const firstAIReply = await getAIReply("", [], GAME_PROMPTS[game]);
        if (firstAIReply) {
          gameState[remoteJid].history.push({ role: 'assistant', content: firstAIReply });
          await sock.sendMessage(remoteJid, { text: firstAIReply });
        }
        return;
      }
    }

    if (messageLower.startsWith('game: truths about')) {
        const topic = messageLower.replace('game: truths about', '').trim();
        if (topic) {
            gameState[remoteJid] = { game: 'truths', topic: topic };
            const aiResponse = await getAIReply(topic, [], GAME_PROMPTS.truths);
            if (aiResponse && aiResponse.includes("LIE:")) {
                const parts = aiResponse.split("LIE:");
                const facts = parts[0].trim();
                const lieNumber = parseInt(parts[1].trim(), 10);
                gameState[remoteJid].lie = lieNumber;
                await sock.sendMessage(remoteJid, { text: `Okay, here are three facts about "${topic}". Can you guess which one is the lie?\n\n${facts}` });
            } else {
                await sock.sendMessage(remoteJid, { text: "Sorry, I couldn't generate the facts for that topic. Try another one!" });
            }
            return;
        }
    }

    if (userState) {
      if (userState.game === 'adventure' || userState.game === 'twenty_questions') {
        const gameHistory = userState.history;
        const aiReply = await getAIReply(incomingMessage, gameHistory, GAME_PROMPTS[userState.game]);
        if (aiReply) {
          gameHistory.push({ role: 'user', content: incomingMessage });
          gameHistory.push({ role: 'assistant', content: aiReply });
          await sock.sendMessage(remoteJid, { text: aiReply });
        }
        return;

      } else if (userState.game === 'truths') {
        const guess = parseInt(incomingMessage.trim(), 10);
        if (guess === userState.lie) {
          await sock.sendMessage(remoteJid, { text: `You got it! Number ${guess} was the lie. Well done! 🎉` });
        } else {
          await sock.sendMessage(remoteJid, { text: `Nope, the correct lie was number ${userState.lie}. Better luck next time!` });
        }
        delete gameState[remoteJid];
        return;
      }
    }

    // Default: Normal AI Conversation
    console.log(`[${getKenyanTime()}] Received message from ${msg.pushName} (${remoteJid}): "${incomingMessage}"`);
    if (!conversationHistory[remoteJid]) conversationHistory[remoteJid] = [];
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
      console.log(`[${getKenyanTime()}] Sent reply to ${msg.pushName}.`);
    }
  });
}

// Start the bot
connectToWhatsApp();