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

function setup() {
  createCanvas(720, 300);
  textFont("system-ui");

  taskVideo = createVideo("media/Background.mp4");
  taskVideo.loop();
  taskVideo.hide();
}

// same-origin socket.io
socket = io();

socket.on("serial-data", (payload) => {
  // expect a line with a number, e.g., "17"
  const s = String(payload).trim();
  const match = s.match(/-?\d+/);
  if (!match) return;

  const val = parseInt(match[0], 10);
  if (!Number.isFinite(val)) return;

  chargeNum = val;

  // update LED states EXACTLY like Arduino
  leds[0] = chargeNum > thresholds[0];
  leds[1] = chargeNum > thresholds[1];
  leds[2] = chargeNum > thresholds[2];

  // mirror to debug div
  const el = document.getElementById("value-verification");
  if (el) {
    el.textContent =
      `chargeNum=${chargeNum} | LED1=${leds[0] ? "ON" : "OFF"} ` +
      `LED2=${leds[1] ? "ON" : "OFF"} LED3=${leds[2] ? "ON" : "OFF"}`;
  }
});

function draw() {
  background(246);
  image(taskVideo, 0, 0, width, height);

  // title
  // noStroke();
  // fill(20);
  // textSize(18);
  // text("LED Emulation (from Arduino chargeNum)", 20, 28);

  // // draw three LEDs centered horizontally
  // const cx = width / 2;
  // const cy = 160;
  // const spacing = 140; // horizontal spacing
  // const radius = 54; // outer bulb size
  // const inner = 40; // inner core size

  // drawLED(
  //   cx - spacing,
  //   cy,
  //   radius,
  //   inner,
  //   leds[0],
  //   ledColors[0],
  //   "LED 1 (>10)"
  // );
  // drawLED(cx, cy, radius, inner, leds[1], ledColors[1], "LED 2 (>20)");
  // drawLED(
  //   cx + spacing,
  //   cy,
  //   radius,
  //   inner,
  //   leds[2],
  //   ledColors[2],
  //   "LED 3 (>30)"
  // );

  // //   // chargeNum readout
  // fill(30);
  // textSize(14);
  // text(`chargeNum: ${chargeNum}`, 20, height - 20);

  // function drawLED(x, y, rOuter, rInner, isOn, rgb, label) {
  //   push();

  //   //   // base socket shadow
  //   noStroke();
  //   fill(225);
  //   circle(x, y + 2, rOuter + 10);

  //   //   // outer housing
  //   fill(40);
  //   circle(x, y, rOuter);

  //   //   // glow when ON
  //   if (isOn) {
  //     const [r, g, b] = rgb;
  //     // halo (several translucent rings)
  //     for (let i = 1; i <= 6; i++) {
  //       const a = 80 - i * 12; // decreasing alpha
  //       fill(r, g, b, a);
  //       const rr = rInner + 18 + i * 12;
  //       ellipse(x, y, rr, rr);
  //     }
  //     //     // bright inner
  //     fill(r, g, b);
  //   } else {
  //     // off = dark inner
  //     fill(70);
  //   }

  //   //   // inner core
  //   circle(x, y, rInner);

  //   //   // label
  //   fill(35);
  //   textAlign(CENTER, TOP);
  //   textSize(13);
  //   text(`${label} — ${isOn ? "ON" : "OFF"}`, x, y + rOuter / 2 + 8);

  //   pop();
  // }
}
