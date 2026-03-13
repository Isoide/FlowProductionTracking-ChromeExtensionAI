# On-device AI with Gemini Nano + Flow comment rewrite demo

This extension demonstrates Chrome's built-in Prompt API with Gemini Nano and includes a demo workflow for rewriting a comment directly inside Autodesk Flow Production Tracking (ShotGrid).

## What the demo does

- Detects a writable comment textarea on the active Flow page (including elements like: `textarea.sg_reset_textarea.sg_input` with placeholder `Submit a new note or annotation...`).
- Reads the current comment text.
- Sends it to local Gemini Nano with your rewrite instruction.
- Writes the rewritten result back into the same comment field.

## Running this extension

1. Clone this repository.
2. Run `npm install` in the project directory.
3. Run `npm run build` in the project directory to build the extension.
4. Load the newly created `dist` directory in Chrome as an [unpacked extension](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked).
5. Open a Flow Production Tracking page with a writable comment box.
6. Click the extension icon to open the side panel.
7. Add or keep a rewrite instruction and click **Rewrite active comment**.

## Notes

- This is a sample/demo implementation to validate end-to-end behavior.
- The model runs locally through Chrome's Prompt API support for Gemini Nano.
