# 🤖 Personalized WhatsApp AI Assistant

A powerful, self-hosted AI chatbot that **automatically replies to your personal WhatsApp messages**—in your own tone and personality.

This bot connects to WhatsApp via the [**Baileys**](https://github.com/WhiskeySockets/Baileys) library and uses the blazing-fast **GroqCloud API** (running **Llama 3**) to generate intelligent, contextual responses.

You can fully customize the assistant’s voice—from witty and sarcastic to formal and professional. Perfect for creators, influencers, or just for fun.

![Bot Demo](https://i.imgur.com/aC3V4Jj.png)

---

## ✨ Features at a Glance

✅ Real-time auto-responses to personal WhatsApp messages  
✅ Custom personality prompt (e.g., funny, professional, or bilingual)  
✅ Smart conversational memory (last 10 messages)  
✅ Lightning-fast replies via [GroqCloud](https://groq.com)  
✅ 24/7 free hosting with [Replit](https://replit.com) + [UptimeRobot](https://uptimerobot.com)  
✅ Fully personal — no WhatsApp Business API needed!

---

## 🧠 How It Works

- **Baileys**: Handles WhatsApp connectivity  
- **GroqCloud API**: AI brain (LLaMA 3)  
- **Express.js**: Keeps the bot running on Replit  
- **UptimeRobot**: Prevents bot from sleeping  
- **Environment Variables**: Manages secrets securely

---

## 🚀 Tech Stack

| Layer        | Technology            |
|--------------|------------------------|
| Backend      | Node.js + Express.js   |
| WhatsApp     | Baileys (WebSocket API)|
| AI Model     | GroqCloud (LLaMA 3 8B) |
| Hosting      | Replit                 |
| Monitoring   | UptimeRobot            |

---

## ⚙️ Setup & Installation

### 1️⃣ Prerequisites

- [✅ GroqCloud Account](https://console.groq.com/)
- [✅ Replit Account](https://replit.com/)
- [✅ UptimeRobot Account](https://uptimerobot.com/)

---

### 2️⃣ Clone or Fork

- Click **“Fork”** this repository on GitHub  
  OR  
- Import into Replit using the GitHub URL

---

### 3️⃣ Configure Secrets

In Replit, click the **🔒 “Secrets” tab** and add:

| Secret Name              | Description                                      |
|--------------------------|--------------------------------------------------|
| `GROQ_API_KEY`           | Your GroqCloud API Key                           |
| `BOT_PERSONALITY_PROMPT` | Your assistant’s tone/personality definition     |

---

### 4️⃣ Run Your Bot

1. Click the big green **"Run"** button in Replit  
2. Wait for the **QR code** to appear in the console  
3. Open WhatsApp → `Settings → Linked Devices → Link a Device`  
4. Scan the QR code  
5. ✅ Done! The bot is now live and replying automatically

---

## 🌐 Enable 24/7 Hosting

1. Get your app URL from Replit WebView  
   e.g. `https://your-bot-name.username.repl.co`

2. In [UptimeRobot](https://uptimerobot.com):  
   - Click **“+ Add New Monitor”**  
   - Type: `HTTP(S)`  
   - Name: `WhatsApp Bot`  
   - URL: Paste your Replit URL  
   - Interval: Every 5 minutes

3. ✅ Save — your bot stays online forever!

---

## 🧠 Personality Prompt Templates

### 🔥 Kenyan Casual (Sheng/Swahili Mix)
```txt
You are NOT an AI assistant. You are Collins, a chill Kenyan guy chatting with his friends.

**RULES:**
- Language: Mix English, Swahili, and Sheng
- Tone: Casual, funny, sarcastic
- Replies: Short and relatable
- Emojis: Use 😂, 🤦‍♂️, 🤝

User: Uko TUK?😂  
Reply: Ndio niko on my way 😂
