import openai
import requests
import io
import base64

# Set OpenAI API Key (make sure to keep this secure)
openai.api_key = 'your-openai-api-key-here'  # Replace with your actual OpenAI API key

# Function to generate image from text using OpenAI API (DALL·E)
def generate_image_from_text(text):
    try:
        # Call OpenAI's DALL·E model to generate an image
        response = openai.Image.create(
            prompt=text,
            n=1,
            size="512x512"
        )
        
        # Fetch image URL from response
        image_url = response['data'][0]['url']
        print(f"Generated Image URL: {image_url}")

        # Fetch the image from URL
        img_byte_arr = io.BytesIO(requests.get(image_url).content)

        # Convert image to base64 encoding
        img_base64 = base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')

        print(f"Base64 Encoded Image: {img_base64[:50]}...")  # Print the first 50 characters for verification
        return img_base64

    except Exception as e:
        return str(e)

# Function for text-based guidance (using OpenAI GPT-3.5)
def get_text_guidance(text):
    try:
        # Call OpenAI GPT-3.5 for text-based guidance
        response = openai.Completion.create(
            model="gpt-3.5-turbo",  # Use the new GPT-3.5 model
            prompt=f"Provide suggestions or guidance based on the following input: {text}",
            max_tokens=100
        )
        guidance = response['choices'][0]['text'].strip()
        print(f"Generated Guidance: {guidance}")
        return guidance
    except Exception as e:
        return str(e)

# Main function to run the code via terminal input
if __name__ == '__main__':
    print("Choose an option:")
    print("1. Generate image from text")
    print("2. Get text-based guidance")

    choice = input("Enter your choice (1 or 2): ").strip()

    if choice == '1':
        # Generate image from text
        user_input = input("Enter the text description to generate the image: ")
        img_base64 = generate_image_from_text(user_input)
        print(f"Generated Image (Base64): {img_base64}")

    elif choice == '2':
        # Get text-based guidance
        user_input = input("Enter the text for guidance: ")
        guidance = get_text_guidance(user_input)
        print(f"Generated Guidance: {guidance}")

    else:
        print("Invalid choice. Please choose either 1 or 2.")
