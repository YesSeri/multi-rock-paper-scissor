const socket = io();

const createGameButton = document.getElementById('createGameButton');
const joinGameButton = document.getElementById('joinGameButton');
const playAgainButton = document.getElementById('playAgainButton');
const acceptInviteButton = document.getElementById('acceptInviteButton');
const choiceButtons = document.getElementsByClassName("choiceButtons");
const message = document.getElementById('message')


let firstPlayer=false;
let roomID;
socket.on('newGame', (data) => {
	roomID = data.roomID 
	document.getElementById('roomName').innerHTML = roomID;
});

createGameButton.addEventListener('click', function () {
  firstPlayer=true;
  message.innerText = 'Waiting for player two'
	socket.emit('createGame', { name: 'Player One' });
});

joinGameButton.addEventListener('click', function () {
	const playerName = 'Player Two';
	roomID = document.getElementById('joinRoomInput').value;
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
  console.log('PLAYAGAININVITE RECIEVED')
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
  console.log(data.winner)
  message.innerText = data.winner 
	playAgainButton.style.display = 'inline-block';
});

const transition = () => {
	createGameButton.style.visibility = 'hidden';
	joinGameButton.style.visibility = 'hidden';
}

document.getElementById('rockButton').addEventListener('click', function () {
	console.log('clicked rock');
  makeChoice('Rock')
  disableChoiceButtons();
});
document.getElementById('paperButton').addEventListener('click', function () {
	console.log('clicked paper');
  makeChoice('Paper')
  disableChoiceButtons();
});
document.getElementById('scissorButton').addEventListener('click', function () {
  console.log('clicked scissor');
  makeChoice('Scissor')
  disableChoiceButtons();
});


const disableChoiceButtons = () => {
  for (button of choiceButtons) {
	  button.disabled = true;
  }
}

const enableChoiceButtons = () => {
  for (button of choiceButtons) {
	  button.disabled = false;
  }
}

const makeChoice = choice => {
  const choiceEvent = firstPlayer ? 'choicePlayerOne' : 'choicePlayerTwo'
  socket.emit(choiceEvent,{
    choice: choice,
    roomID: roomID
  });
}
