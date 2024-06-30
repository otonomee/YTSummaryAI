document.getElementById('saveButton').addEventListener('click', () => {
  const apiKey = document.getElementById('apiKeyInput').value;
  chrome.storage.local.set({ openai_api_key: apiKey }, () => {
    window.close();
  });
});
