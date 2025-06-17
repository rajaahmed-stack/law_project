import os
import google.generativeai as genai
from flask import Flask, request, jsonify
from flask_cors import CORS

# Initialize Flask app
app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "http://localhost:3000"}})

# Configure API key and check if it's loaded correctly
api_key = os.getenv('GOOGLE_API_KEY')
if not api_key:
    print("API Key not found. Please set the GOOGLE_API_KEY environment variable.")
else:
    print("API Key successfully loaded.")

genai.configure(api_key=api_key)

@app.route('/')
def index():
    return "Welcome to the Gemini API with Imagen support!"

# Generate text using Gemini API
@app.route('/generate_text', methods=['POST'])
def generate_text():
    try:
        data = request.get_json()
        if not data or 'text' not in data:
            return jsonify({'error': 'Invalid input'}), 400

        text_prompt = data['text']
        print(f"Generating text for: {text_prompt}")

        model = genai.GenerativeModel("gemini-1.5-flash")
        response = model.generate_content(text_prompt)

        return jsonify({'generated_text': response.text})

    except Exception as e:
        print(f"Error during text generation: {str(e)}")
        return jsonify({'error': str(e)}), 500

# Generate image using available model
@app.route('/generate_image', methods=['POST'])
def generate_image():
    try:
        data = request.get_json()
        if not data or 'prompt' not in data:
            return jsonify({'error': 'Invalid input'}), 400

        prompt = data['prompt']
        print(f"Generating image for: {prompt}")

        # Debug: Check available models in the library
        available_models = list(genai.list_models())  # Convert generator to list
        print("Available models:", available_models)

        # Check if any of the available models can generate images
        image_model = "imagen-3.0"  # Example: Replace with an available model name capable of image generation
        print(f"Using hardcoded image model: {image_model}")

        # Use the model to generate the image
        model_instance = genai.GenerativeModel(image_model)
        response = model_instance.generate_images(prompt=prompt, num_images=1)

        # Debug: Print response
        print("Image generation response:", response)

        if response and hasattr(response, 'images') and len(response.images) > 0:
            return jsonify({'image_url': response.images[0].url})
        else:
            print("No images found in the response.")
            return jsonify({'error': 'Image generation failed, no images found'}), 500

    except Exception as e:
        print(f"Error during image generation: {str(e)}")
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True)
