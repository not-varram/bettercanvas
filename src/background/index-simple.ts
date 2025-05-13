import { storageService } from '../utils/storage';

console.log('Better Canvas background script loaded');

// Initialize when the extension is installed or updated
chrome.runtime.onInstalled.addListener(async () => {
  console.log('Better Canvas extension installed/updated');
  
  // Initialize storage with default options
  await storageService.initialize();
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'getOptions') {
    storageService.getOptions()
      .then(options => {
        sendResponse({ options });
      })
      .catch(error => {
        console.error('Error getting options:', error);
        sendResponse({ error: error.message });
      });
    return true; // Indicate async response
  }
  
  if (request.type === 'saveOption') {
    const { area, key, value } = request;
    
    if (area === 'local') {
      storageService.saveLocalOption(key, value)
        .then(() => sendResponse({ success: true }))
        .catch(error => {
          console.error(`Error saving ${key} to ${area}:`, error);
          sendResponse({ error: error.message });
        });
    } else {
      storageService.saveSyncOption(key, value)
        .then(() => sendResponse({ success: true }))
        .catch(error => {
          console.error(`Error saving ${key} to ${area}:`, error);
          sendResponse({ error: error.message });
        });
    }
    return true; // Indicate async response
  }
  
  return false;
});
