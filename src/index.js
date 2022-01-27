const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const {generateMessage,} = require('./utils/messages')
const {addUser, removeUser, getUsersInRoom, getUser} = require('./utils/users')
const app = express()
const server = http.createServer(app) // create raw server for web-socket
const io = socketio(server)


const port = process.env.PORT || 3000
app.use(express.static(path.join(__dirname,'../public')))



io.on('connection', (socket) => {

    socket.on('join', ({username, room}, cb) => {
        const {error, user} = addUser({id: socket.id, username, room})

        if (error) {
            return cb(error)
        }

        socket.join(user.room)

        socket.emit('message', generateMessage('Admin', 'welcome to the chat room'))
        socket.broadcast.to(user.room).emit('message', generateMessage('Admin',` ${user.username} has joined the room`))

        io.to(user.room).emit('roomData', {
            room: user.room,
            users:getUsersInRoom(user.room)
        })
        cb()
    })

    socket.on('sendMessage', (message, cb) => {
        const filter = new Filter()
        const user = getUser(socket.id)
        // if (filter.isProfane(message)) {
        //     return cb('Profanity is not allowed!')
        // }

        io.to(user.room).emit('message', generateMessage(user.username,filter.clean(message)))
        cb()
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)
        if (user) {
            io.to(user.room).emit('message', generateMessage('Admin',`${user.username} has left the room`))
            io.to(user.room).emit('roomData', {
                room: user.room,
                users:getUsersInRoom(user.room)
            })
        }
        
    })

    socket.on('sendLocation', (coords, cb) => {
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage', generateMessage(user.username, `https://www.google.com/maps?q=${coords.latitude},${coords.longitude}`))
        cb()
    })

})



server.listen(port, () => {
    console.log(`server is listening on port ${port}`);
})