// png animation helper

//IN PROGRESS

window.pngAnimation = class {
    constructor(folderPath, frameNums, frameRate = 8) {
        this.frames = [];
        this.frameNums = frameNums;
        this.frameRate = frameRate;
        this.playing = false;
        this.startTime = 0;
        this.currentFrame = 0;

        //preload frames
        for (let i = 0; i < frameNums; i++) {
            const path = `${folderPath}/${i}.png`;
            this.frames.push(loadImage(path));
        }

        console.log("Loaded frames:", this.frames.length);
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
    draw(x, y) {
        if (!this.playing || this.frames.length === 0) return;

        const elapsed = millis() - this.startTime;
        const frameLength = 1000 / this.frameRate;

        const newFrame = Math.floor(elapsed / frameLength);

        // loop 
        this.currentFrame = newFrame % this.frameNums;
        console.log(this.currentFrame);

        image(this.frames[this.currentFrame], x, y);
    }
}