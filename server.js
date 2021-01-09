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
		addRoom(roomID)
		socket.join(roomID);
		rooms[roomID].p1.name = data.name
		players[roomID] = data.name;
		socket.emit('newGame', { roomID });
	});
	socket.on('joinGame', (data) => {
		console.log('joinGAME')
		const { roomID, name } = data
		rooms[roomID].p2.name = name
		socket.join(roomID);
		socket.to(roomID).emit('player2Joined', {
			// Socket to sends message to everyone else in room, a broadcast.
			p2name: name,
			p1name: players[roomID],
		});
		socket.emit('player1Joined', {
			// Socket emit sends to current socket only.
			p2name: players[roomID],
			p1name: name,
		});
	});
	socket.on('choicePlayerOne', (data) => {
		console.log('choicePLAYERONE')
		const {roomID, choice} = data
		rooms[roomID].p1.choice = choice
		console.log(rooms[roomID].p1.choice, rooms[roomID].p2.choice);
		if (rooms[roomID].p2.choice  !== '') {
		console.log('IF STATEMENT choicePLAYERONE')
			result(roomID);
		}
	});
	socket.on('choicePlayerTwo', (data) => {
		console.log('choicePLAYERTWO')
		const {roomID, choice} = data
		rooms[roomID].p2.choice = choice
		console.log(rooms[roomID].p1.choice, rooms[roomID].p2.choice);
		console.log(rooms[roomID].p1.choice)
		if (rooms[roomID].p1.choice  !== '') {
		console.log('IF STATEMENT choicePLAYERTWO')
			result(roomID);
		}
	});
	socket.on('playAgain', (data) => {
		socket.to(data.roomID).emit('playAgainInvite');
	});
	socket.on('acceptInvite', (data) => {
		io.sockets.to(data.roomID).emit('restartGame'); // This is used to send to everyone in room
	});
	socket.on('disconnect', () => {
		console.log('User has disconnected: ' + socket.id);
	});
});

const result = (roomID) => {
  const { p1 } = rooms[roomID]
  const { p2 } = rooms[roomID]
	const winner = getWinner(p1, p2);
	console.log(winner);
	io.sockets.to(roomID).emit('result', { winner }); // This is used to send to everyone in room
	rooms[roomID].p1.choice = ""
	rooms[roomID].p2.choice = ""
};
const getWinner = (p1, p2) => {
  debugger;
  const attacks ={
    Rock: {weakTo: 'Paper', strongTo: 'Scissor'},
    Paper: {weakTo: 'Scissor', strongTo: 'Rock'},
    Scissor: {weakTo: 'Rock', strongTo: 'Paper'},
  }
  debugger;
  if (attacks[p1.choice].strongTo === p2.choice){ // This means I won
    return `${p1.name} wins with ${p1.choice}`
  }
  if (attacks[p1.choice].weakTo === p2.choice){ // This means I won
    return `${p2.name} wins with ${p2.choice}`
  }
  return "It is a draw"
};

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
