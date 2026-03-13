function isElementWritable(element) {
  if (!element) return false;
  if (element.matches('textarea, input')) {
    return !element.disabled && !element.readOnly;
  }
  if (element.isContentEditable) {
    return element.getAttribute('contenteditable') !== 'false';
  }
  return false;
}

function isElementVisible(element) {
  if (!element) return false;
  const style = window.getComputedStyle(element);
  const rect = element.getBoundingClientRect();
  return (
    style.visibility !== 'hidden' &&
    style.display !== 'none' &&
    rect.width > 0 &&
    rect.height > 0
  );
}

function findWritableCommentField() {
  const selectors = [
    'textarea.sg_reset_textarea.sg_input[placeholder*="Submit a new note or annotation"]',
    'textarea[placeholder*="Submit a new note or annotation"]',
    'textarea.sg_input',
    'textarea[placeholder*="note"]',
    'textarea[placeholder*="annotation"]',
    '[contenteditable="true"]'
  ];

  for (const selector of selectors) {
    const candidate = document.querySelector(selector);
    if (isElementWritable(candidate) && isElementVisible(candidate)) {
      return candidate;
    }
  }

  const allWritable = Array.from(
    document.querySelectorAll('textarea, input[type="text"], [contenteditable="true"]')
  );

  return allWritable.find((element) => isElementWritable(element) && isElementVisible(element)) || null;
}

function readFieldText(field) {
  if (field.matches('textarea, input')) {
    return field.value || '';
  }
  return field.textContent || '';
}

function writeFieldText(field, text) {
  field.focus();
  if (field.matches('textarea, input')) {
    field.value = text;
  } else {
    field.textContent = text;
  }
  field.dispatchEvent(new Event('input', { bubbles: true }));
  field.dispatchEvent(new Event('change', { bubbles: true }));
}

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.action === 'extractFlowCommentField') {
    const field = findWritableCommentField();
    if (!field) {
      sendResponse({ ok: false, error: 'No writable comment field found on this page.' });
      return;
    }

    sendResponse({
      ok: true,
      originalText: readFieldText(field),
      selectorHint: field.id ? `#${field.id}` : field.tagName.toLowerCase()
    });
    return;
  }

  if (message?.action === 'applyFlowCommentText') {
    const field = findWritableCommentField();
    if (!field) {
      sendResponse({ ok: false, error: 'Could not find the comment field to update.' });
      return;
    }

    writeFieldText(field, message.text || '');
    sendResponse({ ok: true });
  }
});
