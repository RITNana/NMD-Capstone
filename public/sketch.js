// const { createVideo } = require("p5");

// public/sketch.js
let socket;

// mirrors Arduino thresholds
const thresholds = [10, 20, 30];

// latest charge number from serial
let chargeNum = 0;

// led states computed from chargeNum (boolean)
let leds = [false, false, false];

// variable to hold task video

// colors for the three LEDs (R,G,B)
const ledColors = [
  [255, 70, 70], // red
  [255, 190, 60], // amber
  [60, 220, 100], // green
];

let taskVideo;
let bleedingBar;

const barX = 261; // adjust these to fit your PNG
const barY = 153;
const barW = 170;
const barH = 15;
let displayedProgress = 0;

// slide + fade state
let taskVisible = true;
let dismissing = false;
let dismissStartMs = 0;
let taskOffsetX = 0; // how far we've translated the task to the right
let taskFade = 1; // 1 = fully opaque, 0 = invisible

// completion detection (avoid one-frame spikes)
let fullFrames = 0;
const FULL_FRAMES_TO_CONFIRM = 12; // ~12 frames ≈ 200ms at 60fps

// animation tuneables
const DISMISS_DURATION = 600;

let veinStatus = "";

function preload() {
  bleedingBar = loadImage("media/BleedingBar.png");
}

function setup() {
  createCanvas(720, 400);
  textFont("system-ui");

  taskVideo = createVideo("media/Background.mp4", () => {
    // make it autoplay-safe
    taskVideo.volume(0); // p5 wrapper volume
    taskVideo.elt.muted = true; // HTML video must be muted
    taskVideo.elt.setAttribute("muted", "");
    taskVideo.elt.setAttribute("playsinline", ""); // iOS Safari inline playback
    taskVideo.loop(); // or .play()
    taskVideo.hide(); // we’ll draw it to the canvas
  });
  taskVideo.loop();
  taskVideo.hide();
}

// same-origin socket.io
socket = io();

socket.on("bleeding-data", (payload) => {   //NTS Need to copy this so that bleeding-data, brain-data, & whatever else does it
  // Accept BOTH styles:
  // 1) object: { light: "ON"|"OFF", charge: number }
  // 2) legacy string: "ON 17" / "OFF 12" / or even just "17"
  let light = "";
  let charge = NaN;

  if (payload && typeof payload === "object" && "charge" in payload) {
    // new structured payload
    light = String(payload.light || "").trim();
    charge = Number(payload.charge);
  } else {
    // legacy string fallback
    const s = String(payload).trim();            // e.g. "ON 17" or "17"
    const parts = s.split(/\s+/);
    if (parts.length === 1) {
      // just a number
      charge = parseInt(parts[0], 10);
    } else {
      // "ON 17" style
      light = parts[0];
      charge = parseInt(parts[1], 10);
    }
  }

  if (!Number.isFinite(charge)) return;

  // update model
  chargeNum = charge;
  leds[0] = chargeNum > thresholds[0];
  leds[1] = chargeNum > thresholds[1];
  leds[2] = chargeNum > thresholds[2];

  // ✅ show user a clear “light connected” hint
  // (you’re printing "ON " / "OFF " from Arduino)
  veinStatus = (light === "ON") ? "Connected" : "";

});

// Remove the old misuse of 'connect' for light status:
// socket.on("connect", (lightStatus) => { ... })  // ❌ delete this


//socket = io();
//
//socket.on("serial-data", (payload) => {
//  // expect a line with a number, e.g., "17"
//  const s = String(payload).trim();
//  const match = s.match(/-?\d+/);
//  if (!match) return;
//
//  const val = parseInt(match[0], 10);
//  if (!Number.isFinite(val)) return;
//
//  chargeNum = val;
//
//  // update LED states EXACTLY like Arduino
//  leds[0] = chargeNum > thresholds[0];
//  leds[1] = chargeNum > thresholds[1];
//  leds[2] = chargeNum > thresholds[2];
//
//  // mirror to debug div
//  const el = document.getElementById("value-verification");
//  if (el) {
//    el.textContent =
//      `chargeNum=${chargeNum} | LED1=${leds[0] ? "ON" : "OFF"} ` +
//      `LED2=${leds[1] ? "ON" : "OFF"} LED3=${leds[2] ? "ON" : "OFF"}`;
//  }
//});


function draw() {
  background(246);

  // background video stays put
  if (taskVideo) image(taskVideo, 0, 0, width, height);

  // compute progress and smooth it
  const target = ledProgress(chargeNum, thresholds);
  displayedProgress = lerp(displayedProgress, target, 0.1);

  //textSize(20);
  //textStyle(BOLD);
  //noStroke();
  //fill(veinStatus.startsWith("Connected") ? "white" : "red");
  //text(`${veinStatus}`, 440, 165);

  // detect "finished" (progress basically 100%) with a small hold
  if (!dismissing && taskVisible) {
    if (displayedProgress >= 0.995) {
      fullFrames++;
      if (fullFrames >= FULL_FRAMES_TO_CONFIRM) {
        dismissing = true;
        dismissStartMs = millis();
      }
    } else {
      fullFrames = 0;
    }
  }

  // run the slide+fade animation
  if (dismissing) {
    const t = constrain((millis() - dismissStartMs) / DISMISS_DURATION, 0, 1);
    // ease-out: fast at start, slow at end
    const e = 1 - pow(1 - t, 3);
    taskOffsetX = e * (width + 48); // push fully off-right
    taskFade = 1 - e; // fade to 0

    if (t >= 1) {
      dismissing = false;
      taskVisible = false; // stop drawing the overlay
      taskFade = 0;
      veinStatus = "";
    }
  }

  if (taskVisible || dismissing) {
    push();
    translate(taskOffsetX, 0);
    textSize(20);
    textStyle(BOLD);
    noStroke();
    // fade with taskFade
    const alpha = 255 * taskFade;
    fill(veinStatus.startsWith("Connected") ? color(255, 255, 255, alpha)
      : color(255, 0, 0, alpha));
    text(`${veinStatus}`, 440, 165);
    pop();
  }


  // draw the task overlay (progress fill + PNG frame) if visible/animating
  if (taskVisible || dismissing) {
    push();
    translate(taskOffsetX, 0);

    // progress fill under the PNG, faded with taskFade
    noStroke();
    fill(201, 22, 22, 220 * taskFade);
    rect(barX, barY, barW * displayedProgress, barH);

    // PNG container on top, tinted for fade
    tint(255, 255 * taskFade);
    image(bleedingBar, 0, 0, width, height);
    noTint();

    pop();
  }
}

//function draw() {
//  background(246);
//  if (taskVideo) image(taskVideo, 0, 0, width, height);
//
//  // target progress based on thresholds/LEDs
//  const target = ledProgress(chargeNum, thresholds);
//
//  // optional smoothing to avoid jitter (0.1 = follow speed)
//  displayedProgress = lerp(displayedProgress, target, 0.1);
//
//  // fill rectangle
//  noStroke();
//  fill(201, 22, 22, 220);
//  rect(barX, barY, barW * displayedProgress, barH);
//
//  // overlay frame last
//  image(bleedingBar, 0, 0, width, height);
//
//}

// Map chargeNum to progress in 3 equal segments that line up with the LEDs
function ledProgress(charge, th = thresholds) {
  const t0 = th[0],
    t1 = th[1],
    t2 = th[2];

  if (charge <= 0) return 0;

  if (charge <= t0) {
    // first third
    const seg = charge / t0; // 0..1 within [0..t0]
    return (1 / 3) * seg;
  } else if (charge <= t1) {
    // second third
    const seg = (charge - t0) / (t1 - t0); // 0..1 within (t0..t1]
    return 1 / 3 + (1 / 3) * seg;
  } else {
    // last third (cap at full)
    const seg = (charge - t1) / (t2 - t1); // 0..1 within (t1..t2]
    return Math.min(2 / 3 + (1 / 3) * seg, 1);
  }
}

// Fallback: if the browser still blocks it, a click will start playback
function mousePressed() {
  if (taskVideo && taskVideo.elt && taskVideo.elt.paused) {
    taskVideo.elt.muted = true; // ensure still muted
    taskVideo.play();
  }
}

//make full screen
function doubleClicked() {
  //get the canvas
  const vid = document.querySelector('canvas');

  if (!document.fullscreenElement) {
    if (vid.requestFullscreen) {
      vid.requestFullscreen();
    }

  } else {
    //exit fullscreen
    if (document.exitFullscreen) {
      document.exitFullscreen();
    }

  }
}

//background color change for full screen
function updateFullscreenBG() {
  if (document.fullscreenElement) {
    document.body.style.backgroundColor = "#000000FF";
  } else {
    document.body.style.backgroundColor = "#FFFFFFFF";
  }
}

//event listener
document.addEventListener("fullscreenchange", updateFullscreenBG);

//on load
updateFullscreenBG();