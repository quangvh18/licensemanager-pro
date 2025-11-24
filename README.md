<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/1SrPoBVf-zm4zkS9Vbo_u4ufhUmXz7a6e

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure Supabase credentials (required):
   Create a `.env` file in the project root with:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```
   
   You can find these credentials in your Supabase project settings: https://app.supabase.com/project/_/settings/api

3. Run the app:
   ```bash
   npm run dev
   ```

## Alternative Configuration Methods

If you don't want to use a `.env` file, you can also configure Supabase credentials via:
- **URL Parameters**: `?sb_url=YOUR_URL&sb_key=YOUR_ANON_KEY`
- **Local Storage**: Credentials will be saved automatically after first connection via URL parameters
