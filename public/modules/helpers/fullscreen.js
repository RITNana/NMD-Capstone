// fullscreen helper

window.fullscreen = function() {
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
    updateFullscreenBG()

    return function toggleFullScreen(canvas) {
        if (!document.fullscreenElement) {
            canvas.requestFullscreen?.();
        } else {
            //exit fullscreen
            document.exitFullscreen?.();
        }
    };
}