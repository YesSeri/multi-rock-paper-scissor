// Server and socket
const express = require('express');
const app = express();
const server = require('http').createServer(app);
const options = {
	cors: true,
};
const io = require('socket.io')(server, options);

// Filepath
const path = require('path');

// RoomID
const uniqueString = require('unique-string');

const PORT = process.env.PORT || 5000;
let players = {};
let rooms = {};

app.use(express.static(path.join(__dirname, 'public')));

let y = 0;

io.on('connection', (socket) => {
	console.log('User has connected:' + socket.id);
	socket.on('createGame', (data) => {
		y++;
		const roomID = uniqueString().slice(0, 4);
    leaveAllRooms(socket)
		addRoom(roomID)
		socket.join(roomID);
		rooms[roomID].p1.name = data.name
		players[roomID] = data.name;
		socket.emit('newGame', { roomID, name: data.name });
	});
	socket.on('joinGame', (data) => {
		const { roomID, name } = data
		debugger;
		rooms[roomID].p2.name = name
    leaveAllRooms(socket)
		socket.join(roomID);
		socket.to(roomID).emit('player2Joined', {
			// Socket to sends message to everyone else in room, a broadcast.
			roomID,
			p2name: name,
			p1name: rooms[roomID].p1.name,
		});
		socket.emit('player1Joined', {
			// Socket emit sends to current socket only.
			roomID,
			p2name: rooms[roomID].p2.name,
			p1name: name,
		});
	});
	socket.on('choicePlayerOne', (data) => {
		const {roomID, choice} = data
		rooms[roomID].p1.choice = choice
		console.log(rooms[roomID].p1.choice, rooms[roomID].p2.choice);
		if (rooms[roomID].p2.choice  !== '') {
			result(roomID);
		}
	});
	socket.on('choicePlayerTwo', (data) => {
		const {roomID, choice} = data
		console.log(data)
		rooms[roomID].p2.choice = choice
		console.log(rooms[roomID].p1.choice, rooms[roomID].p2.choice);
		if (rooms[roomID].p1.choice  !== '') {
			result(roomID);
		}
	});
	socket.on('playAgain', (data) => {
		socket.to(data.roomID).emit('playAgainInvite');
	});
	socket.on('acceptInvite', (data) => {
		io.sockets.to(data.roomID).emit('restartGame'); // This is used to send to everyone in room
	});

	socket.on('disconnecting', () => { // In disconnecting the rooms are still shown. In disconnect the rooms are already left. 
    socket.rooms.forEach((roomID) => {
		  socket.to(roomID).emit('opponentDisconnected')
      console.log(roomID)
    })
  })
	socket.on('disconnect', () => {
		console.log('User has disconnected: ' + socket.id);
	});
});

const result = (roomID) => {
  const { p1 } = rooms[roomID]
  const { p2 } = rooms[roomID]
	const winner = getWinner(p1, p2);
  const winnerMessage = getWinnerMessage(winner, p1, p2)
  increaseScore(winner)
	io.sockets.to(roomID).emit('result', { winnerMessage }); // This is used to send to everyone in room
  resetChoices(p1, p2)
};
const getWinner = (p1, p2) => {
  const attacks ={
    Rock: {weakTo: 'Paper', strongTo: 'Scissor'},
    Paper: {weakTo: 'Scissor', strongTo: 'Rock'},
    Scissor: {weakTo: 'Rock', strongTo: 'Paper'},
  }
  if (attacks[p1.choice].strongTo === p2.choice){ // This means I won
    return p1
  }
  if (attacks[p1.choice].weakTo === p2.choice){ // This means I won
    return p2
  }
  return "draw"
};
const getWinnerMessage = (winner, p1, p2) => {
  if(winner === p1){
    return `${p1.name} wins with ${p1.choice}`
  } else if(winner === p2){
    return `${p2.name} wins with ${p2.choice}`
  } 
  return `It is a draw, between ${p1.choice}`
}
const increaseScore = (winner) => {
  winner.score++;
}
const resetChoices = (p1, p2) => {
	p1.choice = ""
	p2.choice = ""
}
function leaveAllRooms(socket){
  socket.rooms.forEach((roomID) => {
    delete rooms[roomID]
    socket.leave(roomID)
  });
}

function addRoom(roomName) {
	rooms[roomName] = {
		p1: {
			name: '',
			choice: '',
			score: 0,
		},
		p2: {
			name: '',
			choice: '',
			score: 0,
		},
	}
}

server.listen(PORT, '0.0.0.0', () => {
	console.log(`Listening on port: ${PORT}`);
});
