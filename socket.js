//test thu ionic

let app = require('express')();
let http = require('http').Server(app);
let io = require('socket.io')(http);

var port = process.env.PORT || 3001;

http.listen(port, function () {
    console.log('listening in http://localhost:' + port);
});


io.on('connection', (socket) => {
    //lay dia chi ip cua may tram
    console.log('New connection from: ' + socket.id + ' ' + JSON.stringify(socket.request.connection._peername));
    
    socket.on('disconnect', function () {
        console.log('disconnect from: ' + socket.id + ' ' + JSON.stringify(socket.request.connection._peername));
        io.emit('users-changed', { user: socket.nickname, event: 'left' });
    });
    

    socket.on('set-nickname', (nickname) => {
        socket.nickname = nickname;
        io.emit('users-changed', { user: nickname, event: 'joined' });
    });

    socket.on('add-message', (message) => {
        io.emit('message', { text: message.text, from: socket.nickname, created: new Date() });
    });

    

});