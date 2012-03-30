require('console-trace');
console.traceAlways = true;

var socket = require('socket.io')
  // , io = socket.listen(8282)
  , managers = require('./lib/discovery').managers
  , context  = require('zmq')
  , OnlineHelper = require('./lib/onlineHelper')
  , processingQueue = []
  , connectedTo = null
  , client
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
    , uptime = 0
    ;
  if (service !== undefined) {
    var host = service.addresses[0]
    ;

    client = OnlineHelper.createOnlineHelper(service.txtRecord.availabilityPort, host);

    client.on('notAccepting', startProcess);

    // TODO: check to see if already started
    // if it has, wait until it comes up again, by queing and sending old workunits - if timeout is reached then fetch new manager
    // else if it hasn't start looking for new unit);
    client.on('offline', startProcess);

    client.on('init', function() {
      zmqConnect(service);
    });

  } else {
    startProcess();
  }
}

function zmqConnect(service) {
  var uri = 'tcp://' + service.addresses[0] + ':' + service.txtRecord.zmqPort
    , socket = context.socket('req')
    ;

  socket.connect(uri);
  console.log('connected to -> ' + uri);
  connectedTo = uri;
  socket.on('message', function(buf) {
    console.log(buf.toString());
    // setTimeout(function() {socket.send('{}');}, 4000);
  });
}