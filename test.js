const roomName = 'aa43'
let socket = {id: 'player1', size: 200}
socket.roomInfo = {}
socket.roomInfo[roomName] = {rules: 'aaa'}
console.log(socket)
const n = 'size'
delete socket[n]
console.log(socket)
