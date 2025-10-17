let mediaRecorder = null;
let recordedChunks = [];

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.target !== 'offscreen') {
    return;
  }
  
  if (message.type === 'start-recording') {
    startRecording(message.data)
      .then(() => sendResponse({ success: true }))
      .catch(error => {
        console.error('Recording error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
  
  if (message.type === 'stop-recording') {
    stopRecording();
    sendResponse({ success: true });
    return true;
  }
});

async function startRecording(data) {
  try {
    console.log('Starting recording with data:', data);
    
    // Use getUserMedia with the streamId from tabCapture
    // Use physical dimensions (accounting for DPR) for accurate capture
    const constraints = {
      audio: false,
      video: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: data.streamId,
          minWidth: data.dimensions.physicalWidth,
          maxWidth: data.dimensions.physicalWidth,
          minHeight: data.dimensions.physicalHeight,
          maxHeight: data.dimensions.physicalHeight
        }
      }
    };
    
    const stream = await navigator.mediaDevices.getUserMedia(constraints);
    
    console.log('Tab capture stream obtained:', stream);
    console.log('Logical dimensions:', data.dimensions.width, 'x', data.dimensions.height);
    console.log('Physical dimensions (with DPR):', data.dimensions.physicalWidth, 'x', data.dimensions.physicalHeight);
    console.log('Device Pixel Ratio:', data.dimensions.dpr);
    
    // VP9 with Opus codec
    const mimeType = 'video/webm;codecs=vp9,opus';
    
    if (!MediaRecorder.isTypeSupported(mimeType)) {
      stream.getTracks().forEach(track => track.stop());
      throw new Error('VP9/Opus codec not supported');
    }
    
    recordedChunks = [];
    mediaRecorder = new MediaRecorder(stream, {
      mimeType: mimeType,
      videoBitsPerSecond: 2500000
    });
    
    mediaRecorder.ondataavailable = (event) => {
      if (event.data && event.data.size > 0) {
        recordedChunks.push(event.data);
      }
    };
    
    mediaRecorder.onstop = () => {
      const blob = new Blob(recordedChunks, { type: mimeType });
      const url = URL.createObjectURL(blob);
      
      console.log('Recording stopped, blob URL:', url);
      console.log('Blob size:', blob.size, 'bytes');
      
      // Send blob URL to background
      chrome.runtime.sendMessage({
        type: 'download-recording',
        target: 'background',
        data: url
      }, (response) => {
        console.log('Message sent to background, response:', response);
      });
      
      stream.getTracks().forEach(track => track.stop());
      recordedChunks = [];
    };
    
    mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event);
      stream.getTracks().forEach(track => track.stop());
      
      chrome.runtime.sendMessage({
        type: 'recording-stopped',
        target: 'background'
      });
    };
    
    mediaRecorder.start(1000); // Collect data every second
    
    console.log('Recording started');
    
  } catch (error) {
    console.error('Error starting recording:', error);

    chrome.runtime.sendMessage({
      type: 'recording-stopped',
      target: 'background'
    });
  }
}

function stopRecording() {
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
}
