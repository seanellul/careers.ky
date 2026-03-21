---
name: video-editing
description: Multi-layer video editing pipeline using FFmpeg and Remotion
triggers:
  - video editing
  - content creation video
  - marketing video
  - edit footage
  - video production
---

# Video Editing Pipeline

A 6-layer video production workflow optimized for careers.ky marketing content.

## Layer 1: Organize & Ingest
- Inventory all source footage, images, and audio files
- Create a manifest of available assets with durations and formats
- Organize into logical groups (interviews, b-roll, graphics, music)

## Layer 2: Transcribe & Plan
- Transcribe any spoken content using available tools
- Generate an Edit Decision List (EDL) with timestamps
- Plan the narrative structure and shot sequence

## Layer 3: FFmpeg Deterministic Cuts
Use FFmpeg for reliable, reproducible edits:
```bash
# Split a clip
ffmpeg -i input.mp4 -ss 00:00:10 -to 00:00:30 -c copy clip.mp4

# Concatenate clips
ffmpeg -f concat -safe 0 -i filelist.txt -c copy output.mp4

# Add fade transitions
ffmpeg -i input.mp4 -vf "fade=t=in:st=0:d=1,fade=t=out:st=29:d=1" output.mp4

# Extract audio
ffmpeg -i input.mp4 -vn -acodec copy audio.aac

# Overlay audio on video
ffmpeg -i video.mp4 -i audio.mp3 -c:v copy -c:a aac -shortest output.mp4
```

## Layer 4: Remotion for Motion Graphics
Use Remotion (React-based) for overlays, titles, and animated elements:
- Lower thirds with candidate/employer info
- Animated job posting cards
- careers.ky branding overlays
- Transition animations
- Data visualization animations

Remotion fits our React/Next.js stack. Key patterns:
```jsx
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

const TitleCard = ({ title, subtitle }) => {
  const frame = useCurrentFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1]);
  return (
    <div style={{ opacity }}>
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  );
};
```

## Layer 5: AI Enhancement (TODO)
These require API keys — placeholder for future integration:
- **fal.ai**: AI video generation, image-to-video, style transfer
- **ElevenLabs**: AI voiceover generation
- Note: Set up API keys in `.env.local` when ready to use

## Layer 6: Human Final Polish
- Review the assembled edit
- Fine-tune timing and transitions
- Color correction notes
- Export in required formats (web: H.264/MP4, social: platform-specific)

## Workflow
1. Start with Layer 1-2 to plan the edit
2. Use Layer 3 (FFmpeg) for all cuts, trims, and concatenation
3. Use Layer 4 (Remotion) for any animated overlays or graphics
4. Skip Layer 5 unless API keys are configured
5. Present Layer 6 deliverable for human review
