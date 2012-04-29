/**
 * Payload class, this can be used to see how many time a payload has been sent out.
 */
var Payload = exports.createPayload = function(payload) {
  var self = {}
    , sentOut = 0
    , completed = 0
    , score = 1 // this will be based on the number of times sent and completed, should be updated on every modifictation
    ;

  // provides a metric which gages the popularity of the payload.
  function calculateScore() {
    var pi = 3.142;
    score = ((sentOut + 1) * ((completed + 1) * 4)) / pi;
  }

  /**
   * Getters and setters.
   */

  self.getTimesSent = function(){
    return sentOut;
  };

  self.getTimesCompleted = function(){
    return completed;
  };

  self.get = function() {
    sentOut++;
    calculateScore();
    return payload;
  };

  self.increaseCompletedCount = function() {
    completed++;
    calculateScore();
    return completed;
  };

  self.getScore = function(){return score;};
  return self;
};