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

io.on('connection', (socket) => {
	console.log('User has connected:' + socket.id);
	// When a user creates a game create a new room with an unique id and add the game to our list of rooms 
	socket.on('createGame', (data) => {
		const roomID = uniqueString().slice(0, 4);
		leaveAllRooms(socket)
		addRoom(roomID)
		socket.join(roomID);
		rooms[roomID].p1.name = data.name
		players[roomID] = data.name;
		socket.emit('newGame', { roomID, name: data.name });
	});
	// When a player joins the created game, the game is starts. It exchanges info about the other player to the respective clients. 
	socket.on('joinGame', (data) => {
		try {
			const { roomID, name } = data
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
				p1name: rooms[roomID].p1.name,
			});
		} catch (error) { 
			// If I encounter an error, for example that the player tries to connect to with an undefined string to a room, which causes an error, then I just throw an error and force player to disconnect which takes him back to the start menu. 
			console.error(error)
			socket.rooms.forEach((roomID) => {
				io.sockets.to(roomID).emit('opponentDisconnected'); // This is used to send to everyone in room
				socket.to(roomID).emit('opponentDisconnected')
				console.log(roomID)
			})

		}

	});

	// Here we recieve a choice. We only want to run evaluate who wins if both players have made a move. If p2 has made a move result gets run.
	socket.on('choicePlayerOne', (data) => {
		const { roomID, choice } = data
		rooms[roomID].p1.choice = choice
		console.log(rooms[roomID].p1.choice, rooms[roomID].p2.choice);
		if (rooms[roomID].p2.choice !== '') {
			result(roomID);
		}
	});
	// Here we recieve a choice. We only want to run evaluate who wins if both players have made a move. If p1 has made a move result gets run.
	socket.on('choicePlayerTwo', (data) => {
		const { roomID, choice } = data
		console.log(data)
		rooms[roomID].p2.choice = choice
		console.log(rooms[roomID].p1.choice, rooms[roomID].p2.choice);
		if (rooms[roomID].p1.choice !== '') {
			result(roomID);
		}
	});
	// The button first looks like playAgain for both players. If one player presses the button we emit this event, so we can change the playAgain button to a accept invite to play again button
	socket.on('playAgain', (data) => {
		socket.to(data.roomID).emit('playAgainInvite');
	});
	// If the opposing player 
	socket.on('acceptInvite', (data) => {
		io.sockets.to(data.roomID).emit('restartGame'); // This is used to send to everyone in room
	});
	// In disconnecting the rooms are still shown for the leaving player. That means I can send a message to the other player in the room. In disconnect the rooms are already left, and I can't see in what room the opponent is. 
	// If the player is disconnecting I need to make the opponent leave the room so he can find a new game. 
	socket.on('disconnecting', () => { 
		socket.rooms.forEach((roomID) => {
			socket.to(roomID).emit('opponentDisconnected')
			delete rooms[roomID];
		})
	})
	socket.on('disconnect', () => {
		console.log('User has disconnected: ' + socket.id);
	});
});

// This calculates the winner of the room and emits the new score and a message to the two players. This function is run when the two players has made their choice. 
const result = (roomID) => {
	const { p1 } = rooms[roomID]
	const { p2 } = rooms[roomID]
	const winner = getWinner(p1, p2);
	const winnerMessage = getWinnerMessage(winner, p1, p2)
	increaseScore(winner)
	io.sockets.to(roomID).emit('result', { winnerMessage, scoreP1: p1.score, scoreP2: p2.score }); // This is used to send to everyone in room
	resetChoices(p1, p2)
};
// Calculates who has won the current round. 
const getWinner = (p1, p2) => {
	const attacks = {
		Rock: { weakTo: 'Paper', strongTo: 'Scissor' },
		Paper: { weakTo: 'Scissor', strongTo: 'Rock' },
		Scissor: { weakTo: 'Rock', strongTo: 'Paper' },
	}
	if (attacks[p1.choice].strongTo === p2.choice) { // This means I won
		return p1
	}
	if (attacks[p1.choice].weakTo === p2.choice) { // This means I won
		return p2
	}
	return "draw"
};
// Creates a suitable message for the result of the round. 
const getWinnerMessage = (winner, p1, p2) => {
	if (winner === p1) {
		return `${p1.name} wins with ${p1.choice}`
	} else if (winner === p2) {
		return `${p2.name} wins with ${p2.choice}`
	}
	return `It is a draw, between ${p1.choice}`
}

// Increases score of whoever won. Since winner isn't a primitive type, but an object any changes we make to the object here gets reflected in the state of the game. 
const increaseScore = (winner) => {
	winner.score++;
}
// When we have gotten a winner we resets the player choices here.
const resetChoices = (p1, p2) => {
	p1.choice = ""
	p2.choice = ""
}
// If we get disconnected from a room, and we want to rejoin a room, when we connect to a new game we first disconnect from all rooms we might be in on beforehand. 
function leaveAllRooms(socket) {
	socket.rooms.forEach((roomID) => {
		delete rooms[roomID]
		socket.leave(roomID)
	});
}

// Adds a room to the "global" variable rooms. 
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

server.listen(PORT, () => {
	console.log(`Listening on port: ${PORT}`);
});
