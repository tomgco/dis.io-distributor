var socket = require('socket.io')
  , io = socket.listen(8282)
  , context  = require('zmq')
  , receiver = context.socket('pull')
  , sender   = context.socket('push')
  ;

receiver.on('message', function(buf) {
  console.log(buf.toString() + ".");

  // setTimeout(function() {
  //   // sender.send("Hello From Distributor");
  // }, 1000);
});

/**
 *  Connect to parent Manager, with port.
 */
receiver.connect('tcp://localhost:60000');

io.sockets.on('connection', function (socket) {
  socket.emit('news', { hello: 'world' });
  socket.on('my other event', function (data) {
    console.log(data);
  });
});


// handle ^C
process.on('SIGINT', function() {
  receiver.close();
  sender.close();
  process.exit();
});