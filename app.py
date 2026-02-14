import os
import cv2
import numpy as np
from flask import Flask, render_template, request, jsonify
from groq import Groq
from dotenv import load_dotenv

# Load API Key
load_dotenv()
GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# Initialize App & AI
app = Flask(__name__)
client = Groq(api_key=GROQ_API_KEY)

# ---------------------------------------------------------
# 1. THE VISION SYSTEM (OpenCV)
# ---------------------------------------------------------
def detect_skin_tone(image_path):
    """
    Analyzes the face in the image to determine skin tone category.
    """
    # Load image
    img = cv2.imread(image_path)
    if img is None:
        return "Unknown"

    # Convert to grayscale for face detection
    gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    
    # Load Face Detector (Using OpenCV's built-in HAAR cascade)
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    faces = face_cascade.detectMultiScale(gray, 1.1, 4)

    # If no face detected, sample the center of the image
    if len(faces) == 0:
        height, width, _ = img.shape
        center_x, center_y = width // 2, height // 2
        # Crop a 100x100 box from center
        face_roi = img[center_y-50:center_y+50, center_x-50:center_x+50]
    else:
        # Take the first detected face
        x, y, w, h = faces[0]
        # Extract Region of Interest (ROI) - Just the face
        face_roi = img[y:y+h, x:x+w]

    # Calculate average color of the face ROI
    avg_color_per_row = np.average(face_roi, axis=0)
    avg_color = np.average(avg_color_per_row, axis=0)
    
    # Convert BGR to RGB (OpenCV uses BGR by default)
    b, g, r = avg_color
    
    # -----------------------------------------------------
    # SIMPLE SKIN TONE CLASSIFICATION LOGIC
    # Based on Euclidean distance to reference colors
    # -----------------------------------------------------
    
    # Reference Colors (RGB)
    tones = {
        "Fair": (255, 224, 189),
        "Medium": (234, 192, 134),
        "Olive": (174, 113, 66),
        "Deep": (89, 57, 59)
    }

    min_dist = float('inf')
    detected_tone = "Medium" # Default

    for tone_name, (tr, tg, tb) in tones.items():
        # Calculate distance: sqrt((r2-r1)^2 + (g2-g1)^2 + (b2-b1)^2)
        dist = np.sqrt((r - tr)**2 + (g - tg)**2 + (b - tb)**2)
        if dist < min_dist:
            min_dist = dist
            detected_tone = tone_name

    return detected_tone

# ---------------------------------------------------------
# 2. THE BRAIN (Groq LLaMA 3.3)
# ---------------------------------------------------------
# Inside app.py

def get_styling_advice(gender, skin_tone):
    """
    Sends data to Groq to get high-end fashion advice.
    """
    prompt = f"""
    Act as a high-end editorial fashion stylist and color theory expert.
    User Profile:
    - Gender: {gender}
    - Skin Tone: {skin_tone}

    CRITICAL STYLING RULES:
    1. BANNED ITEMS: DO NOT suggest boring basics. Absolutely NO plain white shirts, standard blue jeans, basic navy blazers, or plain brown sneakers.
    2. FASHION SENSE: Suggest trend-aware, contemporary silhouettes (e.g., tailored wide-leg trousers, textured knitwear, Cuban collars, monochromatic layering). Mention specific fabrics (linen, silk, tweed, corduroy).
    3. COLOR THEORY: The color palette MUST specifically flatter the '{skin_tone}' skin tone. (e.g., Jewel tones for Olive, rich earth tones for Deep, soft pastels for Fair).

    Provide styling advice in strict JSON format with these keys:
    - "outfit_casual": "A highly specific, stylish casual outfit (mention fabrics, fit, and exact colors)."
    - "outfit_formal": "A highly specific, fashion-forward formal/evening outfit."
    - "colors_to_wear": "List of 3 exact hex codes that perfectly complement the skin tone (e.g., '#0F52BA')."
    - "colors_to_avoid": "List of 2 specific color names that wash out this skin tone (e.g., 'Mustard Yellow'). DO NOT USE HEX CODES HERE."
    - "shopping_list": "A list of 5 specific search terms for these items, including the gender (e.g., 'Rust corduroy overshirt {gender}', 'High-waisted pleated trousers {gender}')."

    Do not include any intro text. Just the JSON.
    """
    
    completion = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7, # Slightly higher temperature for more creativity
        max_tokens=700,
        response_format={"type": "json_object"}
    )

    return completion.choices[0].message.content
# ---------------------------------------------------------
# 3. ROUTES
# ---------------------------------------------------------
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({"error": "No file uploaded"}), 400
    
    file = request.files['file']
    gender = request.form.get('gender', 'Neutral')

    # Save file temporarily
    filepath = os.path.join("static", "temp_upload.jpg")
    file.save(filepath)

    # Step 1: Detect Skin Tone
    detected_skin_tone = detect_skin_tone(filepath)

    # Step 2: Get AI Advice
    ai_advice = get_styling_advice(gender, detected_skin_tone)

    return jsonify({
        "skin_tone": detected_skin_tone,
        "advice": ai_advice
    })

# ADD THIS ROUTE FOR THE CHATBOT
@app.route('/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message')
    gender = data.get('gender', 'Unknown')
    skin_tone = data.get('skin_tone', 'Unknown')

    # The AI Persona
    system_prompt = f"""
    You are 'Aura', an elite high-end fashion styling AI assistant.
    You give concise, trendy, and highly expert fashion advice.
    Current user profile: Gender - {gender}, Skin Tone - {skin_tone}.
    If the profile is unknown, answer generally but suggest they upload a photo for personalized advice.
    Keep responses brief, conversational, and formatted cleanly (no markdown headers, just text).
    """

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.6,
            max_tokens=250 # Keep responses punchy
        )
        return jsonify({"response": completion.choices[0].message.content})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)