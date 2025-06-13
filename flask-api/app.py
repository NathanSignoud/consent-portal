from flask import Flask, request, jsonify
import fitz 
from transformers import pipeline
import re
import os

app = Flask(__name__)

# LLM simple — remplace par ton vrai modèle si nécessaire
llm = pipeline("text2text-generation", model="google/flan-t5-large")

@app.route('/summarize', methods=['GET'])
def summarize():
    patient_id = request.args.get('patientId')
    pdf_name = request.args.get('pdfName')

    if not patient_id or not pdf_name:
        return jsonify({'error': 'Missing patientId or pdfName'}), 400

    summary = f"Résumé généré dynamiquement pour {pdf_name} et patient {patient_id}."
    return jsonify({'summary': summary})

@app.route('/divide', methods=['GET'])
def divide():
    patient_id = request.args.get('patientId')
    pdf_name = request.args.get('pdfName')

    if not patient_id or not pdf_name:
        return jsonify({'error': 'Missing patientId or pdfName'}), 400

    try:
        
    #     pdf_path = os.path.join("uploads", pdf_name)
    #     if not os.path.exists(pdf_path):
    #         return jsonify({'error': f'Fichier {pdf_name} introuvable'}), 404

    #     doc = fitz.open(pdf_path)
    #     full_text = "\n".join([page.get_text() for page in doc])

    #     prompt = (
    #         "Divise ce texte médical en sections avec des titres clairs.\n"
    #         "Utilise le format suivant pour chaque section :\n\n"
    #         "### Titre de la section\nContenu de la section...\n\n"
    #         f"{full_text}"
    #     )

    #     result = llm(prompt, max_length=2048, do_sample=False)[0]['generated_text']

    #     # Regex pour extraire les sections avec titre + contenu
    #     pattern = r"###\s*(.+?)\n(.*?)(?=\n###|\Z)"
    #     matches = re.findall(pattern, result, re.DOTALL)
    
        # structured = [
        #     {"title": title.strip(), "body": body.strip()}
        #     for title, body in matches
        # ]
        
        fake_sections = [
        {
            "title": "Historique Médical",
            "body": "Le patient présente des antécédents d'hypertension artérielle depuis 2015, ainsi qu'une chirurgie du genou droit en 2018. Aucun antécédent familial majeur connu."
        },
        {
            "title": "Symptômes Actuels",
            "body": "Le patient signale une douleur thoracique intermittente, accompagnée de fatigue et de vertiges. Les symptômes ont commencé il y a environ deux semaines."
        },
        {
            "title": "Examens Complémentaires",
            "body": "Les analyses sanguines révèlent un taux élevé de cholestérol. L’ECG montre des signes d’ischémie myocardique. Une échographie cardiaque est prévue."
        },
        {
            "title": "Traitement Recommandé",
            "body": "Mise en place d’un traitement à base de bêta-bloquants, régime alimentaire adapté, et suivi cardiologique mensuel pendant 6 mois."
        }
    ]


        return jsonify({'sections': fake_sections})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5001)
