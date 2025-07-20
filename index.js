const {
  default: makeWASocket,
  useMultiFileAuthState,
  DisconnectReason
} = require("@whiskeysockets/baileys");
const pino = require("pino");
const qrcode = require("qrcode-terminal");
const axios = require('axios');
const express = require('express');
const { getJson } = require("google-search-results-nodejs"); // For Google Search
const cron = require('node-cron');     // For scheduling
const chrono = require('chrono-node'); // For parsing dates

// --- KENYAN TIME HELPER ---
function getKenyanTime() {
  const now = new Date();
  const options = { timeZone: 'Africa/Nairobi', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false };
  return new Intl.DateTimeFormat('en-GB', options).format(now);
}
// --- END OF TIME HELPER ---

// --- HELP & WELCOME MESSAGE ---
const HELP_MESSAGE = `*Welcome! I'm Collins' AI Assistant* 🤖

I can chat with you, but I also have some special features. Here's a quick guide:

*Smart Actions*
➡️ **Google Search:** Ask about recent events or facts (e.g., \`who is the governor of Nairobi?\`).
➡️ **Scheduler:** Set reminders (e.g., \`remind me to call the client in 20 minutes\`).

*Games*
➡️ To start a text adventure, type: \`start game: adventure\`
➡️ To play 20 Questions, type: \`start game: 20 questions\`
➡️ To play Two Truths & a Lie, type: \`game: truths about [topic]\`
➡️ To quit any game, type: \`exit game\`

*Other Commands*
➡️ For this menu again, type: \`help\`
`;
// --- END OF HELP & WELCOME MESSAGE ---

// --- WEB SERVER SETUP ---
const app = express();
const port = process.env.PORT || 3000;
app.get('/', (req, res) => { res.send(`<h1>WhatsApp AI Bot is alive!</h1><p>Last check: ${getKenyanTime()}</p>`); });
app.listen(port, () => { console.log(`[${getKenyanTime()}] Web server listening on port ${port}.`); });
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

// --- AI & API CONFIGURATION ---
const personalityPrompt = process.env.BOT_PERSONALITY_PROMPT;
const groqApiKey = process.env.GROQ_API_KEY;
const serpApiKey = process.env.SERPAPI_API_KEY;

// Main AI function to get a structured JSON tool response
async function getAIResponse(userMessage, history = []) {
  if (!groqApiKey || !userMessage) return null;
  const apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
  const messages = [
    { role: "system", content: personalityPrompt },
    ...history,
    { role: "user", content: `Current time is ${getKenyanTime()}. User request: "${userMessage}"` }
  ];
  const requestData = { model: "llama3-8b-8192", messages: messages, temperature: 0.5, response_format: { type: "json_object" } };
  const headers = { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' };
  try {
    const response = await axios.post(apiUrl, requestData, { headers });
    return JSON.parse(response.data.choices[0].message.content);
  } catch (error) {
    console.error(`[${getKenyanTime()}] --- ERROR GETTING AI TOOL RESPONSE ---`, error.response ? error.response.data : error.message);
    return { tool: 'reply', content: "Sorry, I had a problem understanding that." };
  }
}

// AI function specifically for games (doesn't use tools)
async function getGameAIResponse(userMessage, history, gamePrompt) {
  if (!groqApiKey) return null;
  const apiUrl = 'https://api.groq.com/openai/v1/chat/completions';
  const messages = [{ role: "system", content: gamePrompt }, ...history, { role: "user", content: userMessage }];
  const requestData = { model: "llama3-8b-8192", messages: messages, temperature: 0.8, max_tokens: 200 };
  const headers = { 'Authorization': `Bearer ${groqApiKey}`, 'Content-Type': 'application/json' };
  try {
    const response = await axios.post(apiUrl, requestData, { headers });
    return response.data.choices[0].message.content.trim();
  } catch (error) {
    console.error(`[${getKenyanTime()}] --- ERROR GETTING GAME AI RESPONSE ---`, error.response ? error.response.data : error.message);
    return "The game master seems to be taking a break. Try again in a moment.";
  }
}
// --- END OF AI CONFIGURATION ---

// --- START OF WHATSAPP BOT LOGIC ---
async function connectToWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState("auth_info_baileys");
  const sock = makeWASocket({ logger: pino({ level: "silent" }), auth: state });

  function scheduleMessage(jid, date, message) {
    const job = new cron.schedule(date, async () => {
      console.log(`[${getKenyanTime()}] [SCHEDULER] Sending scheduled message to ${jid}`);
      await sock.sendMessage(jid, { text: message });
      job.stop();
    }, { scheduled: true, timezone: "Africa/Nairobi" });
    console.log(`[${getKenyanTime()}] [SCHEDULER] Message for ${jid} scheduled for ${date.toString()}`);
  }

  sock.ev.on("connection.update", (update) => {
    const { connection, lastDisconnect, qr } = update;
    if (qr) { console.log(`[${getKenyanTime()}] QR code generated.`); qrcode.generate(qr, { small: true }); }
    if (connection === "close") {
      const reason = (lastDisconnect.error)?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) { connectToWhatsApp(); }
    } else if (connection === "open") {
      console.log(`[${getKenyanTime()}] WhatsApp connection opened successfully!`);
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async (m) => {
    const msg = m.messages[0];
    const remoteJid = msg.key.remoteJid;

    if (!msg.message || msg.key.fromMe || remoteJid.endsWith('@newsletter') || remoteJid.endsWith('@g.us')) return;

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

    const incomingMessage = msg.message.conversation || msg.message.extendedTextMessage?.text;
    if (!incomingMessage) return;

    const messageLower = incomingMessage.toLowerCase();
    const userState = gameState[remoteJid];

    // --- HIGH PRIORITY COMMANDS (HELP & WELCOME) ---
    if (!conversationHistory[remoteJid] && !userState) {
        await sock.sendMessage(remoteJid, { text: HELP_MESSAGE });
    }
    if (messageLower === 'help' || messageLower === 'menu') {
        await sock.sendMessage(remoteJid, { text: HELP_MESSAGE });
        return;
    }

    // --- GAME ROUTER ---
    if (messageLower === 'exit game' && userState) {
      delete gameState[remoteJid];
      await sock.sendMessage(remoteJid, { text: "Game ended. It was fun playing! 🙂" });
      return;
    }
    if (messageLower.startsWith('start game:')) {
      const game = messageLower.replace('start game:', '').trim();
      if (GAME_PROMPTS[game]) {
        gameState[remoteJid] = { game: game, history: [] };
        const firstAIReply = await getGameAIResponse("Let's start", [], GAME_PROMPTS[game]);
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
            const aiResponse = await getGameAIResponse(topic, [], GAME_PROMPTS.truths);
            if (aiResponse && aiResponse.includes("LIE:")) {
                const parts = aiResponse.split("LIE:");
                const facts = parts[0].trim();
                gameState[remoteJid] = { game: 'truths', lie: parseInt(parts[1].trim(), 10) };
                await sock.sendMessage(remoteJid, { text: `Okay, here are three facts about "${topic}". Can you guess which one is the lie?\n\n${facts}` });
            } else { await sock.sendMessage(remoteJid, { text: "Sorry, I couldn't generate facts for that topic." }); }
            return;
        }
    }
    if (userState) {
      if (userState.game === 'adventure' || userState.game === 'twenty_questions') {
        const aiReply = await getGameAIResponse(incomingMessage, userState.history, GAME_PROMPTS[userState.game]);
        if (aiReply) {
          userState.history.push({ role: 'user', content: incomingMessage });
          userState.history.push({ role: 'assistant', content: aiReply });
          await sock.sendMessage(remoteJid, { text: aiReply });
        }
        return;
      } else if (userState.game === 'truths') {
        const guess = parseInt(messageLower.trim(), 10);
        if (guess === userState.lie) { await sock.sendMessage(remoteJid, { text: `You got it! Number ${guess} was the lie. Well done! 🎉` }); } 
        else { await sock.sendMessage(remoteJid, { text: `Nope, the correct lie was number ${userState.lie}. Better luck next time!` }); }
        delete gameState[remoteJid];
        return;
      }
    }
    // --- END OF GAME ROUTER ---

    // --- DEFAULT ACTION: AI TOOL ROUTER ---
    console.log(`[${getKenyanTime()}] Received message from ${msg.pushName} (${remoteJid}): "${incomingMessage}"`);
    if (!conversationHistory[remoteJid]) conversationHistory[remoteJid] = [];
    const userHistory = conversationHistory[remoteJid];
    const aiResponse = await getAIResponse(incomingMessage, userHistory);
    if (!aiResponse || !aiResponse.tool) return;

    let replyMessage = "";

    switch (aiResponse.tool) {
      case 'search':
        console.log(`[${getKenyanTime()}] [TOOL] Performing search: "${aiResponse.query}"`);
        try {
          const searchResults = await getJson({ api_key: serpApiKey, q: aiResponse.query });
          let context = "No good results found.";
          if (searchResults.answer_box) { context = searchResults.answer_box.snippet || searchResults.answer_box.answer; } 
          else if (searchResults.organic_results && searchResults.organic_results[0].snippet) { context = searchResults.organic_results[0].snippet; }

          const finalResponse = await getAIResponse(`Based on this info: "${context}". Answer the original question: "${incomingMessage}"`, []);
          replyMessage = finalResponse.content;
        } catch (searchError) {
          replyMessage = "Sorry, I had a problem searching for that.";
        }
        break;

      case 'schedule':
        const parsedDate = chrono.parseDate(aiResponse.when, new Date(), { forwardDate: true });
        if (parsedDate) {
          scheduleMessage(remoteJid, parsedDate, aiResponse.what);
          replyMessage = `Ok, reminder set: "${aiResponse.what}" for ${parsedDate.toLocaleString('en-KE', { timeZone: 'Africa/Nairobi' })}`;
        } else {
          replyMessage = "Sorry, I couldn't understand that date or time.";
        }
        break;

      case 'reply':
      default:
        replyMessage = aiResponse.content;
        break;
    }

    if (replyMessage) {
      userHistory.push({ role: 'user', content: incomingMessage });
      userHistory.push({ role: 'assistant', content: replyMessage });
      if (userHistory.length > MEMORY_LIMIT) {
        conversationHistory[remoteJid] = userHistory.slice(-MEMORY_LIMIT);
      }
      await sock.sendMessage(remoteJid, { text: replyMessage });
      console.log(`[${getKenyanTime()}] Sent reply to ${msg.pushName}.`);
    }
  });
}

// Start the bot
connectToWhatsApp();