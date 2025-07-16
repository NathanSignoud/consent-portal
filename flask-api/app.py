import os
import fitz  # PyMuPDF
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

# URL de l'API Colab
COLAB_URL = "https://cab6b327d834.ngrok-free.app"

app = Flask(__name__)
CORS(app)  # Pour autoriser les appels depuis React (localhost:5173)

TEMP_DIR = "temp"
os.makedirs(TEMP_DIR, exist_ok=True)

def extract_text_from_pdf(path):
    doc = fitz.open(path)
    return "\n".join(page.get_text() for page in doc)

def split_by_numbered_sections(text):
    # Ligne qui commence par chiffre + point + espace
    pattern = r'(^|\n)(\d{1,2})\.\s+([^\n]+)'
    matches = list(re.finditer(pattern, text))

    sections = []
    for i, match in enumerate(matches):
        title = match.group(3).strip()
        start = match.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(text)
        body = text[start:end].strip()
        sections.append({
            "title": f"{match.group(2)}. {title}",
            "body": body
        })

    return sections

@app.route('/flask/divide/<filename>')
def divide_pdf(filename):
    pdf_path = os.path.join("temp", filename)
    if not os.path.exists(pdf_path):
        return jsonify({"error": "Fichier introuvable"}), 404

    try:
        raw_text = extract_text_from_pdf(pdf_path)
        if not raw_text.strip():
            return jsonify({"error": "PDF vide ou illisible"}), 400

        sections_json = split_by_numbered_sections(raw_text)
        return jsonify({"sections": sections_json})
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/flask/summarize', methods=['POST'])
def summarize_proxy():
    data = request.get_json()
    try:
        res = requests.post(f"{COLAB_URL}/flask/summarize", json=data)
        res.raise_for_status()
        return jsonify(res.json())
    except requests.RequestException as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/api/test-cors", methods=["GET"])
def test_cors_local():
    try:
        print("➡️ Appel vers l’API Colab...")
        res = requests.get(f"{COLAB_URL}/test-cors")
        res.raise_for_status()
        print("Réponse reçue de Colab")
        return jsonify(res.json())
    except Exception as e:
        print("Erreur :", e)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)
