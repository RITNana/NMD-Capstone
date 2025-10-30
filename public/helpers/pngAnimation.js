// png animation helper

//IN PROGRESS

window.pngAnimation = class {
    constructor(folderPath, frameNums, frameRate = 12){
        this.frames = [];
        this.frameNums = frameNums;
        this.frameRate = frameRate;
        this.playing = false;
        this.startTime = 0;
        this.currentFrame = 0;

        //preload frames
        for (let i = 0; i < frameNums; i++) {
            const path = `${folderPath}/frame${i}.png`;
            this.frames.push(loadImage(path));
        }
    }

    //start animation
    play() {
        this.playing = true;
        this.startTime = millis();
    }

    //stop animation
    stop() {
        this.playing = false;
    }

    // draw animation
    draw(x, y, w, h){
        if (!this.playing || this.frames.length === 0) return;

        const elapsed = millis() - this.startTime;

        this.curretFrame = Math.floor(elapsed / (1000 / this.frameRate));

        image(this.frames[this.currentFrame], x, y, w, h);
    }
}