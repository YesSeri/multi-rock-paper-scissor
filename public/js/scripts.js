const socket = io();

let firstPlayer = false;
let roomID;
let namePlayer1;
let namePlayer2;

// Gets all the buttons we will use. 
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
  // Creates a game if clicked, by moving you to the wait room, and emiting data about you to the server. 
  createGameButton.addEventListener('click', function () {
    const name = getNameFromInput('nameCreate')
    // Makes sure we fill out a name. 
    if (name) {
      firstPlayer = true;
      socket.emit('createGame', { name });
      waitRoom();
    } else {
      console.log("Name is empty. Please fill out to continue.")
    }
  });
  // Joins a game if clicked, by moving you to the wait room, and emiting data about you to the server. 
  joinGameButton.addEventListener('click', function () {
    const name = getNameFromInput('nameJoin')
    roomID = document.getElementById('joinRoomInput').value;
    if (name && roomID) {
      setRoomInfo(roomID)
      socket.emit('joinGame', { name, roomID });
    } else {
      console.log("Name or roomID is empty. Please fill out to continue.")
    }
  });
  function getNameFromInput(inputID) {
    return document.getElementById(inputID).value;
  }
}
// This is the first function run, because when you enter the web page the first thing that happens is you get to the lobby where you enter your name choose to create or join a game.
inLobby();

// When you create a room you have to wait for a player to join. This function takes care of that.
function waitRoom() {
  // Hides the lobby
  disableLobby();
  socket.on('newGame', (data) => { // name and roomID
    roomID = data.roomID
    setRoomInfo(roomID)
    setImportantMessage();
    setMessage(`Hello, ${data.name}! Ask your friend to enter the game ID: ${data.roomID}`)
  });
}

// Sets the name of the room so you can see it. 
function setRoomInfo(roomID) {
  document.getElementById('roomNameInfo').innerHTML = "Room: " + roomID;
}

// Sets message
function setMessage(text) {
  const message = document.getElementById('message')
  message.display = "inline-block"
  message.innerText = text
}
// Same message as setMessage, but used when in waitroom. Makes the text bigger.
function setImportantMessage() {
  const element = document.getElementById("message");
  element.classList.add("importantMessage");
}
function removeImportantMessage() {
  const element = document.getElementById("message");
  element.classList.remove("importantMessage");
}

// Visible immediatly after round is over. Emits willingness to play again if pressed.
playAgainButton.addEventListener('click', function () {
  setMessage('Waiting for other player to accept.')
  playAgainButton.style.display = 'none';
  socket.emit('playAgain', { roomID });
})

// If opponent presses playAgain, the playAgain button gets changed to this button. If pressed you accept to play another round. 
acceptInviteButton.addEventListener('click', function () {
  acceptInviteButton.style.display = 'none';
  socket.emit('acceptInvite', { roomID });
})

// When both players have pressed playAgain and acceptInvite, a new round is initiated. The restartGame event is emitted from the server when it receives the acceptInvite event.
socket.on('restartGame', () => {
  enableChoiceButtons()
  setMessage('Play Again')
})

// Player 1 Joined
socket.on('player1Joined', (data) => { 
  setMessage('Game has started')
  setGlobalName(data.p1name, data.p2name)
  initiateScore(data);
  disableLobby()
  removeImportantMessage()
  enableGameRoom();
});

// Player 2 Joined
socket.on('player2Joined', (data) => {
  setMessage('New player joined, game has started')
  setNames(data.p1name, data.p2name)
  initiateScore(data);
  disableLobby()
  removeImportantMessage()
  enableGameRoom();
});

// Helper function that sets the names of the players
function setNames(p1name, p2name) {
  namePlayer1 = p1name
  namePlayer2 = p2name
}

// Gets the names of the players and sets the score to 0
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

// This event is recieved when both players have made a move and the result has been calculated by the server.
socket.on('result', (data) => {
  setMessage(data.winnerMessage)
  updateScore(data.scoreP1, data.scoreP2);
  enablePlayAgainButton()
});

// Sets the score to whatever the server says is the new score.
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

// If a opponent leaves, we leave the room too, with a small message saying the opponent left the game.
socket.on('opponentDisconnected', () => {
  setMessage('Opponent disconnected. Game over')
  console.log("Your opponent has disconnected. The game has been reset.")
  resetGame();
})

const resetGame = () => {
  const container = document.getElementById('container');
  container.classList.remove("hide");
  const gameContainer = document.getElementById('gameContainer');
  gameContainer.style.display = 'none';
  firstPlayer = false;
  roomID = null;
  namePlayer1 = null;
  namePlayer2 = null;
}

const buttonClicked = (choice) => {
  setMessage("Waiting for opponent to move.")
  makeChoice(choice)
  disableChoiceButtons();
}

// Listens for what attack we want to make. This function is run when the game room opens up.
function choiceButtonEventListeners() {
  rockButton.addEventListener('click', function () {
    buttonClicked('Rock')
  });
  paperButton.addEventListener('click', function () {
    buttonClicked('Paper')
  });
  scissorButton.addEventListener('click', function () {
    buttonClicked('Scissor')
  });
}

// If it is the creator who makes move we want to send it to the server so the server knows it was the creator who made this move and vice versa. 
// This is the one place where players could cheat. If playerOne makes a move, I could if I know how to use the dev tools then make a second fake playerOne move, and then make my own move. 
// I could set playerOne move to anything. If I want to stop this, I can simply give both players a small password they send to the server when making a move, and if the password is wrong, the move doesn't get made. 
// This could be something I implement in the future. 
const makeChoice = choice => {
  const choiceEvent = firstPlayer ? 'choicePlayerOne' : 'choicePlayerTwo'
  socket.emit(choiceEvent, {
    choice: choice,
    roomID: roomID
  });
}