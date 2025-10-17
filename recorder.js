// Content script for recording
let mediaRecorder = null;
let recordedChunks = [];

// Listen for messages from background
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'start-recording') {
    startRecording(message.streamId)
      .then(() => {
        sendResponse({ success: true });
      })
      .catch(error => {
        console.error('Recording error:', error);
        sendResponse({ success: false, error: error.message });
      });
    return true;
  }
  
  if (message.action === 'stop-recording') {
    stopRecording();
    sendResponse({ success: true });
    return true;
  }
});

async function startRecording(streamId) {
  try {
    console.log('Starting recording with stream ID:', streamId);
    
    // Get the media stream using the stream ID
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId
        }
      },
      video: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId
        }
      }
    });
    
    console.log('Stream obtained:', stream);
    
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
      });
      
      stream.getTracks().forEach(track => track.stop());
      recordedChunks = [];
    };
    
    mediaRecorder.onerror = (event) => {
      console.error('MediaRecorder error:', event);
      stream.getTracks().forEach(track => track.stop());
    };
    
    mediaRecorder.start(1000); // Collect data every second
    
    console.log('Recording started successfully');
    
  } catch (error) {
    console.error('Error starting recording:', error);
    throw error;
  }
}

function stopRecording() {
  console.log('Stop recording called');
  if (mediaRecorder && mediaRecorder.state !== 'inactive') {
    mediaRecorder.stop();
  }
}
