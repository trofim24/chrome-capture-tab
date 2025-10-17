const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const downloadBtn = document.getElementById('downloadBtn');
const statusIdle = document.getElementById('statusIdle');
const statusRecording = document.getElementById('statusRecording');

let recordingUrl = null;

// Check recording status on popup open
chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
  console.log('Status response:', response);
  if (response && response.isRecording) {
    updateUI(true);
  } else if (response && response.recordingUrl) {
    console.log('Showing download button with URL:', response.recordingUrl);
    showDownloadButton(response.recordingUrl);
  }
});

startBtn.addEventListener('click', async () => {
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Request recording to start
    chrome.runtime.sendMessage({ 
      action: 'startRecording',
      tabId: tab.id 
    }, (response) => {
      if (response && response.success) {
        updateUI(true);
      } else {
        alert('Failed to start recording: ' + (response?.error || 'Unknown error'));
      }
    });
  } catch (error) {
    console.error('Error starting recording:', error);
    alert('Error starting recording: ' + error.message);
  }
});

stopBtn.addEventListener('click', () => {
  chrome.runtime.sendMessage({ action: 'stopRecording' }, (response) => {
    if (response && response.success) {
      updateUI(false);
    }
  });
});

downloadBtn.addEventListener('click', () => {
  if (recordingUrl) {
    chrome.downloads.download({
      url: recordingUrl,
      filename: `screen-recording-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`,
      saveAs: true
    });
  }
});

function updateUI(isRecording) {
  if (isRecording) {
    startBtn.style.display = 'none';
    stopBtn.style.display = 'block';
    downloadBtn.style.display = 'none';
    statusIdle.style.display = 'none';
    statusRecording.style.display = 'block';
  } else {
    startBtn.style.display = 'block';
    stopBtn.style.display = 'none';
    downloadBtn.style.display = 'none';
    statusIdle.style.display = 'block';
    statusRecording.style.display = 'none';
  }
}

function showDownloadButton(url) {
  recordingUrl = url;
  stopBtn.style.display = 'none';
  downloadBtn.style.display = 'block';
  statusIdle.style.display = 'block';
  statusRecording.style.display = 'none';
}

// Listen for recording completion
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'recordingComplete' && message.url) {
    showDownloadButton(message.url);
  }
});
