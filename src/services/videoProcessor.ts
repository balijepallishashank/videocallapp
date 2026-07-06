import { SelfieSegmentation, Results } from '@mediapipe/selfie_segmentation';

const MP_CDN = 'https://cdn.jsdelivr.net/npm/@mediapipe/selfie_segmentation';

let selfieSegmentation: SelfieSegmentation | null = null;
let currentBgType: string = 'none';
let currentBlurAmount: number = 10;
let customImageElement: HTMLImageElement | null = null;

// Preset gradients matching VirtualBackgrounds.tsx
const GRADIENTS: Record<string, string[]> = {
  office: ['#1e293b', '#0f172a'],
  nature: ['#064e3b', '#1e3a8a'],
  abstract: ['#581c87', '#9d174d'],
  space: ['#1e1b4b', '#020617'],
};

const getGradient = (type: string, ctx: CanvasRenderingContext2D, width: number, height: number): CanvasGradient => {
  const grad = ctx.createLinearGradient(0, 0, width, height);
  const colors = GRADIENTS[type] || ['#0f172a', '#020617'];
  grad.addColorStop(0, colors[0]);
  grad.addColorStop(1, colors[1]);
  return grad;
};

export const initSelfieSegmentation = (): SelfieSegmentation | null => {
  if (!selfieSegmentation && typeof window !== 'undefined') {
    try {
      selfieSegmentation = new SelfieSegmentation({
        locateFile: (file) => `${MP_CDN}/${file}`,
      });
      selfieSegmentation.setOptions({
        modelSelection: 1, // 1 for landscape/low-latency
      });
    } catch (e) {
      console.error('Failed to initialize MediaPipe SelfieSegmentation', e);
    }
  }
  return selfieSegmentation;
};

export const setBackgroundConfig = (type: string, blur: number, customUrl: string | null) => {
  currentBgType = type;
  currentBlurAmount = blur;

  if (type === 'custom' && customUrl) {
    customImageElement = new Image();
    customImageElement.src = customUrl;
  } else {
    customImageElement = null;
  }
};

export const startStreamProcessing = (
  rawStream: MediaStream,
  canvas: HTMLCanvasElement,
  onProcessedTrack: (track: MediaStreamTrack) => void
): (() => void) => {
  const model = initSelfieSegmentation();
  if (!model) {
    // If MediaPipe fails to load, fallback to passing the raw track
    onProcessedTrack(rawStream.getVideoTracks()[0]);
    return () => {};
  }

  const rawVideo = document.createElement('video');
  rawVideo.srcObject = rawStream;
  rawVideo.muted = true;
  rawVideo.playsInline = true;
  rawVideo.style.display = 'none';
  document.body.appendChild(rawVideo);
  rawVideo.play().catch(err => console.error('Error playing raw processing video:', err));

  const ctx = canvas.getContext('2d')!;
  let active = true;

  model.onResults((results: Results) => {
    if (!active) return;

    canvas.width = results.image.width;
    canvas.height = results.image.height;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw segment mask
    ctx.drawImage(results.segmentationMask, 0, 0, canvas.width, canvas.height);

    // Filter to retain only the user's pixels
    ctx.globalCompositeOperation = 'source-in';
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    // Composite background behind the user
    ctx.globalCompositeOperation = 'destination-over';

    if (currentBgType === 'blur') {
      ctx.filter = `blur(${currentBlurAmount}px)`;
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
      ctx.filter = 'none';
    } else if (GRADIENTS[currentBgType]) {
      ctx.fillStyle = getGradient(currentBgType, ctx, canvas.width, canvas.height);
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (currentBgType === 'custom' && customImageElement && customImageElement.complete) {
      ctx.drawImage(customImageElement, 0, 0, canvas.width, canvas.height);
    } else {
      // None: Draw raw frame
      ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
    }

    ctx.restore();
  });

  const processFrame = async () => {
    if (!active) return;
    if (rawVideo.readyState === rawVideo.HAVE_ENOUGH_DATA) {
      try {
        await model.send({ image: rawVideo });
      } catch (err) {
        console.error('SelfieSegmentation send error:', err);
      }
    }
    requestAnimationFrame(processFrame);
  };

  requestAnimationFrame(processFrame);

  const processedStream = canvas.captureStream(30);
  const processedTrack = processedStream.getVideoTracks()[0];
  onProcessedTrack(processedTrack);

  return () => {
    active = false;
    rawVideo.pause();
    rawVideo.srcObject = null;
    rawVideo.remove();
  };
};
