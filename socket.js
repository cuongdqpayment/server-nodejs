//test thu ionic

var express = require("express");
var app = express();

app.use(express.static("./public"));
app.set("view engine", "ejs");
app.set("views", "./views");

app.get("/", function (req, res) {
    res.render("database");
});

let http = require('http').Server(app);
let io = require('socket.io')(http);

var port = process.env.PORT || 3001;

http.listen(port, function () {
    console.log('listening in http://localhost:' + port);
    //console.log('CUONGDQ LISTEN ON: https://cuongdqonline.herokuapp.com:' + port);
});

//database 
var isDBOK = false;
const sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('./db/sockets.db', (err) => {
    if (err) {
        console.error(err.message);
    } else{
        console.log('Connected to the sockets.db database.');
        db.serialize(function() {
            db.run("CREATE TABLE if not exists USERS ("
            + " USER_NAME TEXT PRIMARY KEY  NOT NULL"
            + " ,LAST_LOGIN DATETIME)");
            db.run("CREATE TABLE if not exists LOG_CLIENTS ("
            + " IP TEXT"
            + " ,USER_AGENT TEXT"
            + " ,TOKEN TEXT"
            + " ,ID TEXT"
            + " ,USER TEXT"
            + " ,ROOM TEXT"
            + " ,LAST_LOGIN DATETIME)");
        isDBOK = true;
        });
    }
});
/////////////////////////////
//array so sanh id co ton tai khong
function isExistObjectId(oId, arr) {
    //console.log(oId);
    for(var i in arr) {
        //console.log(arr[i]);
        if(oId == arr[i].id) {
            return true;
        }
    }
    return false;
}
/////////////////////////////
//array xoa object trong array neu trung thi tra ve 1 object
function removeObjectId(oId, arr) {
    for (var i = 0; i < arr.length; i++) {
        var obj = arr[i];
        if (obj.id==oId){
            return arr.splice(i,1);;
        }
    }
    //console.log("remove: " + arr);
    return null;
}
/////////////////////////////
function isValid(tk) {

    if (tk == "cuongdq") {
        return true;
    } else {
        return false;
    }
}
/////////////////////////////
// socket.io
var client;
var clients=[];

var room;
var rooms=[];

var sys_info={
    total:0,
    token:0,
    live:0,
    err:0
};

io.use((socket, next) => {
    /**
     * Cac lenh emit trong use khong co tac dung nhe
     * Chi cac lenh trong on moi co tac dung
     */
    let isOK = false;
    
    client = new Object;
    client.id = socket.id;
    client.ip = socket.handshake.headers["x-forwarded-for"];
    client.user_agent = socket.handshake.headers['user-agent'];
    client.token = socket.handshake.query.token;
    client.user = socket.handshake.query.user;
    client.roomId = socket.handshake.query.room;
    client.datatime = (new Date()).toLocaleTimeString();

    sys_info.total++;
    if (isValid(client.token) 
        && client.ip != '' 
        && client.user_agent != '') {
        sys_info.token++;
        isOK = true;
    } else {
        sys_info.err++;
    }
    //chen thong tin log vao csdl
    if (isDBOK){
        
        var stmt = db.prepare("INSERT INTO LOG_CLIENTS"
        +"(IP, USER_AGENT, TOKEN, ID, USER, ROOM, LAST_LOGIN)"
        +" VALUES "
        +"( ?, ?, ?, ?, ?, ?, ?)");
         
        stmt.run(client.ip, 
                 client.user_agent, 
                 client.token,
                 client.id, 
                 client.user, 
                 client.roomId, 
                 client.datatime);
        stmt.finalize();
        
        let i=0;
         db.each("SELECT IP, USER_AGENT, TOKEN, ID, USER, ROOM, LAST_LOGIN FROM LOG_CLIENTS", function(err, row) {
            /* console.log(
                ++i 
                + ": "+row.IP + "; " 
                + row.USER_AGENT + "; " 
                + row.ID + "; " 
                + row.TOKEN + "; " 
                + row.ROOM + "; " 
                + row.USER + "; " 
                + row.LAST_LOGIN);    */
        });
    }
    ///////////////////////////////

    if (isOK) {
        return next();
    }
    return next(new Error('authentication error'));
});
/////////////////////////////
io.on('connection', (socket) => {
    //gan room, user cho socket
    sys_info.live++;
    socket.ROOMID = client.roomId;
    socket.USERNAME = client.user;

    if (socket.ROOMID !=undefined 
        && socket.ROOMID !=''){
            socket.join(socket.ROOMID);
        if (isExistObjectId(socket.ROOMID, rooms)){
            //chinh sua them id
            room = removeObjectId(socket.ROOMID,rooms)[0];
            room.clients.push(client);
            room.length = socket.adapter.rooms[socket.ROOMID].length;
            /* console.log("ROOM = " + room.id);
            console.log(room.clients); */
        }else{
            //chua co room
            room = new Object();
            room.id = socket.ROOMID;
            room.clients = [client];
            room.length = socket.adapter.rooms[socket.ROOMID].length;
        }
        rooms.push(room);
        //console.log(rooms);
    }
    //lay dia chi ip cua may tram
    clients.push(client);
    
    io.emit("server-send-rooms", rooms);
    io.emit('server-send-admin-info',sys_info);

    console.log('New io.on: ' + 
                    + clients.length + "; " 
                    + client.datatime + "; " 
                    + client.id + "; " 
                    + client.token + "; " 
                    + client.roomId + "; " 
                    + client.user + "; " 
                    + client.ip + "; " 
                    + client.user_agent);
    
    
    socket.on('disconnect', function () {
        sys_info.live--;
        removeObjectId(socket.id, clients);

        console.log('Disconnect from: ('
         + clients.length
         + ')'
         + socket.id
         );

        if (isExistObjectId(socket.ROOMID, rooms)){
            //chinh sua xoa bo client trong room
            var roomOld = removeObjectId(socket.ROOMID,rooms)[0];
            removeObjectId(socket.id,roomOld.clients);
            room.length = roomOld.clients.length;
            rooms.push(roomOld);
        }

        io.emit('users-changed', { user: socket.nickname, event: 'left' });
        
        io.emit("server-send-rooms", rooms);

        io.emit('server-send-admin-info', sys_info);

    });
    

    socket.on('set-nickname', (nickname) => {
        socket.nickname = nickname;
        io.emit('users-changed', { user: nickname, event: 'joined' });
    });

    socket.on('add-message', (message) => {
        io.emit('message', { text: message.text, from: socket.nickname, created: new Date() });
    });
});