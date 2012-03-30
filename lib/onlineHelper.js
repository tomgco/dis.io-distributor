var EventEmitter = require('events').EventEmitter
  , availability = require('availability')
  ;

exports.createOnlineHelper = function(port, host) {
  var self = new EventEmitter()
    , client = availability.createClient(port, host, {data: process.pid.toString()})
    , checkIntervalID
    , checkInterval = 3000 // how often to poll
    , uptime = 0
    ;

  init();

  function init() {
    checkIntervalID = setInterval(function() {
      client.check();
    }, checkInterval);
  }

  function stopPoll() {
    clearInterval(checkIntervalID);
  }

  function end() {
    stopPoll();
    client.clientData = 'end';
    client.check();
    self.emit('end');
    console.log('ended');
  }

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