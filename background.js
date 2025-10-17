let isRecording = false;
let recordingTabId = null;
let recordingUrl = null;

// Listen for messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'getStatus') {
    sendResponse({ isRecording, recordingUrl });
    return true;
  }
  
  if (request.action === 'startRecording') {
    startRecording(request.tabId)
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
  
  if (request.action === 'stopRecording') {
    stopRecording()
      .then(() => sendResponse({ success: true }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

async function startRecording(tabId) {
  try {
    if (isRecording) {
      throw new Error('Recording is already in progress');
    }
    
    recordingTabId = tabId;
    recordingUrl = null;
    
    // Get tab dimensions
    const tab = await chrome.tabs.get(tabId);
    
    // Execute script to get viewport dimensions with DPR
    const [result] = await chrome.scripting.executeScript({
      target: { tabId: tabId },
      func: () => {
        const dpr = window.devicePixelRatio || 1;
        return {
          width: window.innerWidth,
          height: window.innerHeight,
          dpr: dpr,
          physicalWidth: Math.round(window.innerWidth * dpr),
          physicalHeight: Math.round(window.innerHeight * dpr)
        };
      }
    });
    
    const dimensions = result.result;
    console.log('Tab viewport dimensions:', dimensions);
    
    // Get stream ID using tabCapture
    const streamId = await chrome.tabCapture.getMediaStreamId({
      targetTabId: tabId
    });
    
    console.log('Stream ID obtained:', streamId);
    
    // Create offscreen document if it doesn't exist
    const existingContexts = await chrome.runtime.getContexts({
      contextTypes: ['OFFSCREEN_DOCUMENT']
    });
    
    if (existingContexts.length === 0) {
      await chrome.offscreen.createDocument({
        url: 'offscreen.html',
        reasons: ['USER_MEDIA'],
        justification: 'Recording screen'
      });
      
      // Wait for offscreen document to initialize
      await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('Offscreen document ready');
    
    // Send message to offscreen document to start recording with dimensions
    await chrome.runtime.sendMessage({
      type: 'start-recording',
      target: 'offscreen',
      data: {
        streamId: streamId,
        dimensions: dimensions
      }
    });
    
    isRecording = true;
    
  } catch (error) {
    console.error('Error starting recording:', error);
    isRecording = false;
    recordingTabId = null;
    throw error;
  }
}

async function stopRecording() {
  if (!isRecording) {
    throw new Error('No recording in progress');
  }
  
  // Send message to offscreen document to stop recording
  await chrome.runtime.sendMessage({
    type: 'stop-recording',
    target: 'offscreen'
  });
  
  return true;
}

// Listen for messages from offscreen document
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target !== 'background') {
    return;
  }
  
  if (message.type === 'recording-stopped') {
    isRecording = false;
    recordingTabId = null;
  }
  
  if (message.type === 'download-recording') {
    // Store the recording URL
    recordingUrl = message.data;
    
    console.log('Background received download-recording, URL:', recordingUrl);
    
    isRecording = false;
    recordingTabId = null;
    
    // Notify popup that recording is complete
    chrome.runtime.sendMessage({
      action: 'recordingComplete',
      url: recordingUrl
    }).catch((error) => {
      // Popup might be closed, that's okay
      console.log('Recording complete, URL stored. Could not notify popup:', error);
    });
    
    sendResponse({ success: true });
    return true;
  }
});
