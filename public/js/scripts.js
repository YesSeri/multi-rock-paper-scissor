const socket = io();

let firstPlayer = false;
let roomID;

const createGameButton = document.getElementById('createGameButton');
const joinGameButton = document.getElementById('joinGameButton');
const rockButton = document.getElementById('Rock')
const paperButton = document.getElementById('Paper')
const scissorButton = document.getElementById('Scissor')
const playAgainButton = document.getElementById('playAgainButton');
const acceptInviteButton = document.getElementById('acceptInviteButton');

const replayButtons = document.getElementsByClassName('replayButtons');
const choiceButtons = document.getElementsByClassName('choiceButtons');

for (el of choiceButtons) {
  console.log(el)
}
function inLobby() {
  createGameButton.addEventListener('click', function () {
    firstPlayer = true;
    const name = getNameFromInput('nameCreate')
    socket.emit('createGame', { name });
    waitRoom();
  });
  joinGameButton.addEventListener('click', function () {
    const name = getNameFromInput('nameJoin')
    roomID = document.getElementById('joinRoomInput').value;
    setRoomInfo(roomID)
    socket.emit('joinGame', { name, roomID });
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
socket.on('playAgainInvite', () => {
  playAgainButton.style.display = 'none';
  acceptInviteButton.style.display = 'inline-block';

})
socket.on('restartGame', () => {
  enableChoiceButtons()
  setMessage('Playing Again')
})

//Player 1 Joined
socket.on('player1Joined', (data) => { //Here the name of the oppnent is also recieved
  setMessage('Game has started')
  disableLobby()
  removeImportantMessage()
  enableGameRoom();
  // startGame()
});

//Player 2 Joined
socket.on('player2Joined', (data) => {
  setMessage('New player joined, game has started')
  disableLobby()
  removeImportantMessage()
  enableGameRoom();
  // startGame()
});

function disableLobby() {
  const container = document.getElementById('container');
  container.style.display = 'none';
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
    console.log(button)
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

function enableReplayButtons() {
  for (button of replayButtons) {
    button.style.display = 'none'
  }
}

function disableReplayButtons() {
  for (button of replayButtons) {
    button.style.display = 'none'
  }
}
socket.on('result', (data) => {
  setMessage(data.winnerMessage)
  playAgainButton.style.display = 'inline-block';
});

// socket.on('opponentDisconnected', () => {
//   setMessage('Opponent disconnected. Game over')
//   resetGame();
// })

// const resetGame = () => {
//   createGameButton.style.visibility = 'visible';
//   joinGameButton.style.visibility = 'visible';
// }


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