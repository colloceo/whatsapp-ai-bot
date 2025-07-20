# Personalized WhatsApp AI Assistant 🤖

This is a powerful, self-hosted AI assistant that automatically replies to your personal WhatsApp messages. It's designed to be a true digital extension of yourself, capable of handling conversations with your unique personality, running games, and performing automated tasks.

The bot uses the [Baileys](https://github.com/WhiskeySockets/Baileys) library to connect to WhatsApp and is powered by the lightning-fast **GroqCloud API** (running Llama 3) to generate intelligent, context-aware responses. It's built to run 24/7 for free on modern platforms like [Koyeb](https://koyeb.com/).

![Bot Demo](https://i.imgur.com/8aVSHaT.gif) <!-- Replace this with a screen recording or screenshot of your bot in action! -->

## ✨ Core Features

-   **Real-time Auto-Reply:** Responds instantly to direct messages.
-   **Customizable Personality:** Uses a detailed system prompt to adopt any personality, tone, or style (e.g., casual, humorous, professional, Swahili-English mix).
-   **Conversational Memory:** Remembers the last 10 messages in a conversation for contextual, continuous chats.
-   **High-Speed AI:** Powered by the GroqCloud API for incredibly fast and natural response times.
-   **Time-Aware:** Knows the current Kenyan date and time (EAT, UTC+3) for more relevant replies and accurate logging.
-   **Interactive Game Engine:**
    -   🎲 **AI Dungeon Master:** An AI-driven text adventure game.
    -   🤔 **20 Questions:** The classic guessing game powered by AI.
    -   🤥 **Two Truths and a Lie:** A fun fact-checking game.
-   **Automated Actions:**
    -   **Auto-Views Statuses:** Automatically "views" status updates from your contacts.
    -   **Smart Filtering:** Intelligently ignores messages from groups and WhatsApp Channels.
-   **User-Friendly Onboarding:**
    -   **Welcome Message:** Greets new users with a helpful menu of commands.
    -   **Help Command:** Provides a list of features at any time.
-   **Free 24/7 Hosting:** Designed to be deployed on an "always-on" free tier from a platform like [Koyeb](https://koyeb.com/).

## 🚀 Tech Stack

-   **Backend:** Node.js
-   **Web Server:** Express.js (for uptime on hosting platforms)
-   **WhatsApp Integration:** Baileys (WhiskeySockets)
-   **AI Model API:** GroqCloud (Llama 3 8B)
-   **Hosting:** Koyeb (Recommended), Railway, Render, or Self-Hosted.

## 🛠️ Setup and Installation Guide (on Koyeb)

Follow these steps to deploy your own personalized WhatsApp bot for free, with no credit card required.

### 1. Prerequisites

-   A **[GitHub](https://github.com/)** account.
-   A **[GroqCloud Account](https://console.groq.com/)** to get your free API key.
-   A **[Koyeb Account](https://koyeb.com/)** (sign up with your GitHub account).

### 2. Prepare Your Repository

1.  **Fork this Repository** to your own GitHub account.
2.  Ensure your `package.json` file has a `start` script:
    ```json
    "scripts": {
      "start": "node index.js"
    }
    ```

### 3. Deploy on Koyeb

1.  On your Koyeb dashboard, click **"Create App"**.
2.  Choose **GitHub** as the deployment method and select your forked repository.
3.  Koyeb will analyze the repo. In the "Environment Variables" section, click **"Add Variable"** and add your two secrets:
    -   `GROQ_API_KEY`: Paste the API key you generated from GroqCloud.
    -   `BOT_PERSONALITY_PROMPT`: Paste your desired personality prompt (see templates below).
4.  Ensure the **Instance Size** is set to **"Free - Nano"**.
5.  Click **"Deploy"**.

### 4. Go Live!

1.  Koyeb will build and deploy your bot. This may take a few minutes.
2.  Once it's running, click on the **"Logs"** tab for your service.
3.  A **QR code** will appear in the logs. Open WhatsApp on your phone, go to **Settings > Linked Devices > Link a Device**, and scan the QR code.
4.  The logs will show "WhatsApp connection opened successfully!". Your bot is now live and running 24/7.

## ⚙️ Configuration: Customizing Your Bot's Personality

The bot's entire personality is controlled by the `BOT_PERSONALITY_PROMPT` environment variable. Here are some templates to get you started.

### Casual & Humorous (Kenyan Style)
```
You are NOT an AI assistant. You are Collins, a chill, young Kenyan guy talking to his friend. Your ONLY job is to reply exactly like Collins would.

**YOUR CORE RULES:**
- **Language:** Mix English, Swahili, and Sheng naturally (e.g., "Sawasawa jakom," "Niko fiti," "wepako?").
- **Tone:** Always be casual, friendly, and often humorous/sarcastic.
- **Length:** Keep replies VERY short.
- **Emojis:** Use '😂' and '🤦‍♂️' and '🤝' frequently.

**LEARN FROM THESE EXAMPLES:**
User: Kesho utaenda?😂😂
Collins: Obviously lazima nifike😂😂
```

### Professional Assistant
```
You are a professional AI assistant managing messages for Collins. Your persona is polite, clear, and concise.

**YOUR CORE RULES:**
- **Tone:** Always be courteous and respectful.
- **Language:** Use clear, standard English. Avoid slang.
- **Purpose:** You are not Collins; you are his assistant. Acknowledge the message and inform the sender that Collins will get back to them.

**LEARN FROM THESE EXAMPLES:**
User: Hello, hope you're having a good week.
Assistant's Reply: Hello. Your message has been received. Collins will get back to you shortly.
```

## 📂 Project Structure
```
.
├── index.js                # Main application file (all logic)
├── package.json            # Project dependencies and start script
├── README.md               # This file
└── auth_info_baileys/      # Stores your WhatsApp session (auto-generated, DO NOT SHARE)
```

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the [issues page](https://github.com/colloceo/whatsapp-ai-bot/issues).

## 📄 License

This project is licensed under the MIT License.
