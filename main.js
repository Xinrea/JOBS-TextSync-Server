import { Server } from "socket.io";
import { Room } from "./room.js";
const io = new Server(9000,{
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
});

let rooms = new Map();

function getRoomByUser(id) {
    for (let [key, value] of rooms) {
        if (value.hasUser(id)) {
            return key;
        }
    }
    return null;
}

io.on("connection", (socket)=>{
    socket.on("join", (room_name, password, texts)=>{
        if (room_name == '' || password == '') {
            // Empty room_name is not allowed
            socket.emit('error', '房间名和密码不能为空');
        } else {
            if (!rooms.has(room_name)) {
                // Create new room
                rooms.set(room_name, new Room(room_name, password));
                rooms.get(room_name).addUser(socket.id, password);
                rooms.get(room_name).setTexts(texts);
                socket.join(room_name);
                socket.emit('joined', room_name);
                io.to(room_name).emit('userlist_update', rooms.get(room_name).getUsers());
                console.log('%s create room: %s', socket.id, room_name);
            } else {
                if (rooms.get(room_name).checkPassword(password)) {
                    let prev_room = getRoomByUser(socket.id);
                    // Quit previous room
                    if (prev_room != null) {
                        socket.leave(prev_room);
                        rooms.get(prev_room).removeUser(socket.id);
                        if (rooms.get(prev_room).getUsers().length == 0) {
                            // Remove empty room
                            rooms.delete(prev_room);
                        }
                        io.to(prev_room).emit('userlist_update', rooms.get(prev_room).getUsers());
                    }
                    // Join new room
                    socket.join(room_name);
                    socket.emit('joined', room_name);
                    rooms.get(room_name).addUser(socket.id, password)
                    io.to(room_name).emit('userlist_update', rooms.get(room_name).getUsers());
                    console.log('%s join room: %s', socket.id, room_name);
                    for (let t of texts) {
                        rooms.get(room_name).updateText(t.name, t.value);
                        socket.to(room_name).emit('update_text', t);
                    }
                    for (let t of rooms.get(room_name).getTexts()) {
                        socket.emit('update_text', {name:t[0], value: t[1]});
                    }
                } else {
                    socket.emit('error', '房间密码错误');
                }
            }
        }
    });

    socket.on('update_text', (data)=>{
        let room_name = getRoomByUser(socket.id);
        if (room_name == null) {
            // User not in any room
            return
        }
        rooms.get(room_name).updateText(data.name, data.value);
        socket.to(room_name).emit('update_text', data);
    })

    socket.on('disconnect', (reason)=>{
        console.log('client %s disconnected, %s', socket.id, reason)
        let room = getRoomByUser(socket.id);
        if (room != null) {
            rooms.get(room).removeUser(socket.id);
            socket.leave(room);
            if (rooms.get(room).getUsers().length == 0) {
                // Remove empty room
                rooms.delete(room);
            } else {
                io.to(room).emit('userlist_update', rooms.get(room).getUsers());
            }
        }
    })

    socket.on("textchange", (data)=>{
        let rooms = Array.from(socket.rooms)
        rooms = rooms.filter(room=>room!=socket.id)
        socket.to(rooms).emit("textchange", data);
    });
})

process.on('SIGINT',()=> {
    console.log('\nGracefully shutting down from SIGINT (Ctrl-C)')
    process.exit();
})