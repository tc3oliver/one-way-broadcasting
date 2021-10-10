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
  // 加入房間
  socket.on('join', (room) => {
    socket.join(room)
  })

  // 轉傳 Offer
  socket.on('offer', (room, desc) => {
    socket.to(room).emit('offer', desc)
  })

  // 轉傳 Answer
  socket.on('answer', (room, desc) => {
    socket.to(room).emit('answer', desc)
  })

  // 交換 ice candidate
  socket.on('ice_candidate', (room, data) => {
    socket.to(room).emit('ice_candidate', data)
  })

  // 離開房間
  socket.on('leave', (room) => {
    socket.to(room).emit('bye')
    socket.emit('leaved')
  })
})

http.listen(8088, () => {
  console.log(`Server running in 8088`)
})
