'use strict';

app.controller('timeSpentGadget',
function ($scope, Spaces) {
  $scope.phases = [];
  $scope.users = [];

  $scope.minutes = 10; // 10 minutes of timeout by default
  var offlineTimeout;
  var timer;

  $scope.startTime = new Date();
  $scope.startTime.setHours($scope.startTime.getHours()-3);
  $scope.endTime = new Date();
  $scope.noEndTime = true;

  function addUser(action, cb) {
    if (!userAlreadyAdded(action)) {
      var user = {
        id: action.actor.id,
        displayName: action.actor.displayName,
        currentPhase: action.target.id,
        lastAccess: action.published, // TODO: this attribute might not be necessary anymore.
        lastAction: action.published,
        timeSpentIn: {},
        timeout: setTimeout(function () {
          user.currentPhase = null;
        }, offlineTimeout)
      };
      _.each($scope.phases, function (phase) {
        user.timeSpentIn[phase.id] = moment.duration(0);
      });
      $scope.users.push(user);
      $scope.$apply();
      gadgets.window.adjustHeight();
    }
    cb();
  }

  function getUser(action) {
    return _.find($scope.users, function (user) {
      return user.id === action.actor.id;
    });
  }

  // If the last action occured before the begining of the period we want information (which is
  // possible as we look for actions `offlineTimetout` minutes before `$scope.startTime`), then
  // we want to count the time only from `$scope.startTime`
  function getFromTime(user) {
    var fromTime;
    var lastAction = new Date(user.lastAction);
    if (lastAction < $scope.startTime) {
      fromTime = $scope.startTime;
    } else {
      fromTime = lastAction;
    }
    return fromTime;
  }

  // Returns the end time depending if it is defined or not.
  function getEndTime() {
    var endTime;
    if ($scope.noEndTime) {
      endTime = new Date();
    } else {
      endTime = $scope.endTime;
    }
    return endTime;
  }

  function addTimeToUser(user, timeToAdd) {
    if (typeof user.timeSpentIn[user.currentPhase] !== 'undefined' && user.timeSpentIn[user.currentPhase] !== null && timeToAdd > 0) {
      user.timeSpentIn[user.currentPhase].add(moment.duration(timeToAdd));
    }
  }

  /*function updateUserTimeSinceLastAccess(action) {
    var userToUpdate = getUser(action);
    if (typeof userToUpdate !== 'undefined') {
      var timeToAdd = new Date(action.published).getTime() - new Date(userToUpdate.lastAccess).getTime();
      addTimeToUser(userToUpdate, timeToAdd);
      userToUpdate.lastAccess = action.published;
      userToUpdate.currentPhase = action.target.id;
    }
  }*/

  function updateUserTimeSinceLastAction(action) {
    var userToUpdate = getUser(action);
    if (typeof userToUpdate !== 'undefined') {
      var fromTime = getFromTime(userToUpdate);

      var timeSinceLastAction = new Date(action.published).getTime() - fromTime.getTime();

      if (timeSinceLastAction > offlineTimeout) {
        addTimeToUser(userToUpdate, offlineTimeout);
        userToUpdate.currentPhase = null;
      } else {
        addTimeToUser(userToUpdate, timeSinceLastAction);
        userToUpdate.currentPhase = action.target.id;
      }

      userToUpdate.lastAction = action.published;
      if (action.verb === 'accessed') {
        userToUpdate.lastAccess = action.published;
      }
    }
  }

  function updateAverageTime() {
    var totalTime;
    _.each($scope.phases, function (phase) {
      totalTime = 0;
      _.each($scope.users, function (user) {
        totalTime += user.timeSpentIn[phase.id];
      });
      phase.averageTime = moment.duration(totalTime / $scope.users.length);
    });
  }

  function resetUserTimeout(action) {
    var user = getUser(action);
    if (user) {
      clearTimeout(user.timeout);
      user.timeout = setTimeout(function () {
        user.currentPhase = null;
      }, offlineTimeout);
    }
  }

  function changeUserCurrentPhase(action) {
    var userToChangePhase = getUser(action);
    userToChangePhase.lastAccess = action.published;
    userToChangePhase.currentPhase = action.target.id;
  }

  function computeLastTimeForEachUser() {
    _.each($scope.users, function (user) {
      var fromTime = getFromTime(user);
      var endTime = getEndTime();
      var timeSinceLastAction = endTime.getTime() - fromTime.getTime();
      if (timeSinceLastAction > offlineTimeout) {
        addTimeToUser(user, offlineTimeout);
        user.currentPhase = null;
      } else {
        //var timeToAdd = new Date().getTime() - new Date(user.lastAccess).getTime();
        //addTimeToUser(user, timeToAdd);
        addTimeToUser(user, timeSinceLastAction);
      }
    });
  }

  function incrementUsersCurrentSpaceTimer(time) {
    _.each($scope.users, function (user) {
      addTimeToUser(user, time);
    });
  }

  function userAlreadyAdded(action) {
    var user = _.find($scope.users, function (user) {
      return user.id === action.actor.id;
    });
    return typeof user !== 'undefined';
  }

  function stopListeningForNewActions() {
    socket.removeAllListeners('action_created');
  }

  function startListeningForNewActions() {
    stopListeningForNewActions(); // To avoid duplicate listening
    socket.on('action_created', function (action) {
      resetUserTimeout(action);
      if (action.verb == 'accessed') {
        addUser(action, function() {
          changeUserCurrentPhase(action);
        });
      }
    });
  }

  function clearUsersData() {
    $scope.users = [];
  }

  function startTimer() {
    clearInterval(timer); // To avoid duplicate timer
    var oneSecond = 1000;
    timer = setInterval(function(){
      incrementUsersCurrentSpaceTimer(oneSecond);
      updateAverageTime();
      $scope.$apply();
    }, oneSecond);
  }

  function stopTimer() {
    clearInterval(timer);
  }

  $scope.setUsersTimeout = function() {
    offlineTimeout = $scope.minutes * 60000;
  };

  $scope.init = function () {
    Spaces.context(function (response) {
      if (response !== null && response !== undefined && response.error === undefined) {
        socket.emit('enterspace', response.id);
        $scope.setUsersTimeout();
        $scope.findPhases(function() {
          $scope.findAccesses();
          startListeningForNewActions();
        });
      } else {
        $scope.notInIlsMessage = 'Please, place this app in an inquiry space to visualise the time spent by users in inquiry phases.';
      }
      setTimeout(function() {
        gadgets.window.adjustHeight();
      }, 5000);
    });
    startTimer();
  };

  $scope.findPhases = function (cb) {
    Spaces.getPhases(function (phases) {
      $scope.phases = phases;
      $scope.$apply();
      cb();
    });
  };

  $scope.findAccesses = function () {
    // If we ask for a period of time where nothing happen but where users connected just before,
    // it won't be taken into consideration. Therefore we need to look for actions for
    // `offlineTimeout` minutes before the given startTime. Then we have to count only from
    // `$scope.startTime` in `updateUserTimeSinceLastAction()` and `computeLastTimeForEachUser()`.

    var startTime = new Date($scope.startTime.getTime() - offlineTimeout);
    var endTime = getEndTime();

    Spaces.getActions(startTime, endTime, function (actions) {
      _.each(actions, function (action) {
        /*if (action.verb === 'accessed') {
          addUser(action, function() {
            updateUserTimeSinceLastAccess(action);
          });
        }*/
        addUser(action, function() {
          updateUserTimeSinceLastAction(action);
        });
      });
      computeLastTimeForEachUser();
      updateAverageTime();
      $scope.$apply();
    });
  };

  $scope.fetchDataFromPeriod = function() {
    if ($scope.noEndTime) {
      clearUsersData();
      $scope.findAccesses();
      startListeningForNewActions();
      startTimer();
    } else {
      stopTimer();
      stopListeningForNewActions();
      clearUsersData();
      $scope.findAccesses();
    }
  };

});

