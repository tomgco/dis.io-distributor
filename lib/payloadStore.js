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

  self.getPayload = function(){
    // get tasks which have been sent out the least
    console.log(store);
    return 'null';
  };

  return self;
};