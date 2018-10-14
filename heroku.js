//may chu heroku, phuc vu test online cho ionic 
//va web server

var express = require("express");
var app = express();
app.use(express.static("./public"));

app.set("view engine", "ejs");
app.set("views", "./views");


var server=require("http").Server(app);

//yeu cau thu vien socket io
var io = require("socket.io")(server);

function isValid(tk) {

    if (tk=="cuongdq"){
        //Chỉ cho phép ?token=cuongdq mới sử dụng tính năng này được
        return true;
    }else{
        return false;
    }
}

var request_count = 0;
var request_token = 0;
var request_err = 0;

// middleware kiem tra token truoc khi cho ket noi
io.use((socket, next) => { 
    var isOk = false;

    var ip = socket.handshake.headers["x-forwarded-for"];
    var user_agent = socket.handshake.headers['user-agent'];

    //Lay dia chi ip yeu cau tu dau
    console.log( 'Request('+ ++request_count +') ip: ' + ip + ', agent: ' + user_agent);
    //console.log(socket.handshake.query);
    //chuoi handshake.query la sau dau ?
    let token = socket.handshake.query.token;
    //neu client khong co ip, khong khai bao moi truong thi se bi reject khong cho vao phong chat
    if (isValid(token)&&ip!=''&&user_agent!='') {
        isOk = true;
    }else {
        request_err++;
    } 

    //thong bao cho trang quan tri biet tinh hinh hoat dong tong quat cua he thong
    socket.emit('server-send-admin-info', 
        { request_count: request_count,
        request_token: request_token,
        request_err: request_err });
    

    //if (isOK) {
        return next();
    //}

    //return next(new Error('authentication error'));

  });
  

var port = process.env.PORT || 9235;

server.listen(port, function () {
    console.log('CUONGDQ LISTEN ON: https://cuongdqonline.herokuapp.com:' + port);
});

//lang nghe client ket noi len server
io.on("connection", function(socket){
    //moi khi co nguoi request io thanh cong voi token quy dinh
    //ghi lai token requet vao day de biet ho truy cap nhom lam viec nao
    socket.TokenRequest=socket.handshake.query.token;
    //hien chi cho phep nhom token=cuongdq moi vao duoc day
    console.log("Seq ("+ ++request_token +") connecting: " + socket.id + ' ' + JSON.stringify(socket.request.connection._peername));  

    /* socket.emit('server-send-admin-info', 
        { request_count: request_count,
        request_token: request_token,
        request_err: request_err }); */
    

    socket.on("create-room",(roomId)=>{
        //join vao mot room ten la data
        socket.join(roomId);
        socket.ROOM = roomId;
        //liet ke cac room dang co
        //consol.log(socket.adapter.rooms);
        var rooms=[];
        for (i in socket.adapter.rooms){
            rooms.push(r);
        }
        //gui toan bo danh sach rooms cho all user
        io.sockets.emit("server-send-rooms",rooms);
        //gui cho chinh socket vua tao
        socket.emit("server-send-room-socket",data);

    })
                                            
    socket.on("disconnect",function(){
        console.log("Disconnect seq(" + request_token-- +"): " + socket.id);  
        io.emit('users-changed', { user: socket.nickname, event: 'left' });
    });


    socket.on('set-nickname', (nickname) => {
        socket.nickname = nickname;
        io.emit('users-changed', { user: nickname, event: 'joined' });
    });

    socket.on('add-message', (message) => {
        io.emit('message', { text: message.text, from: socket.nickname, created: new Date() });
    });

    //su kien client emit room
    socket.on("user-chat-room",(data)=>{
        //chi gui noi dung cho phong chat thoi
        io.sockets.in(socket.ROOM).emit("server-send-user-room",data);
    })

});

app.get("/", function(req,res){
    res.render("trangchu");
});

app.get("/test", function(req,res){
    res.render("trangcheck");
});