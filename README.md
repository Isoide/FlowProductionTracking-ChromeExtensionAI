# On-device AI with Gemini Nano + Flow feedback organizer demo

This extension demonstrates Chrome's built-in Prompt API with Gemini Nano and includes a demo workflow for cleaning supervisor feedback and inserting it into a writable Autodesk Flow Production Tracking (ShotGrid) comment field.

## What the demo does

- Lets you paste raw supervisor feedback in the side panel.
- Uses a hidden system prompt to reorganize text into production-ready VFX review notes.
- Detects and writes into a writable Flow comment field (for example: `textarea.sg_reset_textarea.sg_input` with placeholder `Submit a new note or annotation...`).

## Running this extension

1. Clone this repository.
2. Run `npm install` in the project directory.
3. Run `npm run build` in the project directory.
4. Load the generated `dist` directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked).
5. Open a Flow page with a writable comment box.
6. Open the extension side panel.
7. Paste feedback text and click **Convert and fill active comment**.

## Notes

- This is a sample/demo implementation.
- The model runs locally through Chrome's Prompt API support for Gemini Nano.
