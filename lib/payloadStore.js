var Payload = require('./payload');

var PayloadStore = exports.createPayloadStore = function(payloads, options) {
  var self = {}
    , store = {}
    ;

  options = options || {};
  options.threshold = options.threshold || 5; // howmany times to send out, ish

  Object.keys(payloads).forEach(function(key, index){
    store[index] = Payload.createPayload(payloads[key]);
  });

  function getLowestScored(cb) {
    var lowestPayload
      , lowestId
      ;

    Object.keys(store).forEach(function(id, index, array) {
      var value = store[id];
      if (lowestPayload === undefined) {
        lowestPayload = value;
        lowestId = id;
      } else if (lowestPayload.score > value.score) {
        lowestPayload = value;
        lowestId = id;
      }

      if (index === array.length - 1) {
        // ended
        cb({
            id: lowestId
          , payload: lowestPayload.get()
        });
      }
    });
  }

  self.getPayload = function(cb){
    // get tasks which have been sent out the least
    getLowestScored(cb);
  };

  return self;
};