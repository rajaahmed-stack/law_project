# import os
# import google.generativeai as genai
# import mysql.connector
# from flask import Flask, request, jsonify
# from flask_cors import CORS

# # Initialize Flask app
# app = Flask(__name__)
# CORS(app, resources={r"/*": {"origins": "https://mmcmadina.com/lawproject/"}})

# # Configure API key and check if it's loaded correctly
# api_key = os.getenv('GOOGLE_API_KEY')
# if not api_key:
#     print("API Key not found. Please set the GOOGLE_API_KEY environment variable.")
# else:
#     print("API Key successfully loaded.")

# genai.configure(api_key=api_key)

# @app.route('/')
# def index():
#     return "Welcome to the Gemini API with Imagen support!"
# db_config = {
#     'host': 'switchback.proxy.rlwy.net',
#     'user': 'root',
#     'password': 'jQzrIcHDSWWTnpQcsvPQGqoMYVWQHkrF',
#     'database': 'railway',
#     'port': 50403
# }

# # Function to fetch all legal cases or specific ones
# def get_case_data(case_num=None):
#     conn = mysql.connector.connect(**db_config)
#     cursor = conn.cursor(dictionary=True)

#     if case_num:
#         cursor.execute("SELECT * FROM LegalCases WHERE case_num = %s", (case_num,))
#     else:
#         cursor.execute("SELECT * FROM LegalCases ORDER BY create_at DESC LIMIT 10")

#     result = cursor.fetchall()
#     cursor.close()
#     conn.close()
#     return result

# # 🔍 Ask AI About Legal Cases
# @app.route('/ask_case_ai', methods=['POST'])
# def ask_case_ai():
#     try:
#         data = request.get_json()
#         query = data.get("question", "")
#         case_num = data.get("case_num", None)

#         cases = get_case_data(case_num)
#         if not cases:
#             return jsonify({'generated_text': f'⚠️ No case found with number {case_num}.'})


#         case_text = "\n\n".join([f"""
# 📁 Case #{c['case_num']} - {c['case_title']}
# - Court: {c['court']}
# - Judge: {c['current_judge']}
# - Nature: {c['nature_of_case']}
# - Status: {c['stage_and_status']}
# - Client: {c['client_name']} ({c['client_cnic']})
# - Description: {c['file_description']}
# """ for c in cases])

#         prompt = f"""You're a legal assistant. Based on the following case(s), answer this user query:
# User Query: "{query}"

# CASE DETAILS:
# {case_text}

# Respond in formal, structured legal format.
# """

#         model = genai.GenerativeModel("gemini-1.5-flash")
#         response = model.generate_content(prompt)

#         return jsonify({'generated_text': response.text})

#     except Exception as e:
#         return jsonify({'error': str(e)}), 500

# @app.route('/')
# def home():
#     return 'Legal AI Backend is running.'
# # Generate text using Gemini API
# @app.route('/generate_text', methods=['POST'])
# def generate_text():
#     try:
#         data = request.get_json()
#         if not data or 'text' not in data:
#             return jsonify({'error': 'Invalid input'}), 400

#         text_prompt = data['text']
#         print(f"Generating text for: {text_prompt}")

#         model = genai.GenerativeModel("gemini-1.5-flash")
#         response = model.generate_content(text_prompt)

#         return jsonify({'generated_text': response.text})

#     except Exception as e:
#         print(f"Error during text generation: {str(e)}")
#         return jsonify({'error': str(e)}), 500

# # Generate image using available model
# @app.route('/generate_image', methods=['POST'])
# def generate_image():
#     try:
#         data = request.get_json()
#         if not data or 'prompt' not in data:
#             return jsonify({'error': 'Invalid input'}), 400

#         prompt = data['prompt']
#         print(f"Generating image for: {prompt}")

#         # Debug: Check available models in the library
#         available_models = list(genai.list_models())  # Convert generator to list
#         print("Available models:", available_models)

#         # Check if any of the available models can generate images
#         image_model = "imagen-3.0"  # Example: Replace with an available model name capable of image generation
#         print(f"Using hardcoded image model: {image_model}")

#         # Use the model to generate the image
#         model_instance = genai.GenerativeModel(image_model)
#         response = model_instance.generate_images(prompt=prompt, num_images=1)

#         # Debug: Print response
#         print("Image generation response:", response)

#         if response and hasattr(response, 'images') and len(response.images) > 0:
#             return jsonify({'image_url': response.images[0].url})
#         else:
#             print("No images found in the response.")
#             return jsonify({'error': 'Image generation failed, no images found'}), 500

#     except Exception as e:
#         print(f"Error during image generation: {str(e)}")
#         return jsonify({'error': str(e)}), 500
    
# @app.route('/health', methods=['GET'])
# def health():
#     return jsonify({"status": "ok"})

# if __name__ == '__main__':
#     app.run(host='0.0.0.0', port=int(os.environ.get("PORT", 5000)), debug=True)





# # MySQL Database Config
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
import google.generativeai as genai
import mysql.connector

# === Flask Setup ===
app = Flask(__name__)
CORS(app)

# === Google AI Key ===
api_key = os.getenv('GOOGLE_API_KEY')
if not api_key:
    print("❌ GOOGLE_API_KEY not set!")
else:
    print("✅ GOOGLE_API_KEY loaded.")
    genai.configure(api_key=api_key)
    
@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({"status": "ok"})

# === MySQL Config ===
db_config = {
    'host': 'switchback.proxy.rlwy.net',
    'user': 'root',
    'password': 'jQzrIcHDSWWTnpQcsvPQGqoMYVWQHkrF',
    'database': 'railway',
    'port': 50403
}



@app.route('/ask_case_ai', methods=['POST'])
def ask_case_ai():
    try:
        data = request.get_json()
        query = data.get("question", "")
        case_num = data.get("case_num")

        # Fetch case
        conn = mysql.connector.connect(**db_config)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM LegalCases WHERE case_num = %s", (case_num,))
        cases = cursor.fetchall()
        cursor.close()
        conn.close()

        if not cases:
            return jsonify({'generated_text': f'⚠️ No case found with number {case_num}.'})

        case = cases[0]
        prompt = f"""You're a legal assistant. Summarize this case:

📁 Case #{case['case_num']} - {case['case_title']}
Court: {case['court']}
Judge: {case['current_judge']}
Client: {case['client_name']}
Status: {case['stage_and_status']}

Query: {query}
"""

        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(prompt)

        return jsonify({'generated_text': response.text})

    except Exception as e:
        return jsonify({'error': str(e)}), 500

# === Use the dynamic PORT ===
if __name__ == '__main__':
    port = int(os.environ.get("PORT", 5000))
    app.run(host='0.0.0.0', port=port, debug=True)
