from flask import Flask, render_template, request, redirect, url_for, session, jsonify, send_file
import speech_recognition as sr
from googletrans import Translator
from gtts import gTTS
import os
import time
import sys
import io

# Set console encoding to UTF-8
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

app = Flask(__name__)
app.secret_key = os.urandom(24)  # For session management

# Example user credentials (in real cases, you'd store this securely)
users = {'viishhnu': 'reddy@143'}

# Ensure the 'outputs' folder exists for saving audio files
if not os.path.exists('outputs'):
    os.makedirs('outputs')

# Initialize recognizer and translator
recog1 = sr.Recognizer()
translator = Translator()

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        if username in users and users[username] == password:
            session['user'] = username  # Store user in session
            return redirect(url_for('welcome'))  # Redirect to the welcome page after login
        else:
            return "Invalid credentials, please try again."
    return render_template('login.html')

@app.route('/welcome')
def welcome():
    if 'user' not in session:
        return redirect(url_for('login'))  # Redirect to login if not authenticated
    return render_template('welcome.html')

@app.route('/')
def index():
    if 'user' not in session:
        return redirect(url_for('login'))  # Redirect to login if not authenticated
    return render_template('index.html')

@app.route('/about')
def about():
    if 'user' not in session:
        return redirect(url_for('login'))  # Redirect to login if not authenticated
    return render_template('about.html')

@app.route('/process', methods=['POST'])
def process_audio():
    try:
        # Retrieve the target language from form
        target_language = request.form['language']
        language_map = {
            'Hindi': 'hi', 'Telugu': 'te', 'Kannada': 'kn', 'Tamil': 'ta',
            'Malayalam': 'ml', 'Bengali': 'bn', 'English': 'en', 'French': 'fr'
        }
        if target_language not in language_map:
            return jsonify({'error': f"Invalid language: {target_language}"})

        target_language_code = language_map[target_language]

        # Check if a script is provided
        script_text = request.form.get('script', '')
        if script_text:
            recognized_text = script_text
        else:
            # Save the uploaded file
            audio_file = request.files['audio']
            audio_path = os.path.join('outputs', audio_file.filename)
            audio_file.save(audio_path)

            # Recognize speech from the audio file
            with sr.AudioFile(audio_path) as source:
                recog1.adjust_for_ambient_noise(source)  # Reduce background noise
                audio = recog1.record(source)

            try:
                recognized_text = recog1.recognize_google(audio)
            except sr.RequestError:
                return jsonify({'error': 'Speech Recognition API is unreachable. Check your internet connection.'})
            except sr.UnknownValueError:
                return jsonify({'error': 'Could not understand audio. Please try again.'})

        print(f"Recognized Text: {recognized_text}", flush=True)

        # Detect the language of the recognized text (handling coroutine issue)
        detected_language = translator.detect(recognized_text).lang if recognized_text else 'en'
        print(f"Detected Language: {detected_language}", flush=True)

        # Translate the text with retry logic
        MAX_RETRIES = 3
        for attempt in range(MAX_RETRIES):
            try:
                translation = translator.translate(recognized_text, src=detected_language, dest=target_language_code)
                translated_text = translation.text
                break
            except Exception as e:
                print(f"Translation failed (Attempt {attempt + 1}): {str(e)}", flush=True)
                time.sleep(2)  # Wait before retrying
        else:
            return jsonify({'error': 'Translation service is currently unavailable. Please try again later.'})

        print(f"Translated Text: {translated_text}", flush=True)

        # Convert translated text to audio (speech)
        output_audio_file = f"translated_{target_language}.mp3"
        output_audio_path = os.path.join('outputs', output_audio_file)

        tts = gTTS(text=translated_text, lang=target_language_code, slow=False)
        tts.save(output_audio_path)

        return jsonify({
            'recognized_text': recognized_text,
            'translated_text': translated_text,
            'audio_file': output_audio_file,
        })
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/process_voice', methods=['POST'])
def process_voice():
    try:
        recognized_text = request.form['recognized_text']
        target_language = request.form['language']

        language_map = {
            'Hindi': 'hi', 'Telugu': 'te', 'Kannada': 'kn', 'Tamil': 'ta',
            'Malayalam': 'ml', 'Bengali': 'bn', 'English': 'en'
        }

        if target_language not in language_map:
            return jsonify({'error': f"Invalid language: {target_language}"})

        target_language_code = language_map[target_language]

        # Detect the language of the recognized text
        detected_language = translator.detect(recognized_text).lang if recognized_text else 'en'
        print(f"Detected Language: {detected_language}", flush=True)

        # Translate the text with retry logic
        MAX_RETRIES = 3
        for attempt in range(MAX_RETRIES):
            try:
                translation = translator.translate(recognized_text, src=detected_language, dest=target_language_code)
                translated_text = translation.text
                break
            except Exception as e:
                print(f"Translation failed (Attempt {attempt + 1}): {str(e)}", flush=True)
                time.sleep(2)
        else:
            return jsonify({'error': 'Translation service is currently unavailable. Please try again later.'})

        print(f"Translated Text: {translated_text}", flush=True)

        # Convert translated text to audio
        output_audio_file = f"translated_voice_{target_language}.mp3"
        output_audio_path = os.path.join('outputs', output_audio_file)

        tts = gTTS(text=translated_text, lang=target_language_code, slow=False)
        tts.save(output_audio_path)

        return jsonify({
            'translated_text': translated_text,
            'recognized_text': recognized_text,
            'audio_file': output_audio_file,
        })
    except Exception as e:
        return jsonify({'error': str(e)})

@app.route('/outputs/<path:filename>')
def get_audio_file(filename):
    filepath = os.path.join('outputs', filename)
    if os.path.exists(filepath):
        return send_file(filepath, mimetype="audio/mpeg")
    else:
        return jsonify({'error': 'File not found'}), 404

if __name__ == '__main__':
    # Ensure the environment is set to UTF-8
    os.environ['PYTHONIOENCODING'] = 'utf-8'
    app.run(debug=True)
