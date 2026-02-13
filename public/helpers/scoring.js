window.scoring = function (totalTaskTime) {
    let score = 0;
    let taskSum = 0;
    let multiplier;


    if (totalTaskTime > 0 && totalTaskTime <= 15) {
        score = int(random(45, 51))
        multiplier = int(random(6.0, 8.1))
        taskSum = score * multiplier
        console.log("Excellent! " + taskSum)
        return taskSum
    }
    else if (totalTaskTime > 15 && totalTaskTime <= 20) {
        score = int(random(35, 41))
        multiplier = int(random(3.0, 5.1))
        taskSum = score * multiplier
        console.log("Not too shabby " + taskSum)
        return taskSum
    } else if (totalTaskTime > 20 && totalTaskTime <= 24) {
        score = int(random(30, 36))
        multiplier = int(random(1.5, 3.1))
        taskSum = score * multiplier
        console.log("You can do better " + taskSum)
        return taskSum
    } else if (totalTaskTime >= 25) {
        score = 25
        taskSum = score
        print("Are you even trying? " + taskSum)
        return taskSum
    }
}

