const express = require('express')
const app = express()

const http = require('http').Server(app)
// 靜態資源
app.use('/', express.static(__dirname + '/public/'))

const io = require('socket.io')(http, {
  cors: true,
})

// 有人連線就會觸發
io.on('connection', (socket) => {
  let userRoom
  // 加入房間
  socket.on('join', (room) => {
    userRoom = room
    socket.join(room)
  })

  // 轉傳 Offer
  socket.on('offer', (room, desc) => {
    socket.to(room).emit('offer', desc, socket.id)
  })

  // 轉傳 Answer
  socket.on('answer', (room, desc) => {
    socket.to(room).emit('answer', desc)
  })

  // 交換 ice candidate
  socket.on('ice_candidate', (room, data) => {
    socket.to(room).emit('ice_candidate', data, socket.id)
  })

  // 中斷連線
  socket.on('disconnect', () => {
    console.log(userRoom, socket.id, 'dis')
    socket.to(userRoom).emit('bye', socket.id)
  })
})

http.listen(8088, () => {
  console.log(`Server running in 8088`)
})
