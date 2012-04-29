var PayloadStore = require('./payloadStore');
/**
 * The work unit class this is instantiated when a payload is received.
 */
var Workunit = exports.createWorkunit = function(id, workunit, payloads) {
  var self = {}
    , payloadStore = PayloadStore.createPayloadStore(payloads) // creates store on start.
    ;

  // sets the work unit being sent to the client, should add min and com header
  self.update = function(data) {
    workunit = data;
  };

  self.get = function() {
    return workunit;
  };

  // Gets a payload.
  self.retrievePayload = function(cb) {
    payloadStore.retrieveAPayload(function(payload) {
      if (payload === undefined) {
        setTimeout(function() {
          // quits after 4 seconds if no more payloads are found
          // so that messages have a change to send.
          process.exit(0);
        }, 4000);
      } else {
        cb(payload);
      }
    });
  };

  // complete the payload on the next tick of the event loop.
  self.completePayload = function(id) {
    process.nextTick(function() {
      payloadStore.completePayload(id);
    });
  };

  self.getId = function(){return id;};

  return self;
};