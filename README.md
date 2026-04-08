<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/61b9506e-beb0-4ce3-b498-323ec5f134fd

## Notes

Filenames in this repository have been normalised for Windows compatibility: colons (`:`) in timestamp-based filenames inside `migrated_prompt_history/` have been replaced with hyphens (`-`) so that `git clone` succeeds on Windows without checkout errors.

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`
