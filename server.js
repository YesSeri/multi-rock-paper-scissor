const express = require('express');
const app = express();
const server = require('http').createServer(app);
const path = require('path');
const options = {
	cors: true,
};
const io = require('socket.io')(server, options);
// const uniqueString = require('unique-string');

const PORT = process.env.PORT | 5000;
let players = {};

app.use(express.static(path.join(__dirname, 'public')));

let y = 0;
let choice1 = '';
let choice2 = '';

io.on('connection', (socket) => {
	console.log('User has connected:' + socket.id);
	socket.on('createGame', (data) => {
		y++;
		const roomID = 'room' + y; // uniqueString();
		socket.join(roomID);
		players[roomID] = data.name;
		socket.emit('newGame', { roomID });
	});
	socket.on('joinGame', (data) => {
		socket.join(data.roomID);
		socket.to(data.roomID).emit('player2Joined', {
			// Socket to sends message to everyone else in room, a broadcast.
			p2name: data.name,
			p1name: players[data.roomID],
		});
		socket.emit('player1Joined', {
			// Socket emit sends to current socket only.
			p2name: players[data.roomID],
			p1name: data.name,
		});
	});
	socket.on('choicePlayerOne', (data) => {
		choice1 = data.choice;
		console.log(choice1, choice2);
		if (choice2 != '') {
			result(data.roomID);
		}
	});
	socket.on('choicePlayerTwo', (data) => {
		choice2 = data.choice;
		console.log(choice1, choice2);
		if (choice1 != '') {
			result(data.roomID);
		}
	});
	socket.on('playAgain', (data) => {
		console.log(players);
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
	const winner = getWinner(choice1, choice2);
	console.log(winner);
	io.sockets.to(roomID).emit('result', { winner }); // This is used to send to everyone in room
	choice1 = '';
	choice2 = '';
};
const getWinner = (p1, p2) => {
	const rock = 'Rock';
	const paper = 'Paper';
	const scissor = 'Scissor';
	if (p1 === p2) {
		return 'draw';
	}
	if (p1 === rock) {
		if (p2 === paper) {
			return 'p2 wins, with paper';
		} else {
			return 'p1 wins, with rock';
		}
	} else if (p1 === paper) {
		if (p2 === scissor) {
			return 'p2 wins, with scissor';
		} else {
			return 'p1 wins, with paper';
		}
	} else {
		//scissor
		if (p2 === rock) {
			return 'p2 wins, with rock';
		} else {
			return 'p1 wins, with scissor';
		}
	}
};

server.listen(PORT, '0.0.0.0', () => {
	console.log(`Listening on port: ${PORT}`);
});
