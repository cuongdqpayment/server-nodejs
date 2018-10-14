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
/**
 * /socket.io/?token= cuongdq&
 * EIO= 3&
 * transport= polling&
 * t= MPn58ac&
 * sid=O6qU-2OPedMGXTt6AAAC" 
 * host=cuongdqonline.herokuapp.com 
 * request_id=df6e1dd4-d961-4a0a-bb60-c13a8736a126 
 * fwd="123.19.231.242" dyno=web.1 connect=1ms service=1278ms status=200 bytes=225 protocol=https
 */
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