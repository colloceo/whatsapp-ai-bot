# Personalized WhatsApp AI Assistant

This project is a powerful, self-hosted AI assistant that automatically replies to your personal WhatsApp messages. It uses the Baileys library to connect to WhatsApp and is powered by the lightning-fast GroqCloud API (running Llama 3) to generate human-like responses in your unique personality.

The bot is designed to be hosted 24/7 for free on [Replit](https://replit.com/) and can be customized to mimic any conversational style, from casual and witty to formal and professional.

![Bot Demo](https://i.imgur.com/aC3V4Jj.png) <!-- You can replace this with a screenshot of your own bot's conversation -->

## ✨ Core Features

-   **Real-time Auto-Reply:** Responds instantly to incoming WhatsApp messages.
-   **Customizable Personality:** Uses a detailed system prompt to adopt any personality, tone, or style (e.g., casual, humorous, professional, Swahili-English mix).
-   **Conversational Memory:** Remembers the last 10 messages in a conversation for contextual, continuous chats.
-   **High-Speed AI:** Powered by the [GroqCloud API](https://groq.com/) for incredibly fast response times.
-   **Free 24/7 Hosting:** Runs continuously using a simple web server and a free uptime monitor like [UptimeRobot](https://uptimerobot.com/).
-   **No Business API Needed:** Connects directly to your personal WhatsApp account using the open-source [Baileys](https://github.com/WhiskeySockets/Baileys) library.

## 🚀 Tech Stack

-   **Backend:** Node.js
-   **Web Server:** Express.js
-   **WhatsApp Integration:** Baileys (WhiskeySockets)
-   **AI Model API:** GroqCloud (Llama 3 8B)
-   **Hosting:** Replit
-   **Uptime Monitoring:** UptimeRobot

## 🛠️ Setup and Installation Guide

Follow these steps to get your own personalized WhatsApp bot running in minutes.

### 1. Initial Setup

-   **Fork this Repository** on GitHub or import it directly into Replit.
-   **Create a [GroqCloud Account](https://console.groq.com/)** and get your free API key.
-   **Create a [Replit Account](https://replit.com/)** if you don't have one.
-   **Create an [UptimeRobot Account](https://uptimerobot.com/)** for 24/7 hosting.

### 2. Configure Your Replit Project

1.  **Import to Replit:** On your Replit dashboard, click **"+ Create Repl"** and then **"Import from GitHub"**. Paste the URL of your forked repository.

2.  **Install Dependencies:** The `npm install` command should run automatically. If not, open the **Shell** tab and run it yourself.

3.  **Set Up Secrets:** This is the most important step for security. Go to the **Secrets** (🔒) tab in the Replit sidebar and add the following two secrets:

    -   **`GROQ_API_KEY`**: Paste the API key you generated from GroqCloud here.
    -   **`BOT_PERSONALITY_PROMPT`**: Paste your desired personality prompt here. See the templates below for examples.

### 3. Running the Bot

1.  **Start the Bot:** Click the big green **"Run"** button at the top.
2.  **Scan the QR Code:** A QR code will appear in the console on the right. Open WhatsApp on your phone, go to **Settings > Linked Devices > Link a Device**, and scan the QR code.
3.  **Success!** The console will log "WhatsApp connection opened successfully!". Your bot is now live.

### 4. Setting Up 24/7 Hosting

1.  **Get the Bot's URL:** In the Replit WebView tab, you will see a URL like `https://your-bot-name.your-username.repl.co`. Copy this URL.
2.  **Create a Monitor:** In your UptimeRobot dashboard, click **"+ Add New Monitor"**.
    -   **Monitor Type:** `HTTP(S)`
    -   **Friendly Name:** `WhatsApp Bot` (or any name)
    -   **URL (or IP):** Paste your Replit URL.
    -   **Monitoring Interval:** Set to **"Every 5 minutes"**.
3.  **Done!** Your bot will now be pinged regularly and will stay awake 24/7.

## ⚙️ Configuration (Personality Prompts)

The bot's entire personality is controlled by the `BOT_PERSONALITY_PROMPT` secret. Here are some templates to get you started.

### Casual & Humorous (Kenyan Style)
```
You are NOT an AI assistant. You are Collins, a chill, young Kenyan guy talking to his friend. Your ONLY job is to reply exactly like Collins would.

**YOUR CORE RULES:**
- **Language:** Mix English, Swahili, and Sheng naturally (e.g., "Sawasawa jakom," "Niko fiti," "wepako?").
- **Tone:** Always be casual, friendly, and often humorous/sarcastic.
- **Length:** Keep replies VERY short.
- **Emojis:** Use '😂' and '🤦‍♂️' and '🤝' frequently.
- **Role:** You are a peer, a friend. Not an assistant.

**LEARN FROM THESE EXAMPLES:**
User: Kesho utaenda?😂😂
Collins: Obviously lazima nifike😂😂

User: Uko TUK?😂
Collins: Ndio niko on my way 😂

Now, based on all these rules, give a short, casual reply AS COLLINS to the following message.
```

### Professional Assistant
```
You are a professional AI assistant managing messages for Collins. Your persona is polite, clear, and concise.

**YOUR CORE RULES:**
- **Tone:** Always be courteous and respectful.
- **Language:** Use clear, standard English. Avoid slang.
- **Purpose:** You are not Collins; you are his assistant. Acknowledge the message and inform the sender that Collins will get back to them.

**LEARN FROM THESE EXAMPLES:**
User: Hello Collins, hope you're having a good week.
Assistant's Reply: Hello. Your message has been received. Collins will get back to you shortly.

User: Please let me know when you are available for a quick call.
Assistant's Reply: Your request has been noted. Collins will follow up regarding his availability.

Now, based on these rules, respond professionally as Collins' assistant.
```

## 📂 Project Structure
```
.
├── index.js                # Main application file (server + bot logic)
├── package.json            # Project dependencies
├── package-lock.json       # Dependency lock file
├── .replit                 # Replit configuration
├── replit.nix              # Replit environment configuration
└── auth_info_baileys/      # Stores your WhatsApp session (DO NOT SHARE)
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/your-username/your-repo-name/issues).

## 📄 License

This project is licensed under the MIT License. See the `LICENSE` file for details.
