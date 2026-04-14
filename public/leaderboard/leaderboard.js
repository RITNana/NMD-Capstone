////load data
////sort data
////parse through and format while inserting to html
//
//let monsterTypes = ["cat", "demon", "mummy", "lava", "spider", "wolf"];
//let monsterTypeNames = {
//    cat: "Noctris",
//    demon: "Vertex",
//    mummy: "Raveled",
//    lava: "Scortch",
//    spider: "Arachsy",
//    wolf: "Clawber"
//};
//let monsterType;
//
//async function loadLeaderboard() {
//    const response = await fetch('/score');
//    const data = await response.json();
//
//    const leaderboard = Object.entries(data).map(([id, session]) => {
//        const totalScore =
//            session.eyeScore +
//            session.headScore +
//            session.bleedingScore +
//            session.stomachScore;
//
//        return {
//            id,
//            monsterType: session.monsterType,
//            totalScore
//        };
//    })
//        .filter(entry => entry.totalScore > 0 && !isNaN(entry.totalScore));;
//
//    // Sort highest to lowest
//    leaderboard.sort((a, b) => b.totalScore - a.totalScore);
//
//    const top10 = leaderboard.slice(0, 10);
//
//    let top3 = document.getElementById("topThree");
//
//    top3.innerHTML = top10.slice(0, 3).map((entry, index) => `
//    <div class="leaderboard-entry">
//      <span>${index + 1}.  <img src="/media/monsters/${monsterTypes[entry.monsterType]}/good/good-head.png" alt="${monsterTypes[entry.monsterType]}" width="50" height="50"></span>
//      <span>${monsterTypeNames[monsterTypes[entry.monsterType]]}_${entry.id} Score: ${entry.totalScore}</span>
//    </div>
//  `).join('');
//
//
//    let leadBoard = document.getElementById("scores");
//
//    leadBoard.innerHTML = top10.slice(3, 10).map((entry, index) => `
//    <div class="leaderboard-entry">
//      <span>${index + 4}.  <img src="/media/monsters/${monsterTypes[entry.monsterType]}/good/good-head.png" alt="${monsterTypes[entry.monsterType]}" width="50" height="50"></span>
//      <span>${monsterTypeNames[monsterTypes[entry.monsterType]]}_${entry.id} Score: ${entry.totalScore}</span>
//    </div>
//  `).join('');
//}
//
//loadLeaderboard();

const monsterTypes = ["cat", "demon", "mummy", "lava", "spider", "wolf"];

const monsterTypeNames = {
  cat: "Noctris",
  demon: "Vertex",
  mummy: "Raveled",
  lava: "Scortch",
  spider: "Arachsy",
  wolf: "Clawber"
};

function getMonsterKey(monsterTypeIndex) {
  return monsterTypes[monsterTypeIndex] || "cat";
}

function getMonsterName(monsterTypeIndex) {
  const key = getMonsterKey(monsterTypeIndex);
  return monsterTypeNames[key] || "Unknown";
}

function getMonsterImage(monsterTypeIndex) {
  const key = getMonsterKey(monsterTypeIndex);
  return `/media/icons/${key}.png`;
}

//load data
//sort data
//parse through and format while inserting to html
let socket;
function setup() {
  socket = io();
  function SocketListeners() {
    socket.on("complete", () => {
      loadLeaderboard();
    });
  }
  SocketListeners();
}
async function loadLeaderboard() {
  try {
    const response = await fetch("/score");
    const data = await response.json();

    const leaderboard = Object.entries(data)
      .map(([id, session]) => {
        const eye = Number(session.eyeScore) || 0;
        const head = Number(session.headScore) || 0;
        const bleeding = Number(session.bleedingScore) || 0;
        const stomach = Number(session.stomachScore) || 0;

        const totalScore = eye + head + bleeding + stomach;

        return {
          id,
          monsterType: session.monsterType,
          totalScore
        };
      })
      .filter(entry => entry.totalScore > 0 && !Number.isNaN(entry.totalScore))
      .sort((a, b) => b.totalScore - a.totalScore)
      .slice(0, 10);

    renderTopThree(leaderboard.slice(0, 3));
    renderScoreList(leaderboard.slice(3, 10));
  } catch (error) {
    console.error("Failed to load leaderboard:", error);
    document.getElementById("topThree").innerHTML = "<p>Could not load leaderboard.</p>";
    document.getElementById("scores").innerHTML = "";
  }
}

function renderTopThree(topThreeData) {
  const topThree = document.getElementById("topThree");

  const podiumOrder = [
    topThreeData[1], // left
    topThreeData[0], // center
    topThreeData[2]  // right
  ];

  const classOrder = ["second", "first", "third"];
  const rankOrder = [2, 1, 3];

  topThree.innerHTML = podiumOrder
    .map((entry, i) => {
      if (!entry) return "";

      return `
        <article class="podium-card ${classOrder[i]}">
          <img
            class="podium-avatar"
            src="${getMonsterImage(entry.monsterType)}"
            alt="${getMonsterName(entry.monsterType)} avatar"
          />
          <div class="podium-base">

            <div class="podium-name">${getMonsterName(entry.monsterType)}_${entry.id}</div>
            <div class="podium-score">Score: ${entry.totalScore}</div>
          </div>
        </article>
      `;
    })
    .join("");
}

function renderScoreList(scoreData) {
  const scores = document.getElementById("scores");

  scores.innerHTML = scoreData
    .map((entry, index) => {
      const rank = index + 4;

      return `
        <article class="score-row">
          <div class="score-avatar-wrap">
            <img
              class="score-avatar"
              src="${getMonsterImage(entry.monsterType)}"
              alt="${getMonsterName(entry.monsterType)} avatar"
            />
          </div>
          <div class="score-main">
            ${rank}. ${getMonsterName(entry.monsterType)}_${entry.id}
          </div>
          <div class="score-meta">
            Score: ${entry.totalScore}
          </div>
        </article>
      `;
    })
    .join("");
}

loadLeaderboard();