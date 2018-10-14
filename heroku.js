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
    socket.TokenRequest=socket.handshake.query.token;
    
    console.log("Co "+socket.TokenRequest+" ket noi len server: " + socket.id + ' ' + JSON.stringify(socket.request.connection._peername));  
   
    socket.on("disconnect",function(){
        console.log("Ngat " +socket.TokenRequest +" ket noi: " + socket.id);  

    });

});

app.get("/", function(req,res){
    res.render("trangchu");
});

app.get("/test", function(req,res){
    res.render("trangcheck");
});