<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/61b9506e-beb0-4ce3-b498-323ec5f134fd

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```
2. Create a `.env` file from the provided template and add your Gemini API key:
   ```bash
   cp .env.example .env
   ```
   Then open `.env` and replace `your_gemini_api_key_here` with your actual key.
   You can get a free API key at https://aistudio.google.com/app/apikey.

   > **Note:** `.env` is listed in `.gitignore` — it will **never** be committed to the repository. Keep your key secret.
3. Run the app:
   ```bash
   npm run dev
   ```
4. Open http://localhost:3000 in your browser.
