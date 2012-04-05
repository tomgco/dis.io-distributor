require('console-trace');
// console.traceAlways = true;

var socketio = require('socket.io')
  , mdns = require('mdns')
  , app = require('http').createServer()
  , io = socketio.listen(app)
  , managers = require('./lib/discovery').managers
  , context  = require('zmq')
  , OnlineHelper = require('./lib/onlineHelper')
  , processingQueue = []
  , connectedTo = null
  , client
  , Workunit = require('./lib/workunit')
  , workunit
  , zmqSocket
  , zmqOnline = false
  , socketioOnline = false
  , offlineMessageQueue = []
  , packageJSON = require('./package.json')
  , appVersion = 'v' + packageJSON.version.split('.').slice(0, -1).join('-')
  ;

io.set("log level", 0);

/**
 *  Connect to parent Manager, with port.
 */

function startSocketIO(workunit) {

  io.sockets.on('connection', function (socketio) {
    socketioOnline = true;
    socketio.on('message', function(message) {
      var socket = {};
      if (!zmqOnline) {
        socket.send = function(msg) {
          offlineMessageQueue.push(msg);
        };
      } else {
        socket = zmqSocket;
      }
      switch (message.action) {
        case 'request':
          socketio.json.send({
              "action": "workunit"
            , "workunitId": workunit.getId()
            , "data": workunit.get()
          });
          break;
        case 'getPayload':
          workunit.retrievePayload(function(payload) {
            socketio.json.send({'action': 'payload', 'data': payload});
          });
          break;
        case 'completed':
          socket.send(JSON.stringify(message));
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
      if (zmqOnline) {
        zmqSocket.close();
      }
      zmqOnline = false;
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
    ;
  zmqSocket = context.socket('req');
  zmqSocket.identity = 'distributor' + process.pid;
  zmqSocket.connect(uri);
  console.log('connected to -> ' + uri);
  zmqOnline = true;
  connectedTo = uri;
  //TODO: check for existing results if found send.
  if (offlineMessageQueue.length > 0) {
    offlineMessageQueue.forEach(function(value) {
      zmqSocket.send(value);
    });
  }
  zmqSocket.send('{"action":"requestWorkunit"}');
  zmqSocket.on('message', function(buf) {
    var obj = JSON.parse(buf.toString());
    switch(obj.action) {
      case 'workunit':
        workunit = Workunit.createWorkunit(obj.id, obj.workunit, obj.payloads);
        if (!socketioOnline) startSocketIO(workunit);
        break;
      case 'saved':
        workunit.completePayload(obj.data.id);
        // log that it was saved and clear queue items that saved.
        break;
      case 'notSaved':
        console.error(new Error('Could not save.'));
        // add to a queue to be sent with next iteration
        break;
      default:
        break;
    }
  });
}
app.listen(function() {
  // need to publish somehow so others can connect.
  startDiscovery(app.address().port);
  startProcess();
});

/**
 *  Starts the Bonjour / zeroconf service for advertising up services
 *  and logs them
 */
function startDiscovery(port) {
  console.log('Running disio-distributor' + '@' + appVersion + ' on ' + '0.0.0.0:' + port);
  var ad = mdns.createAdvertisement(mdns.udp('disio-distribu', appVersion), port, {'txtRecord': { name: 'dis.io distributor' }});
  ad.start();
}