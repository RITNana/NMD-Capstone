//handles game keybinds

//game callbacks for the keybinds
window.keyCallbacks = function (socket) {
    return {
        setNewTask: (task) => { newTask = task; },
        banishTask: (task) => { banish = task; },
        incrementTask: (taskName, amount = 0.1) => {
            switch (taskName) {
                case "brain": stations.brain.progress += amount; break;
                case "eyeball": stations.eyeball.progress += amount; break;
                case "bleeding": stations.bleeding.progress += amount; break;
                case "tummy": stations.tummy.progress += amount; break;
                case "bleedEye":
                    stations.bleedEye.partProgress.bleeding += amount;
                    stations.bleedEye.partProgress.eyeball += amount;
                    break;
                case "brainTummy":
                    stations.brainTummy.partProgress.brain += amount;
                    stations.brainTummy.partProgress.tummy += amount;
                    break;
            }
        },
        startLoop: (loopNumber) => { //For gameloops
            createNewSession();
            currentLoop = loopNumber;
            gameIndex = 0;
            useGameLoop = true;
            gameOver = false;
            currentTasks.length = 0;
            activeTaskCount = 0;
            newTask = "";
            otherNewTask = "";
            window.gameTimer.init(currentSession, socket, finalVid, playFinalVid, playSound);

            if (loopNumber === 1) gameLoop1(activeTaskCount);
            if (loopNumber === 2) gameLoop2(activeTaskCount);
            if (loopNumber === 3) gameLoop3(activeTaskCount);

            socket.emit("refresh", currentSession);
        },
        manualControl: () => { //For manual control
            currentLoop = 0;
            gameIndex = 0;
            useGameLoop = false;
        }
        //   manualDaisyTask: () => {
        //   daisy.useDaisy = true;
        //   daisy.daisyTask = "bleeding";
        //   daisy.endTask = "eyeball";
        //   stations.bleedEye.inputDelay = true;
        //   console.log("Daisy task activated!");
        // }
    }

}

//set keybinds
window.setKeyBinds = function (socket) {
    const callbacks = window.keyCallbacks(socket);
    addEventListener("keydown", (e) => {

        //These bring in new tasks
        if (e.key == "w") callbacks.setNewTask("brain");
        if (e.key == "e") callbacks.setNewTask("eyeball");
        if (e.key == "q") callbacks.setNewTask("bleeding");
        if (e.key == "r") callbacks.setNewTask("tummy");
        if (e.key == "t") callbacks.setNewTask("bleedEye");
        if (e.key == "4") callbacks.setNewTask("brainTummy");

        //these atomize task from the list
        if (e.key == "s") banish = "brain";
        if (e.key == "d") banish = "eyeball";
        if (e.key == "a") banish = "bleeding";
        if (e.key == "f") banish = "tummy";
        if (e.key == "g") banish = "bleedEye";
        if (e.key == "5") banish = "brainTummy";

        // these fill out the bar of a given task
        // if (e.key == "s") callbacks.incrementTask("brain");
        // if (e.key == "d") callbacks.incrementTask("eyeball");
        // if (e.key == "a") callbacks.incrementTask("bleeding");
        // if (e.key == "f") callbacks.incrementTask("tummy");
        // if (e.key == "g") callbacks.incrementTask("bleedeye");
        // if (e.key == "5") callbacks.incrementTask("brainTummy");

        //reset all pins on a given station
        //these get sent to index.js
        if (e.key == "x") socket.emit("brain", "reset");
        if (e.key == "c") socket.emit("eyeball", "reset");
        if (e.key == "z") socket.emit("bleeding", "reset");
        if (e.key == "v") socket.emit("tummy", "reset");
        if (e.key == "b") socket.emit("heart", "reset");

        //increment LEFT light threshold
        if (e.key == "7") socket.emit("brain", "leftInc");
        if (e.key == "8") socket.emit("eyeball", "leftInc");
        if (e.key == "6") socket.emit("bleeding", "leftInc");
        if (e.key == "9") socket.emit("tummy", "leftInc");
        if (e.key == "0") socket.emit("heart", "leftInc");

        //decrement LEFT light threshold
        if (e.key == "u") socket.emit("brain", "leftDec");
        if (e.key == "i") socket.emit("eyeball", "leftDec");
        if (e.key == "y") socket.emit("bleeding", "leftDec");
        if (e.key == "o") socket.emit("tummy", "leftDec");
        if (e.key == "p") socket.emit("heart", "leftDec");

        //increment RIGHT light threshold
        if (e.key == "j") socket.emit("brain", "rightInc");
        if (e.key == "k") socket.emit("eyeball", "rightInc");
        if (e.key == "h") socket.emit("bleeding", "rightInc");
        if (e.key == "l") socket.emit("tummy", "rightInc");
        if (e.key == ";") socket.emit("heart", "rightInc");

        //decrement RIGHT light threshold
        if (e.key == "m") socket.emit("brain", "rightDec");
        if (e.key == ",") socket.emit("eyeball", "rightDec");
        if (e.key == "n") socket.emit("bleeding", "rightDec");
        if (e.key == ".") socket.emit("tummy", "rightDec");
        if (e.key == "/") socket.emit("heart", "rightDec");

        //game loop
        if (e.key === "1") callbacks.startLoop(1);
        if (e.key === "2") callbacks.startLoop(2);
        if (e.key === "`") callbacks.startLoop(3);
        if (e.key === "3") callbacks.manualControl();
        // if (e.key === "4") callbacks.manualDaisyTask();
    });
}