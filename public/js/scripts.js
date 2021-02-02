const socket = io();

let firstPlayer = false;
let roomID;
let namePlayer1;
let namePlayer2;

const createGameButton = document.getElementById('createGameButton');
const joinGameButton = document.getElementById('joinGameButton');
const rockButton = document.getElementById('Rock')
const paperButton = document.getElementById('Paper')
const scissorButton = document.getElementById('Scissor')
const playAgainButton = document.getElementById('playAgainButton');
const acceptInviteButton = document.getElementById('acceptInviteButton');

const replayButtons = document.getElementsByClassName('replayButtons');
const choiceButtons = document.getElementsByClassName('choiceButtons');

function inLobby() {
  createGameButton.addEventListener('click', function () {
    if (namePlayer1) {
      firstPlayer = true;
      const name = getNameFromInput('nameCreate')
      socket.emit('createGame', { name });
      waitRoom();
    } else{
      console.log("Name is empty. Please fill out to continue.")
    }
  });
  joinGameButton.addEventListener('click', function () {
    if (namePlayer2 && roomID) {
      const name = getNameFromInput('nameJoin')
      roomID = document.getElementById('joinRoomInput').value;
      setRoomInfo(roomID)
      socket.emit('joinGame', { name, roomID });
    } else{
      console.log("Name or roomID is empty. Please fill out to continue.")
    }
  });
  function getNameFromInput(inputID) {
    return document.getElementById(inputID).value;
  }
}
inLobby();
function waitRoom() {
  disableLobby();
  socket.on('newGame', (data) => { // name and roomID
    roomID = data.roomID
    setRoomInfo(roomID)
    setImportantMessage();
    setMessage(`Hello, ${data.name}! Ask your friend to enter the game ID: ${data.roomID}`)
  });
}

function setRoomInfo(roomID) {
  document.getElementById('roomNameInfo').innerHTML = "Room: " + roomID;
}

function setMessage(text) {
  const message = document.getElementById('message')
  message.display = "inline-block"
  message.innerText = text
}
function setImportantMessage() {
  const element = document.getElementById("message");
  element.classList.add("importantMessage");
}
function removeImportantMessage() {
  const element = document.getElementById("message");
  element.classList.remove("importantMessage");
}

playAgainButton.addEventListener('click', function () {
  setMessage('Waiting for other player to accept.')
  playAgainButton.style.display = 'none';
  socket.emit('playAgain', { roomID });
})

acceptInviteButton.addEventListener('click', function () {
  acceptInviteButton.style.display = 'none';
  socket.emit('acceptInvite', { roomID });
})

socket.on('restartGame', () => {
  enableChoiceButtons()
  setMessage('Playing Again')
})

//Player 1 Joined
socket.on('player1Joined', (data) => { //Here the name of the oppnent is also recieved
  setMessage('Game has started')
  console.log(data)
  setGlobalName(data.p1name, data.p2name)
  initiateScore(data);
  disableLobby()
  removeImportantMessage()
  enableGameRoom();
  // startGame()
});

//Player 2 Joined
socket.on('player2Joined', (data) => {
  setMessage('New player joined, game has started')
  console.log(data)
  setGlobalName(data.p1name, data.p2name)
  initiateScore(data);
  disableLobby()
  removeImportantMessage()
  enableGameRoom();
  // startGame()
});
function setGlobalName(p1name, p2name) {
  namePlayer1 = p1name
  namePlayer2 = p2name
}

function initiateScore() {
  const score1 = document.getElementById('score1')
  const score2 = document.getElementById('score2')
  score1.innerText = `${namePlayer1}: 0`
  score2.innerText = `${namePlayer2}: 0`
}

function disableLobby() {
  const container = document.getElementById('container');
  container.classList.add("hide");

}

function enableGameRoom() {
  disableReplayButtons()
  choiceButtonEventListeners();
  enableChoiceButtons()
  enableGameContainer()
}
function enableGameContainer() {
  const gameContainer = document.getElementById('gameContainer');
  gameContainer.style.display = 'block';
}
function disableChoiceButtons() {
  for (button of choiceButtons) {
    button.classList.add("noHoverDisabled");
  }
}
function enableChoiceButtons() {
  const el = document.querySelectorAll(".noHoverDisabled")

  if (el.length === 0) return
  for (button of choiceButtons) {
    button.classList.remove("noHoverDisabled");
  }
}

function enablePlayAgainButton() {
  playAgainButton.style.display = 'inline-block'
}

function disableReplayButtons() {
  for (button of replayButtons) {
    button.style.display = 'none'
  }
}
socket.on('result', (data) => {
  setMessage(data.winnerMessage)
  updateScore(data.scoreP1, data.scoreP2);
  enablePlayAgainButton()
});


function updateScore(scoreP1, scoreP2) {
  const scoreOneSpan = document.getElementById('score1')
  const scoreTwoSpan = document.getElementById('score2')
  scoreOneSpan.innerText = `${namePlayer1}: ${scoreP1}`
  scoreTwoSpan.innerText = `${namePlayer2}: ${scoreP2}`
}

function enableAcceptInviteButton() {
  playAgainButton.style.display = 'none';
  acceptInviteButton.style.display = 'inline-block';
}
socket.on('playAgainInvite', () => {
  enableAcceptInviteButton()
})
socket.on('opponentDisconnected', () => {
  setMessage('Opponent disconnected. Game over')
  resetGame();
})

const resetGame = () => {
  const container = document.getElementById('container');
  container.classList.remove("hide");
  const gameContainer = document.getElementById('gameContainer');
  gameContainer.style.display = 'none';
}


const buttonClicked = (choice) => {
  setMessage("Waiting for opponent to move.")
  makeChoice(choice)
  disableChoiceButtons();
}
function choiceButtonEventListeners() {
  rockButton.addEventListener('click', function () {
    console.log('Click')
    buttonClicked('Rock')
  });
  paperButton.addEventListener('click', function () {
    console.log('Click')
    buttonClicked('Paper')
  });
  scissorButton.addEventListener('click', function () {
    console.log('Click')
    buttonClicked('Scissor')
  });

}
const makeChoice = choice => {
  const choiceEvent = firstPlayer ? 'choicePlayerOne' : 'choicePlayerTwo'
  socket.emit(choiceEvent, {
    choice: choice,
    roomID: roomID
  });
}