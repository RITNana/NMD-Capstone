window.scoring = function (totalTaskTime) {
    let randomAdd = 0;
    let taskSum = 0;
    let multiplier;


    if (totalTaskTime > 0 && totalTaskTime <= 15) {
        randomAdd = int(random(0, 15));
        //multiplier = int(random(6.0, 8.1))
        taskSum = randomAdd + score;
        console.log("Excellent! " + taskSum);
        return taskSum;
    }
    else if (totalTaskTime > 15 && totalTaskTime <= 20) {
        randomAdd = int(random(0, 15))
        //multiplier = int(random(3.0, 5.1))
        taskSum = randomAdd + score;
        console.log("Not too shabby " + taskSum);
        return taskSum;
    } else if (totalTaskTime > 20 && totalTaskTime <= 24) {
        randomAdd = int(random(0, 15))
        //multiplier = int(random(1.5, 3.1))
        taskSum = randomAdd + score;
        console.log("You can do better " + taskSum);
        return taskSum;
    } else if (totalTaskTime >= 25) {
        score = 100;
        randomAdd = int(random(0, 15));
        taskSum = randomAdd + score;
        print("Are you even trying? " + taskSum);
        return taskSum;
    }
}

