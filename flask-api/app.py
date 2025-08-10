import os
import fitz  # PyMuPDF
import re
from flask import Flask, request, jsonify
from flask_cors import CORS
import requests

# URL de l'API Colab
COLAB_URL = "https://2779747739b0.ngrok-free.app/"

app = Flask(__name__)
CORS(app)

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

@app.route('/flask/divide/<filename>/<language>')
def divide_pdf(filename, language):
    print(f"Dividing PDF: {filename} for language: {language}")
    pdf_path = os.path.join("temp", filename)
    if not os.path.exists(pdf_path):
        return jsonify({"error": "Fichier introuvable"}), 404

    try:
        # Étape 1 – Lecture du PDF
        print("Étape 1 – Extraction du texte du PDF...")
        raw_text = extract_text_from_pdf(pdf_path)
        print("Texte extrait du PDF")
        if not raw_text.strip():
            return jsonify({"error": "PDF vide ou illisible"}), 400

        # Étape 2 – Découpage en sections
        print("Étape 2 – Découpage du texte en sections...")
        sections_json = split_by_numbered_sections(raw_text)
        print(f"{len(sections_json)} sections trouvées")

        # Étape 3 – Envoi du JSON complet à l’API Flask Colab pour traduction
        print("Étape 3 – Envoi des sections à l’API Colab pour traduction...")
        response = requests.post(f"{COLAB_URL}flask/translate", json={
            "sections": sections_json,
            "language": language
        })

        print(f"Réponse de l’API Colab reçue: {response.text}")

        if response.status_code != 200:
            return jsonify({
                "error": "Erreur lors de la traduction",
                "details": response.text
            }), 500

        print("Traduction réussie")
        # Étape 4 – Retour des sections traduites
        translated_sections = response.json().get("translated", [])
        return jsonify({"sections": translated_sections})

    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route('/flask/summarize', methods=['POST'])
def summarize_proxy():
    print(" Appel vers l’API Colab pour la synthèse...")
    data = request.get_json()
    try:
        res = requests.post(f"{COLAB_URL}flask/summarize", json=data)
        res.raise_for_status()
        print("Réponse reçue de Colab pour la synthèse")
        print("Réponse :", res.json())
        return jsonify(res.json())
    except requests.RequestException as e:
        return jsonify({"error": str(e)}), 500
    
@app.route("/api/test-cors", methods=["GET"])
def test_cors_local():
    try:
        print("➡️ Appel vers l’API Colab...")
        res = requests.get(f"{COLAB_URL}test-cors")
        res.raise_for_status()
        print("Réponse reçue de Colab")
        print("Réponse :", res.json())
        return jsonify(res.json())
    except Exception as e:
        print("Erreur :", e)
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(port=5001, debug=True)
