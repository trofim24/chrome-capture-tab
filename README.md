# Chrome Tab Screen Recorder

A Chrome extension that records browser tabs using MediaRecorder API with VP9 and Opus codecs. The recording captures the full page dimensions.

## Features

- **VP9 Video Codec** with Opus audio codec (`video/webm;codecs=vp9,opus`)
- **Tab Capture** - Records the current Chrome tab with audio
- **Page Size** - Video dimensions match the page size
- **Simple UI** - Easy-to-use popup interface
- **Automatic Download** - Recordings are saved as `.webm` files

## Installation

### Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable **Developer mode** (toggle in top-right corner)
3. Click **Load unpacked**
4. Select the extension directory (`chrome-screen-recorder`)
5. The extension icon should appear in your toolbar

## Usage

1. **Navigate** to the tab you want to record
2. **Click** the extension icon in the toolbar
3. **Click** "Start Recording" button
4. The recording begins immediately
5. **Click** "Stop Recording" when done
6. The video file will automatically download as `screen-recording-[timestamp].webm`

## Technical Details

### Recording Specifications

- **Video Codec**: VP9
- **Audio Codec**: Opus
- **Container Format**: WebM
- **Video Bitrate**: 2.5 Mbps
- **Data Collection**: Every 1 second
- **Audio**: Captured from tab (including system audio)

### Permissions Required

- `tabCapture` - Capture tab video and audio
- `activeTab` - Access to current tab
- `scripting` - Inject scripts to get page dimensions

### Browser Compatibility

- Chrome 94+
- Chromium-based browsers with VP9 codec support

## File Structure

```
chrome-screen-recorder/
├── manifest.json          # Extension manifest
├── popup.html            # UI popup interface
├── popup.js              # Popup logic
├── background.js         # Background service worker
├── icon16.png           # 16x16 icon
├── icon48.png           # 48x48 icon
├── icon128.png          # 128x128 icon
└── README.md            # This file
```

## Development

### Key Components

1. **popup.html/js** - User interface for starting/stopping recording
2. **background.js** - Handles tab capture and MediaRecorder logic
3. **manifest.json** - Extension configuration

### How It Works

1. User clicks "Start Recording" in popup
2. Popup sends message to background service worker
3. Background worker injects script to log page dimensions
4. `chrome.tabCapture.capture()` captures tab stream
5. `MediaRecorder` records stream with VP9/Opus codec
6. On stop, video blob is created and downloaded
7. Stream tracks are cleaned up

## Troubleshooting

### "VP9/Opus codec not supported"
- Update Chrome to the latest version
- VP9 codec is supported in Chrome 94+

### Recording not starting
- Ensure you have permission to capture the tab
- Some Chrome internal pages (chrome://) cannot be recorded
- Check the extension has necessary permissions

### No audio in recording
- Ensure the tab is playing audio
- Check system audio settings
- Some tabs may not have audio to capture

### Recording quality issues
- Adjust `videoBitsPerSecond` in `background.js` (default: 2.5 Mbps)
- Higher bitrate = better quality but larger file size

## Customization

### Change Video Bitrate
Edit `background.js`:
```javascript
mediaRecorder = new MediaRecorder(stream, {
  mimeType: mimeType,
  videoBitsPerSecond: 2500000 // Change this value
});
```

### Change Data Collection Interval
Edit `background.js`:
```javascript
mediaRecorder.start(1000); // Change milliseconds (default: 1000ms = 1s)
```

### Change Output Filename
Edit `background.js`:
```javascript
filename: `screen-recording-${timestamp}.webm` // Customize filename
```

## License

This extension is provided as-is for educational and personal use.

## Notes

- The extension captures the visible and scrollable area of the tab
- Page dimensions are logged to the console for debugging
- Recording stops automatically when MediaRecorder.stop() is called
- Blob URLs are cleaned up automatically after download
