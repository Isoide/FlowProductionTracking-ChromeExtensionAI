/* global LanguageModel */

import DOMPurify from 'dompurify';
import { marked } from 'marked';

const inputPrompt = document.body.querySelector('#input-prompt');
const buttonPrompt = document.body.querySelector('#button-prompt');
const buttonReset = document.body.querySelector('#button-reset');
const elementResponse = document.body.querySelector('#response');
const elementLoading = document.body.querySelector('#loading');
const elementError = document.body.querySelector('#error');
const sliderTemperature = document.body.querySelector('#temperature');
const sliderTopK = document.body.querySelector('#top-k');
const labelTemperature = document.body.querySelector('#label-temperature');
const labelTopK = document.body.querySelector('#label-top-k');

const rewriteInstruction = document.body.querySelector('#rewrite-instruction');
const buttonRewrite = document.body.querySelector('#button-rewrite');
const statusElement = document.body.querySelector('#status');

let session;

async function runPrompt(prompt, params) {
  try {
    if (!session) {
      session = await LanguageModel.create(params);
    }
    return session.prompt(prompt);
  } catch (e) {
    console.log('Prompt failed');
    console.error(e);
    console.log('Prompt:', prompt);
    reset();
    throw e;
  }
}

async function reset() {
  if (session) {
    session.destroy();
  }
  session = null;
}

async function initDefaults() {
  const defaults = await LanguageModel.params();
  console.log('Model default:', defaults);
  if (!('LanguageModel' in self)) {
    showResponse('Model not available');
    return;
  }
  sliderTemperature.value = defaults.defaultTemperature;
  if (defaults.defaultTopK > 3) {
    sliderTopK.value = 3;
    labelTopK.textContent = 3;
  } else {
    sliderTopK.value = defaults.defaultTopK;
    labelTopK.textContent = defaults.defaultTopK;
  }
  sliderTopK.max = defaults.maxTopK;
  labelTemperature.textContent = defaults.defaultTemperature;
}

initDefaults();

buttonReset.addEventListener('click', () => {
  hide(elementLoading);
  hide(elementError);
  hide(elementResponse);
  reset();
  buttonReset.setAttribute('disabled', '');
});

sliderTemperature.addEventListener('input', (event) => {
  labelTemperature.textContent = event.target.value;
  reset();
});

sliderTopK.addEventListener('input', (event) => {
  labelTopK.textContent = event.target.value;
  reset();
});

inputPrompt.addEventListener('input', () => {
  if (inputPrompt.value.trim()) {
    buttonPrompt.removeAttribute('disabled');
  } else {
    buttonPrompt.setAttribute('disabled', '');
  }
});

buttonPrompt.addEventListener('click', async () => {
  const prompt = inputPrompt.value.trim();
  showLoading();
  try {
    const params = {
      initialPrompts: [
        { role: 'system', content: 'You are a helpful and friendly assistant.' }
      ],
      temperature: sliderTemperature.value,
      topK: sliderTopK.value
    };
    const response = await runPrompt(prompt, params);
    showResponse(response);
  } catch (e) {
    showError(e);
  }
});

buttonRewrite.addEventListener('click', async () => {
  showStatus('Detecting comment field on active Flow page...');
  buttonRewrite.setAttribute('disabled', '');

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.id) {
      throw new Error('No active tab found.');
    }

    const extracted = await chrome.tabs.sendMessage(tab.id, {
      action: 'extractFlowCommentField'
    });

    if (!extracted?.ok) {
      throw new Error(extracted?.error || 'Could not read comment field.');
    }

    const sourceText = extracted.originalText?.trim();
    if (!sourceText) {
      throw new Error('The detected comment field is empty. Add text first, then rewrite.');
    }

    showStatus('Rewriting comment with local Gemini Nano...');

    const params = {
      initialPrompts: [
        {
          role: 'system',
          content:
            'You rewrite comments for Flow Production Tracking. Keep the same meaning and key details. Return only rewritten text with no explanation.'
        }
      ],
      temperature: sliderTemperature.value,
      topK: sliderTopK.value
    };

    const prompt = [
      `Instruction: ${rewriteInstruction.value.trim() || 'Make it clear and professional.'}`,
      'Original comment:',
      sourceText,
      '',
      'Return only the rewritten comment.'
    ].join('\n');

    const rewritten = await runPrompt(prompt, params);

    const applied = await chrome.tabs.sendMessage(tab.id, {
      action: 'applyFlowCommentText',
      text: rewritten.trim()
    });

    if (!applied?.ok) {
      throw new Error(applied?.error || 'Failed to write updated comment.');
    }

    showStatus('Done. The comment was rewritten and inserted into the detected field.');
  } catch (error) {
    showStatus(`Rewrite failed: ${error.message || error}`);
  } finally {
    buttonRewrite.removeAttribute('disabled');
  }
});

function showLoading() {
  buttonReset.removeAttribute('disabled');
  hide(elementResponse);
  hide(elementError);
  show(elementLoading);
}

function showResponse(response) {
  hide(elementLoading);
  show(elementResponse);
  elementResponse.innerHTML = DOMPurify.sanitize(marked.parse(response));
}

function showError(error) {
  show(elementError);
  hide(elementResponse);
  hide(elementLoading);
  elementError.textContent = error;
}

function showStatus(message) {
  statusElement.textContent = message;
  show(statusElement);
}

function show(element) {
  element.removeAttribute('hidden');
}

function hide(element) {
  element.setAttribute('hidden', '');
}
