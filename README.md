# FindIt — Campus Lost & Found

React + Vite prototype with Google Gemini image recognition.

## AI recognition setup

The app keeps the Gemini API key on the Node server. Do **not** put the key in `VITE_*` variables or directly in `main.jsx`, because those values are exposed to the browser.

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file in the project root:

```env
GEMINI_API_KEY=YOUR_GOOGLE_AI_STUDIO_KEY
```

3. Start the AI server:

```bash
npm run api
```

4. In another terminal, start the React app:

```bash
npm run dev
```

Open the Vite URL shown in the terminal.

### Using AI recognition

1. Go to **Report an item**.
2. Upload a JPG/PNG photo.
3. Click **Recognize with AI**.
4. Gemini analyzes the image and suggests the item name, category, and visible identifying details.
5. Review the generated fields and publish the listing.

The recognition endpoint uses Gemini's multimodal image understanding with `gemini-3.8-flash`.
