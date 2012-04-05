require('console-trace');
// console.traceAlways = true;

var socketio = require('socket.io')
  , io = socketio.listen(8282)
  , managers = require('./lib/discovery').managers
  , context  = require('zmq')
  , OnlineHelper = require('./lib/onlineHelper')
  , processingQueue = []
  , connectedTo = null
  , client
  , Workunit = require('./lib/workunit')
  ;

io.set("log level", 1);

/**
 *  Connect to parent Manager, with port.
 */
// receiver.connect('tcp://localhost:60000');
function startSocketIO(workunit, zmqSocket) {
  io.sockets.on('connection', function (socketio) {
    socketio.on('message', function(message) {
      console.log(message);
      switch (message.action) {
        case 'request':
          socketio.json.send({
              "action": "workunit"
            , "id": workunit.getId()
            , "data": workunit.get()
          });
          break;
        case 'getPayload':
          workunit.retrievePayload(function(payload) {
            console.log(payload);
            socketio.json.send({'action': 'payload', 'data': payload});
          });
          break;
        case 'completed':
          zmqSocket.send(JSON.stringify(message));
          // socketio.json.send({"action": "workunit", "id":"1337", "data": workunit.get()}); // new task
          break;
        default:
          socketio.json.send({"action": "message", "data": "Unknown action: " + message.action });
          break;
      }
    });
    socketio.on('disconnect', function () { });
  });
}

managers.on('serviceUp', function(service) {
  //if (isNaN(service.txtRecord.taskId) /* && within date && not associated with something */) {
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
    client.on('offline', function() {
      startProcess();
      console.log('client down.');
    });

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
  //TODO: check for existing results if found send.
  zmqSocket.send('{"action":"requestWorkunit"}');
  zmqSocket.on('message', function(buf) {
    var obj = JSON.parse(buf.toString());
    switch(obj.action) {
      case 'workunit':
        var workunit = Workunit.createWorkunit(obj.id, obj.workunit, obj.payloads);
        startSocketIO(workunit, zmqSocket);
        break;
      case 'saved':
        // log that it was saved and clear queue items that saved.
        break;
      case 'notSaved':
        // add to a queue to be sent with next iteration
        break;
      default:
        break;
    }
  });
}

startProcess();