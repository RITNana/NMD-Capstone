//handles all the video functions

//initialize
window.initVideos = function () {
    // taskVideo.volume(0);
    // taskVideo.elt.muted = true;
    // taskVideo.elt.setAttribute("playsinline", "");
    // taskVideo.loop();
    // taskVideo.hide();

    finalVid.volume(0);
    finalVid.elt.muted = true;
    finalVid.elt.setAttribute("playsinline", "");
    finalVid.hide();
    finalVid.elt.onended = () => finalVidOver = true;
}

let finalVid;
let finalVidPlay = false;
let finalVidOver = false;

//handles when final video plays
window.playFinalVid = function () {
    useGameLoop = false;
    gameOver = true;
    finalVidPlay = true;
    finalVidOver = false;

    //rewind vid
    finalVid.time(0);
    finalVid.play();
}

//draw the videos
window.drawVideo = function (video = "task") {
    if (video === "final") {
        if (finalVidPlay) image(finalVid, 0, 0, width, height);
    } 
    // else {
    //     if (taskVideo) image(taskVideo, 0, 0, width, height);
    // }
};
