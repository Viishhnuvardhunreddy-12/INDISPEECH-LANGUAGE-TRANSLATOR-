🌐🗣️ IndiSpeech – Multilingual Speech Translator Web App
IndiSpeech is an AI-powered Flask web application that translates English speech or text into multiple Indian languages. It converts the translated output into audio and also supports file download and sharing, making it a powerful tool for communication across language barriers.

🚀 Key Features
✅ Multilingual Translation
Translate English into several Indian languages like Hindi, Telugu, Tamil, Kannada, Malayalam, and Bengali.

✅ Text, Voice & Audio File Input
Supports input via:
Typed text
Voice recording (microphone)

Uploaded audio files
✅ Text & Audio Output
Get both the translated text and audio (MP3) response instantly.
✅ Download & Share
Download translated audio, copy the translated text, or share it via email, WhatsApp, or nearby sharing.
✅ Language Detection
Automatically detects the language of the input text or audio for accurate translation.
✅ User Login System
Secure login functionality to personalize user sessions.
✅ Robust Error Handling & Retry Logic
Gracefully handles network failures and translation errors with automatic retries.

📸 Screenshots (Optional)
You can add screenshots here showing:
Login Page
Input Form
Translation Result with Audio Output
Download & Share Buttons

| Layer              | Tech Used                      |
| ------------------ | ------------------------------ |
| Backend            | Python Flask                   |
| Speech Recognition | SpeechRecognition + Google API |
| Translation        | Googletrans                    |
| Text-to-Speech     | gTTS (Google Text-to-Speech)   |
| Frontend           | HTML, CSS, Bootstrap           |
| Session/Auth       | Flask sessions                 |

📂 Project Structure
IndiSpeech/
│
├── templates/
│   ├── login.html
│   ├── welcome.html
│   ├── index.html
│   └── about.html
│
├── outputs/                  # Stores generated MP3 audio files
│
├── app.py                    # Main Flask application
├── requirements.txt          # Python dependencies
└── README.md                 # Project documentation

🔐 Default Login (for demo)
| Username | Password   |
| -------- | ---------- |
| viishhnu | reddy\@143 |

🧠 How It Works
Input: User submits English text or audio.
Speech-to-Text: Converts audio to text using SpeechRecognition.
Translation: Translates detected or input text to selected Indian language using googletrans.
Text-to-Speech: Uses gTTS to generate an MP3 audio file of the translated text.
Output: Displays both text and playable/downloadable audio.

❗ Notes
Internet is required for Google Speech Recognition and Translation.
For long audio files, response time may vary.
The app creates and stores MP3 files temporarily in the outputs/ folder.

📈 Future Enhancements
🌐 Integrate more languages & dialects
🔒 Secure login with database and hashing
🎤 Real-time microphone streaming
📲 Progressive Web App (PWA) version
📊 User history tracking and analytics

