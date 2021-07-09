

const path = require('path')
const http = require('http')
const express = require('express')
const fs = require('fs')
const app = express()
const WSServer = require('express-ws')(app)
const aWss = WSServer.getWss()

const socketio = require('socket.io')
const { generatemsg } = require('./utils/messages')

const { addUser, removeUser, getUser, getUserInRoom } = require('./utils/users')


const server = http.createServer(app)
const io = socketio(server)

const PORT = process.env.PORT || 3000

const publicdir = path.join(__dirname, '../public')

app.use(express.static(publicdir))

io.on("connection", (socket) => {
    console.log("new connection")

    socket.on("join", ({ username, room }, cb) => {

        const { error, user } = addUser({ id: socket.id, username, room })

        if (error) {
            return cb(error)
        }
        socket.join(user.room)
        socket.emit("message", generatemsg("Admin", "Welcome"))
        socket.broadcast.to(user.room).emit("message", generatemsg(`Admin ${user.username} has joined!`))

        io.to(user.room).emit("roomData", {
            room: user.room,
            users: getUserInRoom(user.room)
        })
        cb()
    })

    socket.on("sendMessage", (msg, cb) => {
        const user = getUser(socket.id)
        io.to(user.room).emit("message", generatemsg(user.username, msg))
        cb()
    })

    socket.on("img", (img) => {
        const data = img.img.replace(`data:image/png;base64,`, '')
        fs.writeFileSync(path.resolve(__dirname, 'files', `${socket.id}.jpg`), data, 'base64')
    })

    socket.on("sentence", (sentence, cb) => {
        console.log(sentence)
        socket.emit("sentence", sentence)
        cb()
    })

    socket.on("disconnect", () => {
        const user = removeUser(socket.id)
        console.log(user)
        if (user) {
            io.to(user.room).emit("message", generatemsg(`Admin'${user.username} A user  has left`, ''))

            io.to(user.room).emit("roomData", {
                room: user.room,
                users: getUserInRoom(user.room)
            })
        }

    })


})
server.listen(PORT, () => {
    console.log("server s up" + PORT)
})
