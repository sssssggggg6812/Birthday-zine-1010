import {
  FilesetResolver,
  HandLandmarker
} from '@mediapipe/tasks-vision';

let handLandmarker = null;
let lastDetectionTime = 0;
let handDetected = false;

export async function initHandTracking(video, onHandDetected) {
  const vision = await FilesetResolver.forVisionTasks(
    'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm'
  );

  handLandmarker = await HandLandmarker.createFromOptions(vision, {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task',
      delegate: 'GPU'
    },
    runningMode: 'VIDEO',
    numHands: 2
  });

  console.log('Hand tracking ready!');
  detectHands(video, onHandDetected);
}

// Check whether the hand is an open palm,
// rather than triggering whenever any hand appears.
function isRaisedHandGesture(landmarks) {
  const wrist = landmarks[0];

  const fingerPairs = [
    [8, 6],   // index finger tip and middle joint
    [12, 10], // middle finger
    [16, 14], // ring finger
    [20, 18]  // little finger
  ];

  // All four fingers should be extended.
  const fingersExtended = fingerPairs.every(
    ([tip, joint]) => landmarks[tip].y < landmarks[joint].y
  );

  // The fingertips should be above the wrist in the image.
  const palmUpright = [8, 12, 16, 20].every(
    (tip) => landmarks[tip].y < wrist.y
  );

  return fingersExtended && palmUpright;
}

function detectHands(video, onHandDetected) {
  if (!handLandmarker) return;

  if (video.readyState >= 2) {
    const now = performance.now();

    if (now - lastDetectionTime > 100) {
      lastDetectionTime = now;

      const result = handLandmarker.detectForVideo(video, now);

      const hasRaisedHand = result.landmarks.some(
        isRaisedHandGesture
      );

      // Trigger only when the gesture changes from absent to present.
      if (hasRaisedHand && !handDetected) {
        console.log('Raised-hand gesture detected!');
        onHandDetected?.();
      }

      handDetected = hasRaisedHand;
    }
  }

  requestAnimationFrame(() => detectHands(video, onHandDetected));
}