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
    // var a = {a:1,b:1,c:1}; Object.keys(a); var b = a.a; delete a.a; a.a = b; Object.keys(a);
    // var lowestId = Object.keys(store)[Math.floor(Math.random()*Object.keys(store).length)];
    // var lowestPayload = store[lowestId];
    Object.keys(store).forEach(function(id, index, array) {
      var value = store[id];
      if (lowestPayload === undefined) {
        lowestPayload = value;
        lowestId = id;
      } else if (lowestPayload.getScore() > value.getScore()) {
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

  self.retrieveAPayload = function(cb){
    // get tasks which have been sent out the least
    getLowestScored(cb);
  };

  self.completePayload = function(id) {
    var saved = store[id];
    saved.increaseCompletedCount();
  };

  return self;
};