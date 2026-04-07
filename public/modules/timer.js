//handles the game timer

window.gameTimer = function () {
    let gameTime = 120000; //two minutes
    let gameTimeStart = 0;
    let gameOver = false;
    let useGameLoop = false;

    let currentSession = "";
    let socket = null;
    let finalVid = null;
    let playFinalVidCallback = null;
    let playSoundCallback = null;

    function init(sessionId, sock, finalVideo, playFinal, playSound) {
        currentSession = sessionId;
        socket = sock;
        finalVid = finalVideo;
        playFinalVidCallback = playFinal;
        playSoundCallback = playSound;
        gameTimeStart = millis();
        gameOver = false;
        useGameLoop = true;
    }

    function update(font) {
        if (gameOver || !useGameLoop) return;

        let elapsed = millis() - gameTimeStart;
        let remainTime = max(0, gameTime - elapsed);

        let minutes = floor(remainTime / 60000);
        let seconds = floor((remainTime % 60000) / 1000);

        //format to minutes:seconds
        let timeText = minutes + ':' + nf(seconds, 2);

        //display
        textSize(45);
        textAlign(LEFT, CENTER);
        textFont(font);
        fill(225);
        text(timeText, 167, 49);

        // for game over
        if (remainTime <= 0 && !gameOver) {
            gameOver = true;
            useGameLoop = false;

            //stop tasks
            currentTasks.length = 0;
            visibleTasks.length = 0;

            //tell server GAME OVER
            if (socket) socket.emit("complete", currentSession);

            //play final screen
            if (playFinalVidCallback) playFinalVidCallback();
            if (playSoundCallback) playSoundCallback("taskOver");

            console.log("Ran out of time!")
        }
    }

    return { init, update, get gameOver() { return gameOver; }, get useGameLoop() { return useGameLoop; } };
}();