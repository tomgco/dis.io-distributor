var EventEmitter = require('events').EventEmitter
  , availability = require('availability')
  ;

/**
 *  Helper class to constantly poll a manager to check if it is online.
 *
 */
exports.createOnlineHelper = function(port, host) {
  var self = new EventEmitter()
    , client = availability.createClient(port, host, {data: process.pid.toString()})
    , checkIntervalID
    , checkInterval = 3000 // how often to poll
    , uptime = 0
    ;

  init();

  // runs ever x number of ms defined by `checkInterval` default is 3000
  function init() {
    checkIntervalID = setInterval(function() {
      client.check();
    }, checkInterval);
  }

  // stops the poll.
  function stopPoll() {
    clearInterval(checkIntervalID);
  }

  // shuts down the timer and resets the state.
  function end() {
    stopPoll();
    client.clientData = 'end';
    client.check();
    self.emit('end');
    console.log('ended');
  }

  // Checks the state of the manager, and if it is accepting connection call the event `init`
  client.on('online', function(online, res) {
    if (!online) {
      stopPoll();
      self.emit('offline');
    } else if (res !== 'true') {
      stopPoll();
      self.emit('notAccepting');
    } else {
      if (uptime === 0) {
        self.emit('init');
      }
      uptime += 3;
    }
  });

  self.stopPoll = stopPoll;
  self.end = end;
  return self;
};