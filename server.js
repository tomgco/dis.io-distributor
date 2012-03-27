require('console-trace');
console.traceAlways = true;

var socket = require('socket.io')
  // , io = socket.listen(8282)
  , managers = require('./lib/discovery').managers
  , context  = require('zmq')
  , processingQueue = []
  ;

socket.identity = 'distributor' + process.pid;

/**
 *  Connect to parent Manager, with port.
 */
// receiver.connect('tcp://localhost:60000');

// io.sockets.on('connection', function (socket) {
//   socket.emit('news', { hello: 'world' });
//   socket.on('my other event', function (data) {
//     console.log(data);
//   });
// });
startProcess();
managers.on('serviceUp', function(service) {
  //if (isNaN(service.txtRecord.taskId) /* && within date && not associated with something */) {
    // console.log(service); process.exit();
    processingQueue.push(service);
});

function startProcess() {
  var interval = setTimeout(function() {
    if (processingQueue.length !== 0) {
      subscribeToManager();
    } else {
      managers.listAll(function(err, store) {
        Object.keys(store).forEach(function(value) {
          processingQueue.push(store[value]);
        });
      });
      subscribeToManager();
    }
  }, 3000);
}

function subscribeToManager() {
  var service = processingQueue.shift()
    , socket = context.socket('req')
    ;

  socket.connect('tcp://' + service.addresses[0] + ':' + service.port);
  console.log('trying:' + 'tcp://' + service.addresses[0] + ':' + service.port);
  socket.send("conect");
  socket.on('message', function(buf) {
    var header = buf.toString('utf-8', 0, 6);
    switch(header) {
      case 'conect':
        if (buf.toString() === header + 'Good') {
          console.log(buf.toString());
          console.log('--> ' + service.addresses[0] + ':' + service.port);
          onSuccessfulSocketConnection(socket);
        } else if (buf.toString() === header + 'Bad') {
          console.log('failed.');
          socket.close();
          startProcess();
        }
        break;
      case 'beat..':
        // online Manager keep at it boy!
        break;
    }
  });
  // connect to receiver and test to see if it is s-ending tasks
}

function onSuccessfulSocketConnection(socket) {
  console.log('connected!!');
}
// handle ^C
process.on('SIGINT', function() {
  process.exit();
});