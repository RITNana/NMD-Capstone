// animation stuff
let fullFrames = 0;
const FULL_FRAMES_TO_CONFIRM = 12; // ~12 frames ≈ 200ms at 60fps
const DISMISS_DURATION = 600;

// video overlay
let taskVideo;

//png animation
let anim;


function preload() {
    
}


function setup() {
    createCanvas(980, 1728);
    textFont("system-ui");

    taskVideo = createVideo("../media/video/Monster_Glitch.mp4", () => {
        // make it autoplay-safe
        taskVideo.volume(0); // p5 wrapper volume
        taskVideo.elt.muted = true; // HTML video must be muted
        taskVideo.elt.setAttribute("muted", "");
        taskVideo.elt.setAttribute("playsinline", ""); // iOS Safari inline playback
        taskVideo.loop(); // or .play()
        taskVideo.hide(); // we’ll draw it to the canvas
    });
    taskVideo.hide();

    //png sequence test
    //anim = new pngAnimation('../media/BleedPNG', 81, 6)
    //anim.play();

}

function draw() {
    background(0);
    if (taskVideo) image(taskVideo, 0, 0, width, height);

    // draw PNG animation 
    if (anim) anim.draw(0, 0);
}


// ----- INTERACTION -----

// Fallback: if the browser still blocks it, a click will start playback
function mousePressed() {
    if (taskVideo && taskVideo.elt && taskVideo.elt.paused) {
        taskVideo.elt.muted = true; // ensure still muted
        taskVideo.play();
    }
}

//import from helper
const toggleFullscreen = fullscreen();

//make full screen
function doubleClicked() {
  toggleFullscreen(document.querySelector('canvas'));
}