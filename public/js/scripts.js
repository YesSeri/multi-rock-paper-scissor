const socket = io();

const createGameButton = document.getElementById('createGameButton');
const joinGameButton = document.getElementById('joinGameButton');
const playAgainButton = document.getElementById('playAgainButton');
const acceptInviteButton = document.getElementById('acceptInviteButton');
const message = document.getElementById('message')

const seeGameBox = () => {
  const container = document.getElementById('container');
  container.style.display = 'none';
  const gameContainer = document.getElementById('gameContainer');
  gameContainer.style.display = 'block';
}

let firstPlayer = false;
let roomID;
socket.on('newGame', ({ roomID }) => {
  document.getElementById('roomNameInfo').innerHTML = roomID;
});

createGameButton.addEventListener('click', function () {
  const nameInput = document.getElementById("nameCreate").value;
  firstPlayer = true;
  message.display = "inline-block"
  message.innerText = 'Waiting for player two'
  socket.emit('createGame', { name: 'Player One' });
});

joinGameButton.addEventListener('click', function () {
  const playerName = 'Player Two';
  roomID = document.getElementById('joinRoomInput').value;
  document.getElementById('roomNameInfo').innerHTML = "Room: " + roomID;
  socket.emit('joinGame', { name: playerName, roomID });
});

playAgainButton.addEventListener('click', function () {
  message.innerText = 'Waiting for other player to accept. '
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
  message.innerText = 'Playing Again'
})

//Player 1 Joined
socket.on('player1Joined', (data) => {
  enableChoiceButtons()
  message.innerText = 'Game has started'
  transition(data);
});

//Player 2 Joined
socket.on('player2Joined', (data) => {
  enableChoiceButtons()
  message.innerText = 'New player joined, game has started'
  transition(data);
});

socket.on('result', (data) => {
  console.log(data.winnerMessage)
  message.innerText = data.winnerMessage
  playAgainButton.style.display = 'inline-block';
});

socket.on('opponentDisconnected', () => {
  message.innerText = 'Opponent disconnected. Game over'
  resetGame();
})

const resetGame = () => {
  createGameButton.style.visibility = 'visible';
  joinGameButton.style.visibility = 'visible';
}

const transition = () => {
  createGameButton.style.visibility = 'hidden';
  joinGameButton.style.visibility = 'hidden';
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
  // makeChoice(choice)
  // disableChoiceButtons();
}

const disableChoiceButtons = () => {
  for (button of choiceButtons) {
    button.style.visibility == 'hidden'
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
