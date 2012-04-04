var Payload = exports.createPayload = function(task) {
  var self = {}
    , sentOut = 0
    , completed = 0
    , score = 0 // this will be based on the number of times sent and completed, should be updated on every modifictation
    ;

  self.getTimesSent = function(){
    return sentOut;
  };

  self.getTimesCompleted = function(){
    return completed;
  };

  self.get = function() {
    sentOut++;
    return task;
  };

  self.increaseCompletedCount = function() {
    return completed++;
  };

  return self;
};