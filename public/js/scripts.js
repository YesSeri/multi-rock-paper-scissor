const socket = io();

const createGameButton = document.getElementById('createGameButton');
const joinGameButton = document.getElementById('joinGameButton');
const playAgainButton = document.getElementById('playAgainButton');
const acceptInviteButton = document.getElementById('acceptInviteButton');

const seeGameBox = () => {
  const container = document.getElementById('container');
  setMessage('Choose your input')
  container.style.display = 'none';
  const gameContainer = document.getElementById('gameContainer');
  gameContainer.style.display = 'block';
  document.getElementById('roomNameInfo').innerHTML = "You are in: room3";
}

let firstPlayer = false;
let myName = "";
let roomID;
socket.on('newGame', ({ roomID }) => {
  document.getElementById('roomNameInfo').innerHTML = roomID;
  setMessage(`Hello, ${myName}! Ask your friend to enter the game ID: ${roomID}`)
  setImportantMessage();
});

createGameButton.addEventListener('click', function () {
  const nameInput = document.getElementById("nameCreate").value;
  myName = nameInput;
  firstPlayer = true;
  hideCreateGame();
  socket.emit('createGame', { name: 'Player One' });
});

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

function hideCreateGame() {
  const container = document.getElementById('container');
  container.style.display = 'none';
}

joinGameButton.addEventListener('click', function () {
  const nameInput = document.getElementById("nameJoin").value;
  const name = nameInput;
  roomID = document.getElementById('joinRoomInput').value;
  document.getElementById('roomNameInfo').innerHTML = "Room: " + roomID;
  socket.emit('joinGame', { name, roomID });
});

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
socket.on('player1Joined', (data) => {
  startGame()
  removeImportantMessage()
  setMessage('Game has started')
});

//Player 2 Joined
socket.on('player2Joined', (data) => {
  startGame()
  setMessage('New player joined, game has started')
});

function startGame() {
  enableChoiceButtons()
  const container = document.getElementById('container');
  container.style.display = 'none';
  const gameContainer = document.getElementById('gameContainer');
  gameContainer.style.display = 'block';
  document.getElementById('roomNameInfo').innerHTML = "You are in: room3";
}

socket.on('result', (data) => {
  setMessage(data.winnerMessage)
  playAgainButton.style.display = 'inline-block';
});

socket.on('opponentDisconnected', () => {
  setMessage('Opponent disconnected. Game over')
  resetGame();
})

const resetGame = () => {
  createGameButton.style.visibility = 'visible';
  joinGameButton.style.visibility = 'visible';
}

const choiceArray = ['Rock', 'Paper', 'Scissor']
const choiceButtons = [];

choiceArray.forEach((choice) => {
  const button = document.getElementById(choice)
  choiceButtons.push(button)
  button.addEventListener('click', function () {
    buttonClicked(choice)
  });
})

const buttonClicked = (choice) => {
  console.log(choice)
  setMessage("Waiting for opponent to move.")
  makeChoice(choice)
  disableChoiceButtons();
}

const disableChoiceButtons = () => {
  for (button of choiceButtons) {
    button.classList.add("noHoverDisabled");
  }
}

const enableChoiceButtons = () => {
  for (button of choiceButtons) {
    button.disabled = false;
  }
}

const makeChoice = choice => {
  const choiceEvent = firstPlayer ? 'choicePlayerOne' : 'choicePlayerTwo'
  socket.emit(choiceEvent, {
    choice: choice,
    roomID: roomID
  });
}
