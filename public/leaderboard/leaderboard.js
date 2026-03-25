//load data
//sort data
//parse through and format while inserting to html


async function loadLeaderboard() {
  const response = await fetch('/score');
  const data = await response.json();
  
  const leaderboard = Object.entries(data).map(([id, session]) => {
    const totalScore =
      session.eyeScore +
      session.headScore +
      session.bleedingScore +
      session.stomachScore;

    return {
      id,
      monsterType: session.monsterType,
      totalScore
    };
  })
  .filter(entry => entry.totalScore > 0 && !isNaN(entry.totalScore));;

  // Sort highest to lowest
  leaderboard.sort((a, b) => b.totalScore - a.totalScore);

  const top20 = leaderboard.slice(0, 20);

  let leadBoard = document.getElementById("scores");

  leadBoard.innerHTML = top20.map((entry, index) => `
    <div class="leaderboard-entry">
      <span>${index + 1}. Monster #${entry.monsterType}</span>
      <span>Score: ${entry.totalScore}</span>
    </div>
  `).join('');
}

loadLeaderboard();

//let leadBoard = document.getElementById("scores");

//sort original data - make a tree?
let sortBulk = () => {};

//sort new data
let sortNew = () => {};

//add in imgs of monster head to make a small thumbnail