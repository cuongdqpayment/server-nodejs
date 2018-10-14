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

// middleware kiem tra token truoc khi cho ket noi
io.use((socket, next) => {
    
    //Lay dia chi ip yeu cau tu dau
    console.log(
        'Client request ip: ' +socket.handshake.headers["x-forwarded-for"]
        + ', agent: ' +socket.handshake.headers['user-agent']);
    //console.log(socket.handshake.query);
    //chuoi handshake.query la sau dau ?
    let token = socket.handshake.query.token;

    if (isValid(token)) {
      return next();
    }
    return next(new Error('authentication error'));
  });
  

var port = process.env.PORT || 9235;

server.listen(port, function () {
    console.log('CUONGDQ LISTEN ON: https://cuongdqonline.herokuapp.com:' + port);
});

//lang nghe client ket noi len server
io.on("connection", function(socket){
    //ghi lai token requet vao day de biet ho truy cap nhom lam viec nao
    socket.TokenRequest=socket.handshake.query.token;
    //hien chi cho phep nhom token=cuongdq moi vao duoc day
    console.log("Co "+socket.TokenRequest+" ket noi len server: " + socket.id + ' ' + JSON.stringify(socket.request.connection._peername));  
   
    socket.on("disconnect",function(){
        console.log("Ngat " +socket.TokenRequest +" ket noi: " + socket.id);  
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

app.get("/", function(req,res){
    res.render("trangchu");
});

app.get("/test", function(req,res){
    res.render("trangcheck");
});