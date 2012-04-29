var Payload = require('./payload');
/**
 * A store for payloads in a distributor.
 */
var PayloadStore = exports.createPayloadStore = function(payloads, options) {
  var self = {}
    , store = []
    , count = 0
    ;

  options = options || {};
  options.threshold = options.threshold || 5; // how many times to send out a payload roughly.

  /**
   * Loop the payloads and add to store.
   */
  Object.keys(payloads).forEach(function(key, index){
    store.push(Payload.createPayload(payloads[key]));
  });

  function getLowestScored(cb) {
    /**
     * Originally had a weighted system to determine the availability, however
     * was removed because it is inefficient.
     */

    // var lowestPayload
    //   , lowestId
    //   ;
    // // var a = {a:1,b:1,c:1}; Object.keys(a); var b = a.a; delete a.a; a.a = b; Object.keys(a);
    // // var lowestId = Object.keys(store)[Math.floor(Math.random()*Object.keys(store).length)];
    // // var lowestPayload = store[lowestId];
    // Object.keys(store).forEach(function(id, index, array) {
    //   var value = store[id];
    //   if (lowestPayload === undefined) {
    //     lowestPayload = value;
    //     lowestId = id;
    //   } else if (lowestPayload.getScore() > value.getScore()) {
    //     lowestPayload = value;
    //     lowestId = id;
    //   }

    //   if (index === array.length - 1) {
    //     // ended
    //     cb({
    //         id: lowestId
    //       , payload: lowestPayload.get()
    //     });
    //   }
    // });

    /**
     * Simple get and pop.
     * This is useful for running everything once and quitting.
     */
    var item = store.shift();
    if (item !== undefined) {
      cb({
          id: count++
        , payload: item.get()
      });
    } else {
      cb();
    }
  }

  self.retrieveAPayload = function(cb){
    // get tasks which have been sent out the least
    getLowestScored(cb);
  };

  self.completePayload = function(id) {
    // var saved = store[id];
    // saved.increaseCompletedCount();
  };

  return self;
};