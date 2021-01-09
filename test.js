const rooms = {}

addRoom('aaa123')

rooms.aaa123.p1 ='pelle'
console.log(rooms)

function addRoom(roomName) {
  rooms[roomName] = {
    p1: {
      name: null,
      choice: null,
    },
    p2: {
      name: null,
      choice: null,
    },
  }
}