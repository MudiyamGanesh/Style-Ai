# 💜 Style AI: Midnight Vogue Edition

![Style AI Banner](https://img.shields.io/badge/Style%20AI-Midnight%20Vogue-7c3aed?style=for-the-badge) 
![Python](https://img.shields.io/badge/Python-3.9%2B-blue?style=flat&logo=python)
![Flask](https://img.shields.io/badge/Flask-Backend-black?style=flat&logo=flask)
![Groq](https://img.shields.io/badge/Groq-LPU%20Inference-orange?style=flat)
![OpenCV](https://img.shields.io/badge/OpenCV-Computer%20Vision-green?style=flat&logo=opencv)

> **"Your Personal Fashion Architect."**
> An intelligent web application that analyzes your unique features and uses Generative AI to curate high-end fashion advice, color palettes, and smart shopping links.

---

## ✨ Features

### 🎨 Intelligent Skin Tone Detection
Unlike basic filters, Style AI uses **OpenCV** and **K-Means Clustering** to analyze the pixel data of your face. It calculates your exact skin tone category (Fair, Medium, Olive, or Deep) to ensure recommendations actually suit you.

### 🧠 Powered by Groq LPU™
Built on the **LLaMA 3.3-70b** model via **Groq**, ensuring near-instant fashion advice. No waiting for spinning wheels—get complex styling logic in milliseconds.

### 🛍️ Smart Shopping Links
We solved the "Garbage In, Garbage Out" problem. Instead of generic searches, the AI generates **context-aware keywords** (e.g., *"Emerald Green Silk Dress Women"*) to filter out irrelevant results on Amazon.

### 🌑 "Midnight Vogue" UI
A fully responsive, mobile-first design featuring:
- **Dark Mode Aesthetic** (`#0f0f0f` background).
- **Glassmorphism** effects on upload.
- **Interactive "Danger Chips"** for colors to avoid.

---

## 🛠️ Tech Stack

| Component | Technology | Description |
| :--- | :--- | :--- |
| **Backend** | **Flask (Python)** | Lightweight server handling image processing & API routing. |
| **AI Engine** | **Groq API** | Runs LLaMA 3.3-70b for styling logic. |
| **Vision** | **OpenCV (`cv2`)** | Face detection & dominant color extraction. |
| **Frontend** | **HTML5 / CSS3** | Custom "Midnight Vogue" dark theme. |
| **Scripting** | **Vanilla JS** | Async fetch requests & dynamic DOM manipulation. |

---

## 🚀 Installation & Setup

### 1. Clone the Repository
```bash
git clone [https://github.com/YOUR_USERNAME/StyleAI.git](https://github.com/YOUR_USERNAME/StyleAI.git)
cd StyleAI
```
### 2. Set Up Virtual Environment (Recommended)
```bash
python -m venv venv
# Windows
venv\Scripts\activate
# Mac/Linux
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure API Key
Create a `.env` file in the root directory and add your Groq Cloud API key:
```bash
GROQ_API_KEY=gsk_your_secret_key_here
```
### 5. Run the Application
```bash
python app.py
```
Visit `http://127.0.0.1:5000` in your browser.

### 📂 Project Structure
```plaintext
StyleAI/
├── app.py               # Main Flask Application & Vision Logic
├── .env                 # API Keys (GitIgnored)
├── requirements.txt     # Python Dependencies
├── static/
│   ├── style.css        # Midnight Vogue Theme
│   ├── script.js        # Frontend Logic & API Handling
│   └── temp_upload.jpg  # Temporary storage for analysis
└── templates/
    └── index.html       # Main User Interface
```

*Developed with ❤️ by Team Kanyarashi*