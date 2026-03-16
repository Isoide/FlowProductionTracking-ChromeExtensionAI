/* global LanguageModel */

const inputFeedback = document.body.querySelector('#input-feedback');
const buttonConvert = document.body.querySelector('#button-convert');
const statusElement = document.body.querySelector('#status');

const SYSTEM_PROMPT = `You are a VFX feedback organizer. Transform messy supervisor comments into clean, modular, artist-facing review notes.

Rules:

Preserve intent.

Do not invent major feedback.

Organize chaotic notes into clear sections.

Separate implemented changes from pending work.

Keep a professional VFX production tone.

Use the same language as the input.

Normalize grammar, punctuation, and readability.

Keep ambiguity if present, but phrase it clearly.

Output only the cleaned feedback.

Preferred structure:

WIP

Context

Implemented in this version

Still to address

Priority focus

General notes

Guidelines:

Put completed changes under “Implemented in this version”.

Put pending work under “Still to address”.

Group notes when useful into categories like cleanup, atmosphere, integration, animation, environment, crowd/life, and technical fixes.

Keep it concise and actionable.

No greetings, no explanations, no meta commentary.`;

let session;

inputFeedback.addEventListener('input', () => {
  if (inputFeedback.value.trim()) {
    buttonConvert.removeAttribute('disabled');
  } else {
    buttonConvert.setAttribute('disabled', '');
  }
});

buttonConvert.addEventListener('click', async () => {
  const feedback = inputFeedback.value.trim();
  if (!feedback) {
    showStatus('Please add feedback text first.');
    return;
  }

  buttonConvert.setAttribute('disabled', '');
  showStatus('Reformatting feedback with local Gemini Nano...');

  try {
    const cleaned = await convertFeedback(feedback);
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab?.id) {
      throw new Error('No active tab found.');
    }

    const applied = await chrome.tabs.sendMessage(tab.id, {
      action: 'applyFlowCommentText',
      text: cleaned.trim()
    });

    if (!applied?.ok) {
      throw new Error(applied?.error || 'Could not update the Flow comment field.');
    }

    showStatus('Done. Cleaned feedback was inserted into the active Flow comment field.');
  } catch (error) {
    showStatus(`Convert failed: ${error.message || error}`);
  } finally {
    if (inputFeedback.value.trim()) {
      buttonConvert.removeAttribute('disabled');
    }
  }
});

async function convertFeedback(rawFeedback) {
  const prompt = ['Feedback to clean:', rawFeedback, '', 'Output only the cleaned feedback.'].join('\n');
  const model = await getSession();
  return model.prompt(prompt);
}

async function getSession() {
  if (!('LanguageModel' in self)) {
    throw new Error('LanguageModel is not available in this Chrome build.');
  }

  if (!session) {
    session = await LanguageModel.create({
      initialPrompts: [{ role: 'system', content: SYSTEM_PROMPT }]
    });
  }

  return session;
}

function showStatus(message) {
  statusElement.textContent = message;
  statusElement.removeAttribute('hidden');
}
