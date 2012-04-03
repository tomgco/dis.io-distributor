require('console-trace');
console.traceAlways = true;

var socketio = require('socket.io')
  , io = socketio.listen(8282)
  , managers = require('./lib/discovery').managers
  , context  = require('zmq')
  , OnlineHelper = require('./lib/onlineHelper')
  , processingQueue = []
  , connectedTo = null
  , client
  , workunit = ''
  ;

/**
 *  Connect to parent Manager, with port.
 */
// receiver.connect('tcp://localhost:60000');
function startSocketIO(zmqSocket) {
  io.sockets.on('connection', function (socketio) {
    socketio.on('message', function(message) {
      var messageObject = JSON.parse(message);
      // stops weird stuff from happening
      switch (messageObject.action) {
        case 'request':
          socketioSend({"action": "workunit", "id":"1337", "data": workunit});
          break;
        case 'completed':
          zmqSocket.send();
          break;
        default:
          socketioSend({"action": "message", "data": "Error!"});
          break;
      }

      // abstracts the JSON.stringify, should be done in socket.io?
      function socketioSend(obj) {
        socketio.send(JSON.stringify(obj));
      }
    });
    socketio.on('disconnect', function () { });
  });
}

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
    , zmqSocket = context.socket('req')
    ;
  zmqSocket.identity = 'distributor' + process.pid;
  zmqSocket.connect(uri);
  console.log('connected to -> ' + uri);
  connectedTo = uri;
  zmqSocket.send('{"action":"requestWorkunit"}');
  zmqSocket.on('message', function(buf) {
    var obj = JSON.parse(buf.toString());
    if (obj.type === 'workunit') {
      workunit = obj.data;
      console.log(workunit.length);
    }
  });
  startSocketIO(zmqSocket);
}

startProcess();