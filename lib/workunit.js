var PayloadStore = require('./payloadStore');

var Workunit = exports.createWorkunit = function(id, workunit, payloads) {
  var self = {}
    , payloadStore = PayloadStore.createPayloadStore(payloads)
    ;

  // sets the workunit being sent to the client, should add min and com header
  self.update = function(data) {
    workunit = data;
  };

  self.get = function() {
    return workunit;
  };

  self.retrievePayload = function(cb) {
    payloadStore.retrieveAPayload(function(payload) {
      if (payload === undefined) {
        setTimeout(function() {
          process.exit(0);
        }, 4000);
      } else {
        cb(payload);
      }
    });
  };

  self.completePayload = function(id) {
    process.nextTick(function() {
      payloadStore.completePayload(id);
    });
  };

  self.getId = function(){return id;};

  return self;
};