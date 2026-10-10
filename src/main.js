import * as THREE from 'three';
import { initHandTracking } from './handTracking.js';
import './style.css';

// ---------- Scene ----------
const container = document.querySelector('#scene');

const scene = new THREE.Scene();
scene.background = new THREE.Color('#ffffff');

const camera = new THREE.PerspectiveCamera(
  35,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 4.1, 13.5);
camera.lookAt(0, 1.5, 0);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false
});

renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;

container.appendChild(renderer.domElement);

// ---------- Lighting ----------
scene.add(new THREE.HemisphereLight(0xffffff, 0xe8e1d8, 2.1));

const keyLight = new THREE.DirectionalLight(0xffffff, 3);
keyLight.position.set(-4, 9, 7);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.camera.left = -8;
keyLight.shadow.camera.right = 8;
keyLight.shadow.camera.top = 8;
keyLight.shadow.camera.bottom = -8;
keyLight.shadow.bias = -0.0005;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xffffff, 1.1);
fillLight.position.set(5, 4, -4);
scene.add(fillLight);

// ---------- Materials ----------
const ivory = new THREE.MeshStandardMaterial({
  color: '#e8dfce',
  roughness: 0.36
});

const ivoryLight = new THREE.MeshStandardMaterial({
  color: '#f7f0e4',
  roughness: 0.32
});

const ivoryDark = new THREE.MeshStandardMaterial({
  color: '#c9bda9',
  roughness: 0.5
});

const screenMaterial = new THREE.MeshStandardMaterial({
  color: '#20272a',
  roughness: 0.2,
  metalness: 0.05
});

const keyMaterial = new THREE.MeshStandardMaterial({
  color: '#fff9ee',
  roughness: 0.4
});

const labelMaterial = new THREE.MeshStandardMaterial({
  color: '#8e8578',
  roughness: 0.65
});

// ---------- Main Group ----------
const sceneGroup = new THREE.Group();
scene.add(sceneGroup);

// Rounded box made from a beveled extruded shape
function makeRoundedBox(width, height, depth, radius, material) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;

  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(
    x + width, y + height,
    x + width - radius, y + height
  );
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(
    x, y + height,
    x, y + height - radius
  );
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);

  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: depth - radius,
    bevelEnabled: true,
    bevelSegments: 3,
    steps: 1,
    bevelSize: radius * 0.35,
    bevelThickness: radius * 0.35,
    curveSegments: 8
  });

  geometry.translate(0, 0, -(depth - radius) / 2);

  const mesh = new THREE.Mesh(geometry, material);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  return mesh;
}

function addRoundedPart(parent, w, h, d, r, material, x, y, z) {
  const mesh = makeRoundedBox(w, h, d, r, material);
  mesh.position.set(x, y, z);
  parent.add(mesh);
  return mesh;
}

/* ---------- Downward Hint Arrows ---------- */

function createHintArrow() {
  const shape = new THREE.Shape();

  // Downward-pointing arrow
  shape.moveTo(-0.16, 0.38);
  shape.lineTo(0.16, 0.38);
  shape.lineTo(0.16, -0.02);
  shape.lineTo(0.34, -0.02);
  shape.lineTo(0, -0.38);
  shape.lineTo(-0.34, -0.02);
  shape.lineTo(-0.16, -0.02);
  shape.closePath();

  const geometry = new THREE.ShapeGeometry(shape);

  const arrow = new THREE.Mesh(
    geometry,
    new THREE.MeshBasicMaterial({
      color: '#f2a8bd',
      side: THREE.DoubleSide,
      depthTest: false,
      toneMapped: false
    })
  );

  arrow.renderOrder = 50;
  return arrow;
}


// ---------- Vintage CRT Computer ----------
const computer = new THREE.Group();
sceneGroup.add(computer);

// One thick, softly rounded all-in-one body
addRoundedPart(
  computer, 3.9, 3.55, 1.55, 0.22,
  ivory, 0, 3.05, 0
);

// Front bezel
addRoundedPart(
  computer, 3.52, 2.85, 0.18, 0.16,
  ivoryLight, 0, 3.28, 0.79
);

// Screen glass
addRoundedPart(
  computer, 2.9, 2.16, 0.09, 0.12,
  screenMaterial, 0, 3.48, 0.91
);
// ---------- Live Webcam on CRT Screen ----------

// Create a hidden video element for the webcam
const video = document.createElement('video');
video.autoplay = true;
video.muted = true;
video.playsInline = true;

// Use the live video as a Three.js texture
const videoTexture = new THREE.VideoTexture(video);
videoTexture.colorSpace = THREE.SRGBColorSpace;

// Mirror the image like a selfie camera

// Crop the video to fit the screen without stretching
function updateWebcamCrop() {
  if (!video.videoWidth || !video.videoHeight) return;

  const videoAspect = video.videoWidth / video.videoHeight;
  const screenAspect = 2.55 / 1.82;

  let repeatX = 1;
  let repeatY = 1;
  let offsetX = 0;
  let offsetY = 0;

  if (videoAspect > screenAspect) {
    repeatX = screenAspect / videoAspect;
  } else {
    repeatY = videoAspect / screenAspect;
  }

  // Mirror horizontally while keeping the crop centered
  videoTexture.repeat.set(-repeatX, repeatY);
  videoTexture.offset.set(repeatX, offsetY);
}

const webcamMaterial = new THREE.MeshBasicMaterial({
  map: videoTexture,
  side: THREE.FrontSide,
  toneMapped: false
});

// Place the camera image directly on the CRT screen
const webcamScreen = new THREE.Mesh(
  new THREE.PlaneGeometry(2.55, 1.82),
  webcamMaterial
);

// Keep the webcam image proportional
webcamScreen.scale.set(1, 1, 1);

webcamScreen.position.set(0, 3.48, 0.967);
computer.add(webcamScreen);

/* ---------- Hand Gesture Sign ---------- */

// Create the sign face
const signCanvas = document.createElement('canvas');
signCanvas.width = 512;
signCanvas.height = 384;

const signContext = signCanvas.getContext('2d');

// Cream-colored sign background
signContext.fillStyle = '#FFF8E9';
signContext.fillRect(0, 0, 512, 384);

// Thin blue border
signContext.strokeStyle = '#168BFF';
signContext.lineWidth = 10;
signContext.strokeRect(12, 12, 488, 360);

// Blue text
signContext.fillStyle = '#168BFF';
signContext.textAlign = 'center';
signContext.textBaseline = 'middle';
signContext.font = 'bold 100px sans-serif';
signContext.fillText('请举手！', 256, 192);

const signTexture = new THREE.CanvasTexture(signCanvas);
signTexture.colorSpace = THREE.SRGBColorSpace;

// Build the 3D sign
const signGroup = new THREE.Group();

const signBoard = new THREE.Mesh(
  new THREE.BoxGeometry(1.25, 0.94, 0.08),
  new THREE.MeshStandardMaterial({
    map: signTexture,
    roughness: 0.7
  })
);

// Put the text on the front of the board
const signFace = new THREE.Mesh(
  new THREE.PlaneGeometry(1.25, 0.94),
  new THREE.MeshBasicMaterial({
    map: signTexture,
    toneMapped: false
  })
);
signFace.position.z = 0.046;

signGroup.add(signBoard);
signGroup.add(signFace);

// Two small supports
const supportMaterial = new THREE.MeshStandardMaterial({
  color: '#E8D9BD',
  roughness: 0.8
});

for (const x of [-0.32, 0.32]) {
  const support = new THREE.Mesh(
    new THREE.BoxGeometry(0.07, 0.48, 0.07),
    supportMaterial
  );

  support.position.set(x, -0.69, 0);
  signGroup.add(support);
}

// Position beside the computer, on the desk
signGroup.position.set(3.2, 0.72, 0.9);
computer.add(signGroup);

const handHintArrow = createHintArrow();
handHintArrow.position.set(3.2, 1.95, 1.05);
handHintArrow.scale.setScalar(0.75);
sceneGroup.add(handHintArrow);


/* ---------- Clickable Birthday Cake Sign ---------- */

const cakeSignCanvas = document.createElement('canvas');
cakeSignCanvas.width = 512;
cakeSignCanvas.height = 384;

const cakeSignContext = cakeSignCanvas.getContext('2d');

cakeSignContext.fillStyle = '#FFF8E9';
cakeSignContext.fillRect(0, 0, 512, 384);

cakeSignContext.strokeStyle = '#E8B7C4';
cakeSignContext.lineWidth = 12;
cakeSignContext.strokeRect(12, 12, 488, 360);

cakeSignContext.textAlign = 'center';
cakeSignContext.textBaseline = 'middle';
cakeSignContext.font = '130px sans-serif';
cakeSignContext.fillText('🍰', 256, 145);

cakeSignContext.fillStyle = '#9C7180';
cakeSignContext.font = 'bold 43px sans-serif';
cakeSignContext.fillText('BIRTHDAY', 256, 275);

const cakeSignTexture = new THREE.CanvasTexture(cakeSignCanvas);
cakeSignTexture.colorSpace = THREE.SRGBColorSpace;

const cakeSign = new THREE.Group();

const cakeSignBoard = new THREE.Mesh(
  new THREE.BoxGeometry(1.05, 0.8, 0.09),
  new THREE.MeshStandardMaterial({
    color: '#F7F0E4',
    roughness: 0.7
  })
);

const cakeSignFace = new THREE.Mesh(
  new THREE.PlaneGeometry(1.05, 0.8),
  new THREE.MeshBasicMaterial({
    map: cakeSignTexture,
    toneMapped: false
  })
);

cakeSignFace.position.z = 0.051;
cakeSign.add(cakeSignBoard);
cakeSign.add(cakeSignFace);

// Place the sign on the desk, to the left of the computer
cakeSign.position.set(-2.8, 0.75, 1.0);
sceneGroup.add(cakeSign);

const cakeHintArrow = createHintArrow();
cakeHintArrow.position.set(-2.8, 1.95, 1.15);
cakeHintArrow.scale.setScalar(0.75);
sceneGroup.add(cakeHintArrow);



// ---------- Birthday Message ----------
const birthdayCanvas = document.createElement('canvas');
birthdayCanvas.width = 1024;
birthdayCanvas.height = 512;

const birthdayContext = birthdayCanvas.getContext('2d');
const birthdayTexture = new THREE.CanvasTexture(birthdayCanvas);

const birthdayMaterial = new THREE.MeshBasicMaterial({
  map: birthdayTexture,
  transparent: true,
  opacity: 1,
  depthTest: false,
  toneMapped: false
});

const birthdayScreen = new THREE.Mesh(
  new THREE.PlaneGeometry(2.55, 1.82),
  birthdayMaterial
);

birthdayScreen.position.set(0, 3.48, 0.975);
birthdayScreen.renderOrder = 10;
birthdayScreen.visible = false;
computer.add(birthdayScreen);
let enterButtonShowing = false;
let birthdayMessageActive = false;

/* ---------- ENTER Button ---------- */

const enterCanvas = document.createElement('canvas');
enterCanvas.width = 1024;
enterCanvas.height = 730;

const enterContext = enterCanvas.getContext('2d');
const enterTexture = new THREE.CanvasTexture(enterCanvas);
enterTexture.colorSpace = THREE.SRGBColorSpace;

const enterMaterial = new THREE.MeshBasicMaterial({
  map: enterTexture,
  transparent: true,
  opacity: 0,
  depthTest: false,
  toneMapped: false
});

const enterScreen = new THREE.Mesh(
  new THREE.PlaneGeometry(2.55, 1.82),
  enterMaterial
);

enterScreen.position.set(0, 3.48, 0.985);
enterScreen.renderOrder = 11;
enterScreen.visible = false;
computer.add(enterScreen);

// Draw a button with a transparent surrounding area
function drawEnterButton() {
  enterContext.clearRect(0, 0, 1024, 730);

  const x = 377;
  const y = 535;
  const w = 270;
  const h = 82;
  const r = 22;

  enterContext.beginPath();
  enterContext.moveTo(x + r, y);
  enterContext.lineTo(x + w - r, y);
  enterContext.quadraticCurveTo(x + w, y, x + w, y + r);
  enterContext.lineTo(x + w, y + h - r);
  enterContext.quadraticCurveTo(
    x + w, y + h, x + w - r, y + h
  );
  enterContext.lineTo(x + r, y + h);
  enterContext.quadraticCurveTo(x, y + h, x, y + h - r);
  enterContext.lineTo(x, y + r);
  enterContext.quadraticCurveTo(x, y, x + r, y);
  enterContext.closePath();

  enterContext.fillStyle = 'rgba(255, 248, 233, 0.92)';
  enterContext.fill();

  enterContext.strokeStyle = '#168BFF';
  enterContext.lineWidth = 5;
  enterContext.stroke();

  enterContext.fillStyle = '#168BFF';
  enterContext.font = 'bold 38px Georgia';
  enterContext.textAlign = 'center';
  enterContext.textBaseline = 'middle';
  enterContext.fillText('ENTER', 512, y + h / 2);

  enterTexture.needsUpdate = true;
}


function showEnterButton() {
  // Prevent duplicate appearances during the same cycle
  if (enterButtonShowing) return;

  enterButtonShowing = true;

  drawEnterButton();

  enterScreen.visible = true;
  enterMaterial.opacity = 0;

  const startTime = performance.now();
  const fadeDuration = 800;

  function fadeInEnter(now) {
    const progress = Math.min(
      (now - startTime) / fadeDuration,
      1
    );

    enterMaterial.opacity =
      progress * progress * (3 - 2 * progress);

    if (progress < 1) {
      requestAnimationFrame(fadeInEnter);
    }
  }

  requestAnimationFrame(fadeInEnter);
}

function showBirthdayMessage() {
    // Ignore repeated callbacks during the same birthday message
  if (birthdayMessageActive || endingSequenceActive) return;
  birthdayMessageActive = true;
  // Clear the canvas — keep its background transparent
  birthdayContext.clearRect(0, 0, 1024, 512);

 birthdayContext.fillStyle = '#168BFF';
  birthdayContext.textAlign = 'center';
  birthdayContext.textBaseline = 'middle';

  birthdayContext.font = 'bold 76px Georgia';
  birthdayContext.fillText('HAPPY', 512, 205);

  birthdayContext.font = 'bold 88px Georgia';
  birthdayContext.fillText('BIRTHDAY!', 512, 305);

  birthdayTexture.needsUpdate = true;

  // Keep the webcam visible
  webcamScreen.visible = true;
  birthdayScreen.visible = true;
  enterScreen.visible = false;
  enterButtonShowing = false;
enterMaterial.opacity = 0;

  // Fade in the text over 2.5 seconds
  birthdayMaterial.opacity = 0;

  const fadeDuration = 2500;
  const startTime = performance.now();

  function fadeInText(now) {
    const progress = Math.min((now - startTime) / fadeDuration, 1);

    // Smooth ease-in-out fade
    birthdayMaterial.opacity =
      progress * progress * (3 - 2 * progress);

    if (progress < 1) {
  requestAnimationFrame(fadeInText);
} else {
  setTimeout(showEnterButton, 400);
}
  }

  requestAnimationFrame(fadeInText);

  console.log('Birthday message displayed!');
}


// Request webcam permission
async function startWebcam() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',
        width: { ideal: 1280 },
        height: { ideal: 720 }
      },
      audio: false
    });

    video.srcObject = stream;
    await video.play();
    updateWebcamCrop();
   await initHandTracking(video, () => {
  if (endingSequenceActive) return;

  showBirthdayMessage();
});

    console.log('Webcam started successfully!');
  } catch (error) {
    console.error('Could not start webcam:', error);
  }
}

startWebcam();

// Subtle inner glass highlight
const glassLineMaterial = new THREE.MeshBasicMaterial({
  color: '#596165',
  transparent: true,
  opacity: 0.35
});

addRoundedPart(
  computer, 2.72, 0.018, 0.012, 0.008,
  glassLineMaterial, 0, 4.42, 0.965
);

// Lower control panel
addRoundedPart(
  computer, 3.05, 0.48, 0.12, 0.07,
  ivory, 0, 1.89, 0.81
);

// Floppy disk slot
addRoundedPart(
  computer, 0.92, 0.075, 0.035, 0.025,
  ivoryDark, 0.18, 1.92, 0.89
);

addRoundedPart(
  computer, 0.68, 0.018, 0.015, 0.008,
  screenMaterial, 0.18, 1.92, 0.916
);

// Small power button
const powerButton = new THREE.Mesh(
  new THREE.CylinderGeometry(0.065, 0.065, 0.035, 32),
  ivoryDark
);
powerButton.rotation.x = Math.PI / 2;
powerButton.position.set(-1.12, 1.91, 0.89);
powerButton.castShadow = true;
computer.add(powerButton);

// Tiny indicator light
const indicator = new THREE.Mesh(
  new THREE.SphereGeometry(0.025, 16, 16),
  new THREE.MeshBasicMaterial({ color: '#a9b6a0' })
);
indicator.position.set(-0.92, 1.91, 0.9);
computer.add(indicator);

// ---------- Keyboard ----------
const keyboard = new THREE.Group();
sceneGroup.add(keyboard);

// Keyboard is in front of the computer
keyboard.position.set(0, 0.48, 2.35);
keyboard.rotation.x = -0.035;

// Rounded keyboard body
addRoundedPart(
  keyboard, 3.65, 0.22, 1.28, 0.12,
  ivory, 0, 0, 0
);

// Top surface, slightly raised
addRoundedPart(
  keyboard, 3.47, 0.055, 1.12, 0.09,
  ivoryLight, 0, 0.105, 0
);

// Key layout
const keyWidth = 0.235;
const keyHeight = 0.075;
const keyDepth = 0.235;
const gapX = 0.045;
const gapZ = 0.045;

const rows = [
  { count: 14, z: -0.38, start: -1.55 },
  { count: 14, z: -0.10, start: -1.55 },
  { count: 13, z: 0.18, start: -1.48 },
  { count: 11, z: 0.43, start: -1.30 }
];

for (let rowIndex = 0; rowIndex < rows.length; rowIndex++) {
  const row = rows[rowIndex];

  for (let i = 0; i < row.count; i++) {
    const key = makeRoundedBox(
      keyWidth,
      keyHeight,
      keyDepth,
      0.035,
      keyMaterial
    );

    key.position.set(
      row.start + i * (keyWidth + gapX),
      0.17,
      row.z
    );

    key.castShadow = true;
    keyboard.add(key);
  }
}

// Wider space bar
addRoundedPart(
  keyboard, 1.05, 0.075, 0.22, 0.035,
  keyMaterial, 0, 0.17, 0.49
);

// A few darker function keys for subtle detail
for (let i = 0; i < 5; i++) {
  addRoundedPart(
    keyboard, 0.17, 0.075, 0.16, 0.025,
    ivoryDark,
    -1.42 + i * 0.23,
    0.17,
    -0.48
  );
}

// ---------- Seamless White Studio ----------
const floorMaterial = new THREE.ShadowMaterial({
  opacity: 0.12
});

const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(200, 200),
  floorMaterial
);

floor.rotation.x = -Math.PI / 2;
floor.position.y = -0.02;
floor.receiveShadow = true;
scene.add(floor);

/* ---------- Book Preview and Opening Animation ---------- */


/* ---------- Zine Preview, Opening and Page Turning ---------- */

let bookElement = null;
let bookIsOpening = false;
let currentStep = 0;
// 0 = small cover in computer
// 1 = enlarged spread: Page 6 + Page 1
// 2 = cover turned: Page 2 + Page 3
// 3 = next page turned: Page 4 + Page 5


const bookStyle = document.createElement('style');

bookStyle.textContent = `
  #zine-book {
    position: fixed;
    z-index: 9999;
    width: 64px;
    height: 90.5px;
    left: 50%;
    top: 50%;
    transform: translate(-50%, -50%);
    cursor: pointer;
    opacity: 0;
    transition:
      left 1.2s cubic-bezier(.2,.75,.25,1),
      top 1.2s cubic-bezier(.2,.75,.25,1),
      width 1.2s cubic-bezier(.2,.75,.25,1),
      height 1.2s cubic-bezier(.2,.75,.25,1),
      opacity .5s ease;
  }

  
  #zine-book .page-cover-solo {
    position: absolute;
    top: 0;
    left: 50%;
    width: 50%;
    height: 100%;
    object-fit: contain;
    object-position: center;
  }


 #zine-book .book-pages {
  position: absolute;
  inset: 0;
  display: none;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  height: 100%;
}

#zine-book.is-spread .book-pages {
  display: grid;
}

 /* Keep Page 1 visible in the first enlarged state */
#zine-book.is-spread.state-1 .page-cover-solo {
  display: block;
}

/* Hide the single cover only after moving to the next spread */
#zine-book.is-spread.state-2 .page-cover-solo,
#zine-book.is-spread.state-3 .page-cover-solo,
#zine-book.is-spread.state-4 .page-cover-solo {
  display: none;
}

  #zine-book.is-spread .book-pages {
    display: grid;
  }

  #zine-book .book-left-page,
  #zine-book .book-right-page {
    position: relative;
    min-width: 0;
    min-height: 0;
    overflow: hidden;
    background: transparent;
  }

  #zine-book .zine-page {
    display: none;
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    object-fit: fill;
  }

  /* Step 1: only Page 1 is shown before opening */
  #zine-book.is-spread .page-1 {
    display: block;
  }

  /* Step 2: Page 2 left, Page 3 right */
  #zine-book.is-spread.state-2 .page-2,
  #zine-book.is-spread.state-2 .page-3 {
    display: block;
  }

  /* Step 3: Page 4 left, Page 5 right */
  #zine-book.is-spread.state-3 .page-4,
  #zine-book.is-spread.state-3 .page-5 {
    display: block;
  }

  /* Step 4: only Page 6 left; right side is transparent */
  #zine-book.is-spread.state-4 .page-6 {
    display: block;
  }

  #zine-book.is-spread.state-4 .book-pages {
    grid-template-columns: 1fr 1fr;
  }
`;

document.head.appendChild(bookStyle);



/* Create the zine preview inside the computer screen */
function showBookPreview() {
  enterScreen.visible = false;
  birthdayScreen.visible = false;
  webcamScreen.visible = true;
  birthdayMessageActive = false;
enterButtonShowing = false;

  if (bookElement) {
    bookElement.remove();
  }

  bookIsOpening = false;
  currentStep = 0;

  scene.updateMatrixWorld(true);
  camera.updateMatrixWorld(true);

  const screenCenter = webcamScreen.getWorldPosition(
    new THREE.Vector3()
  );

  screenCenter.project(camera);

  const canvasRect = renderer.domElement.getBoundingClientRect();

  const screenX =
    canvasRect.left +
    (screenCenter.x + 1) * canvasRect.width / 2;

  const screenY =
    canvasRect.top +
    (1 - screenCenter.y) * canvasRect.height / 2;

  bookElement = document.createElement('div');
  bookElement.id = 'zine-book';
  bookElement.style.pointerEvents = 'auto';

  
  bookElement.innerHTML = `
    <img
      class="page-cover-solo"
      src="/zine/page-1.png"
      alt="Zine cover"
    >

    <div class="book-pages">
      <div class="book-left-page">
        <img class="zine-page page-2" src="/zine/page-2.png" alt="Page 2">
        <img class="zine-page page-4" src="/zine/page-4.png" alt="Page 4">
        <img class="zine-page page-6" src="/zine/page-6.png" alt="Page 6">
      </div>

      <div class="book-right-page">
        <img class="zine-page page-3" src="/zine/page-3.png" alt="Page 3">
        <img class="zine-page page-5" src="/zine/page-5.png" alt="Page 5">
      </div>
    </div>
  `;


  document.body.appendChild(bookElement);

    // Make the zine preview larger on the computer screen
  
  // Make the zine preview larger and keep it closer to the screen center
  const previewWidth = 125;
  const previewHeight = previewWidth * 1.414;
  const previewLeft = screenX - previewWidth * 0.3;

  bookElement.style.width = `${previewWidth}px`;
  bookElement.style.height = `${previewHeight}px`;
  bookElement.style.left = `${previewLeft}px`;

  // Save the adjusted position for the return animation
  bookElement.dataset.homeLeft = String(previewLeft);
  bookElement.dataset.homeTop = String(screenY);
  bookElement.style.top = `${screenY}px`;
  bookElement.style.opacity = '0';


  requestAnimationFrame(() => {
    if (bookElement) {
      bookElement.style.opacity = '1';
    }
  });

  bookElement.addEventListener('click', handleZineClick);
  // Clicking the background returns the zine after Page 6
if (!renderer.domElement.dataset.zineReturnListener) {
  renderer.domElement.addEventListener(
    'click',
    returnZineToComputer
  );

  renderer.domElement.dataset.zineReturnListener = 'true';
}
}



/* Handle the three separate clicks */

function handleZineClick(event) {
  if (!bookElement || bookIsOpening) return;

  
  // Click 1: enlarge Page 1 proportionally on the right side
  if (currentStep === 0) {
    bookIsOpening = true;

    renderer.domElement.style.transition = 'filter 1.2s ease';
    renderer.domElement.style.filter = 'blur(7px)';

    const pageHeight = Math.min(
      window.innerHeight * 0.75,
      560
    );

    const pageWidth = pageHeight / 1.414;

    // Keep the cover A4-shaped and place it on the right
    // The whole book keeps a two-page width.
// Page 1 itself stays on the right half.
bookElement.style.width = `${pageWidth * 2}px`;
bookElement.style.height = `${pageHeight}px`;
    bookElement.style.left = '50%';
bookElement.style.top = '50%';

    setTimeout(() => {
      if (!bookElement) return;

      bookElement.classList.add('is-spread');
      bookElement.classList.add('state-1');

      currentStep = 1;
      bookIsOpening = false;
    }, 1200);

    return;
  }


  // Click 2: Page 1 -> Pages 2 + 3
  if (currentStep === 1) {
    bookElement.classList.remove('state-1');
    bookElement.classList.add('state-2');
    currentStep = 2;
    return;
  }

  // Click 3: Page 3 -> Pages 4 + 5
  if (currentStep === 2) {
    bookElement.classList.remove('state-2');
    bookElement.classList.add('state-3');
    currentStep = 3;
    return;
  }

  // Click 4: Page 5 -> only Page 6 on the left
  if (currentStep === 3) {
    bookElement.classList.remove('state-3');
    bookElement.classList.add('state-4');
    currentStep = 4;
  }
}


function returnZineToComputer() {
  if (!bookElement || currentStep !== 4 || bookIsOpening) return;

  bookIsOpening = true;

  const homeLeft = Number(bookElement.dataset.homeLeft);
  const homeTop = Number(bookElement.dataset.homeTop);

  bookElement.classList.remove(
    'is-spread',
    'state-1',
    'state-2',
    'state-3',
    'state-4'
  );

  bookElement.style.transition =
    'left 0.9s ease, top 0.9s ease, width 0.9s ease, height 0.9s ease, opacity 0.5s ease';

   
  const previewWidth = 125;
  bookElement.style.left = `${homeLeft}px`;
  bookElement.style.top = `${homeTop}px`;
  bookElement.style.width = `${previewWidth}px`;
  bookElement.style.height = `${previewWidth * 1.414}px`;


  renderer.domElement.style.transition = 'filter 1s ease';
  renderer.domElement.style.filter = 'blur(0px)';

  
  setTimeout(() => {
    if (bookElement) {
      bookElement.style.opacity = '0';
      bookElement.style.pointerEvents = 'none';
    }

    bookIsOpening = false;
  }, 900);

}



function showBirthdayCakeFromSign() {
  // Prevent duplicate triggers
  if (
    document.getElementById('birthday-cake-ending') ||
    window.birthdayEndingRunning
  ) {
    return;
  }

  window.birthdayEndingRunning = true;

  // Draw the cake illustration on a canvas
  const cakeCanvas = document.createElement('canvas');
  cakeCanvas.width = 512;
  cakeCanvas.height = 512;

  const ctx = cakeCanvas.getContext('2d');

  ctx.clearRect(0, 0, 512, 512);

  // Soft shadow
  ctx.fillStyle = '#ead6d2';
  ctx.beginPath();
  ctx.ellipse(256, 390, 145, 25, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bottom cake layer
  ctx.fillStyle = '#f4a7b9';
  ctx.beginPath();
  ctx.moveTo(115, 270);
  ctx.lineTo(397, 270);
  ctx.lineTo(380, 365);
  ctx.quadraticCurveTo(256, 405, 132, 365);
  ctx.closePath();
  ctx.fill();

  // Cream on bottom layer
  ctx.strokeStyle = '#fff6e9';
  ctx.lineWidth = 16;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(115, 270);
  ctx.bezierCurveTo(160, 295, 190, 255, 230, 278);
  ctx.bezierCurveTo(270, 300, 300, 255, 340, 278);
  ctx.quadraticCurveTo(370, 290, 397, 270);
  ctx.stroke();

  // Top layer
  ctx.fillStyle = '#f9d9df';
  ctx.beginPath();
  ctx.moveTo(155, 195);
  ctx.lineTo(357, 195);
  ctx.lineTo(345, 280);
  ctx.quadraticCurveTo(256, 310, 167, 280);
  ctx.closePath();
  ctx.fill();

  // Top cream
  ctx.strokeStyle = '#fffaf0';
  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.moveTo(155, 195);
  ctx.bezierCurveTo(195, 215, 215, 185, 250, 200);
  ctx.bezierCurveTo(285, 215, 315, 185, 357, 195);
  ctx.stroke();

  // Candles
  const candleColors = ['#b9d8ed', '#c6b4e8', '#b9d8ed'];
  [215, 256, 297].forEach((x, i) => {
    ctx.fillStyle = candleColors[i];
    ctx.fillRect(x - 7, 125, 14, 72);

    ctx.fillStyle = '#f5ad55';
    ctx.beginPath();
    ctx.moveTo(x, 88);
    ctx.bezierCurveTo(x - 27, 112, x - 12, 126, x, 128);
    ctx.bezierCurveTo(x + 15, 119, x + 22, 105, x, 88);
    ctx.fill();
  });

  const cakeTexture = new THREE.CanvasTexture(cakeCanvas);
  cakeTexture.colorSpace = THREE.SRGBColorSpace;

  const cakeMaterial = new THREE.MeshBasicMaterial({
    map: cakeTexture,
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false
  });

  const cakeGeometry = new THREE.PlaneGeometry(1.35, 1.35);
  const cakePlane = new THREE.Mesh(cakeGeometry, cakeMaterial);

  cakePlane.name = 'birthday-cake-ending';
  cakePlane.userData.isBirthdayCake = true;

  // Attach the cake to the computer, so it follows its rotation
  // Lower and slightly shrink the cake on the computer screen
cakePlane.position.set(0, 3.0, 1.02);
cakePlane.scale.set(0.65, 0.65, 1);
cakePlane.renderOrder = 30;
  cakePlane.renderOrder = 10;
  computer.add(cakePlane);

  // Fade in on the computer screen
  cakeMaterial.opacity = 0;

  const fadeStart = performance.now();
  const fadeDuration = 700;

  function fadeCakeIn(now) {
    if (!cakePlane.parent) return;

    const progress = Math.min((now - fadeStart) / fadeDuration, 1);
    cakeMaterial.opacity = progress;

    if (progress < 1) {
      requestAnimationFrame(fadeCakeIn);
    }
  }

  requestAnimationFrame(fadeCakeIn);

  // Keep the cake visible; the video function handles the transition.
  playBirthdayEndingVideo();
}


/* ---------- Cake Sign Click Detection ---------- */

const cakeSignRaycaster = new THREE.Raycaster();
const cakeSignPointer = new THREE.Vector2();
let cakeSignPointerStart = null;

renderer.domElement.addEventListener('pointerdown', (event) => {
  cakeSignPointerStart = {
    x: event.clientX,
    y: event.clientY
  };
});

renderer.domElement.addEventListener('pointerup', (event) => {
  if (!cakeSignPointerStart) return;

  const dx = event.clientX - cakeSignPointerStart.x;
  const dy = event.clientY - cakeSignPointerStart.y;
  cakeSignPointerStart = null;

  // Ignore scene rotation gestures
  if (Math.hypot(dx, dy) > 5) return;

  // Do not trigger the cake while the zine is enlarged
  // Only block the cake sign while the zine is actually open.
if (bookElement && bookElement.style.opacity !== '0') {
  return;
}

  const rect = renderer.domElement.getBoundingClientRect();

  cakeSignPointer.x =
    ((event.clientX - rect.left) / rect.width) * 2 - 1;

  cakeSignPointer.y =
    -((event.clientY - rect.top) / rect.height) * 2 + 1;

  cakeSignRaycaster.setFromCamera(cakeSignPointer, camera);

  const hits = cakeSignRaycaster.intersectObject(cakeSignFace);

  if (hits.length > 0) {
    showBirthdayCakeFromSign();
  }
});

// Prevent hand gestures and repeated cake clicks during the ending sequence
let endingSequenceActive = false;

function playBirthdayEndingVideo() {
    // Do not start the ending sequence more than once
  if (endingSequenceActive) return;

  endingSequenceActive = true;
  // Wait 2 seconds after the cake appears
  setTimeout(async () => {
    const endingVideo = document.createElement('video');

    endingVideo.src = '/birthday-ending.mp4.mov';
    endingVideo.preload = 'auto';
    endingVideo.playsInline = true;
    endingVideo.autoplay = false;
    endingVideo.controls = false;
    endingVideo.muted = false;
    endingVideo.volume = 1;

    // Prepare the video before displaying it
    endingVideo.load();

    const videoTexture = new THREE.VideoTexture(endingVideo);
    videoTexture.colorSpace = THREE.SRGBColorSpace;

    const endingVideoMaterial = new THREE.MeshBasicMaterial({
      map: videoTexture,
      toneMapped: false,
      side: THREE.FrontSide
    });

    // Place the video directly on the computer's screen
    const endingVideoScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(2.55, 1.82),
      endingVideoMaterial
    );

    endingVideoScreen.position.set(0, 3.48, 0.995);
    endingVideoScreen.renderOrder = 20;
    computer.add(endingVideoScreen);

    // Black screen: same size and position, slightly in front
    const endingBlackMaterial = new THREE.MeshBasicMaterial({
      color: 0x000000,
      toneMapped: false
    });

    const endingBlackScreen = new THREE.Mesh(
      new THREE.PlaneGeometry(2.55, 1.82),
      endingBlackMaterial
    );

    endingBlackScreen.position.set(0, 3.48, 1.005);
    endingBlackScreen.renderOrder = 21;
    endingBlackScreen.visible = false;
    computer.add(endingBlackScreen);

    // Hide the usual computer-screen overlays while the video plays
    webcamScreen.visible = false;
    birthdayScreen.visible = false;
    enterScreen.visible = false;

    

    try {
      await endingVideo.play();
      console.log('Birthday ending video is playing.');
    } catch (error) {
      console.error(
        'Could not play the ending video. Check its path and browser playback permissions:',
        error
      );

      // Restore the webcam if playback cannot start
      computer.remove(endingVideoScreen);
      computer.remove(endingBlackScreen);
      videoTexture.dispose();
      endingVideoMaterial.dispose();
      endingBlackMaterial.dispose();
      endingVideo.remove();

      webcamScreen.visible = true;
endingSequenceActive = false;
window.birthdayEndingRunning = false;
birthdayMessageActive = false;
return;
    }

    // When the video finishes, black out only the computer screen
    
    
    endingVideo.addEventListener('ended', () => {
  // Find the 3D cake attached to the computer
  const cakePlane = computer.getObjectByName(
    'birthday-cake-ending'
  );

  // Fade out the cake only after the video has ended
  if (cakePlane) {
    const cakeMaterial = cakePlane.material;
    const fadeStart = performance.now();
    const fadeDuration = 700;
    const initialOpacity = cakeMaterial.opacity;

    function fadeCakeOut(now) {
      const progress = Math.min(
        (now - fadeStart) / fadeDuration,
        1
      );

      cakeMaterial.opacity = initialOpacity * (1 - progress);

      if (progress < 1) {
        requestAnimationFrame(fadeCakeOut);
      } else {
        computer.remove(cakePlane);
        cakeMaterial.map?.dispose();
        cakeMaterial.dispose();
        cakePlane.geometry.dispose();
      }
    }

    requestAnimationFrame(fadeCakeOut);
  }
      endingVideoScreen.visible = false;
      endingBlackScreen.visible = true;

      // Keep the computer screen black for 2 seconds
      setTimeout(() => {
        computer.remove(endingVideoScreen);
        computer.remove(endingBlackScreen);

        videoTexture.dispose();
        endingVideoMaterial.dispose();
        endingBlackMaterial.dispose();

        endingVideo.pause();
        endingVideo.removeAttribute('src');
        endingVideo.load();
        endingVideo.remove();

        // Restore the live webcam feed
        webcamScreen.visible = true;
        birthdayScreen.visible = false;
        enterScreen.visible = false;

        console.log('Webcam restored.');
        
        // The entire birthday ending sequence has finished.
// Allow hand gestures and cake-sign clicks again.
endingSequenceActive = false;
window.birthdayEndingRunning = false;
birthdayMessageActive = false;

console.log('Birthday ending sequence finished. Ready again!');
      }, 2000);
    }, { once: true });

  }, 2000);
}



/* ---------- ENTER Button Click ---------- */

const enterRaycaster = new THREE.Raycaster();
const enterPointer = new THREE.Vector2();

let enterPointerStart = null;

renderer.domElement.addEventListener('pointerdown', (event) => {
  enterPointerStart = {
    x: event.clientX,
    y: event.clientY
  };
});

renderer.domElement.addEventListener('pointerup', (event) => {
  if (!enterPointerStart || !enterScreen.visible) {
    enterPointerStart = null;
    return;
  }

  const dx = event.clientX - enterPointerStart.x;
  const dy = event.clientY - enterPointerStart.y;

  enterPointerStart = null;

  // Ignore drags used to rotate the computer
  if (Math.hypot(dx, dy) > 5) return;

  const rect = renderer.domElement.getBoundingClientRect();

  enterPointer.x =
    ((event.clientX - rect.left) / rect.width) * 2 - 1;

  enterPointer.y =
    -((event.clientY - rect.top) / rect.height) * 2 + 1;

  enterRaycaster.setFromCamera(enterPointer, camera);

  const hits = enterRaycaster.intersectObject(enterScreen);

  if (hits.length > 0) {
    showBookPreview();
  }
});


// ---------- Drag to Rotate the Whole Scene ----------
let dragging = false;
let previousX = 0;
let previousY = 0;

renderer.domElement.addEventListener('pointerdown', (event) => {
  dragging = true;
  previousX = event.clientX;
  previousY = event.clientY;
  renderer.domElement.style.cursor = 'grabbing';
  renderer.domElement.setPointerCapture(event.pointerId);
});

renderer.domElement.addEventListener('pointermove', (event) => {
  if (!dragging) return;

  const dx = event.clientX - previousX;
  const dy = event.clientY - previousY;

  sceneGroup.rotation.y += dx * 0.006;
  sceneGroup.rotation.x += dy * 0.003;

  sceneGroup.rotation.x = THREE.MathUtils.clamp(
    sceneGroup.rotation.x,
    -0.22,
    0.22
  );

  previousX = event.clientX;
  previousY = event.clientY;
});

function stopDragging() {
  dragging = false;
  renderer.domElement.style.cursor = 'grab';
}

renderer.domElement.addEventListener('pointerup', stopDragging);
renderer.domElement.addEventListener('pointercancel', stopDragging);

// Scroll to zoom
renderer.domElement.addEventListener('wheel', (event) => {
  event.preventDefault();

  camera.position.z += event.deltaY * 0.008;
  camera.position.z = THREE.MathUtils.clamp(
    camera.position.z,
    9,
    19
  );
}, { passive: false });

// ---------- Animation ----------
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();

// ---------- Resize ----------
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
