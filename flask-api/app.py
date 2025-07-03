import os
import fitz  # PyMuPDF
import re
import json
from flask import Flask, request, jsonify
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

def extract_text_from_pdf(path):
    doc = fitz.open(path)
    return "\n".join(page.get_text() for page in doc)

def split_by_numbered_sections(text):
    # Regex : ligne qui commence par chiffre + point + espace + titre
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

@app.route('/flask/divide', methods=['POST'])
def divide_pdf():
    if 'file' not in request.files:
        return jsonify({"error": "Aucun fichier PDF n’a été fourni."}), 400

    print("📥 Appel Flask reçu")

    pdf_file = request.files['file']
    filename = pdf_file.filename or "uploaded.pdf"
    temp_dir = "temp"
    os.makedirs(temp_dir, exist_ok=True)
    pdf_path = os.path.join(temp_dir, filename)
    pdf_file.save(pdf_path)

    print("📄 Fichier sauvegardé :", pdf_path)

    try:
        raw_text = extract_text_from_pdf(pdf_path)
        print("🧠 Texte extrait, longueur :", len(raw_text))

        if not raw_text.strip():
            print("⚠️ Le PDF est vide ou illisible")
            return jsonify({"error": "Le PDF est vide ou illisible."}), 400

        print("🔍 Découpage en cours...")
        sections_json = split_by_numbered_sections(raw_text)
        print("📝 Sections générées, nombre :", len(sections_json))

        return jsonify({"sections": sections_json})

    except Exception as e:
        print("🔥 Erreur lors du traitement complet :", str(e))
        return jsonify({"error": f"Erreur lors du traitement : {str(e)}"}), 500

@app.route('/flask/summarize', methods=['POST'])
def section_summary():
    data = request.get_json()
    patient_id = data.get("patientId")
    text = data.get("text")
    print("✅ Reçu pour résumé :", patient_id, text[:100])
    return jsonify({
        "message": f"Résumé simulé pour patient {patient_id} - Longueur texte : {len(text)}"
    })

if __name__ == '__main__':
    app.run(port=5001, debug=True)
