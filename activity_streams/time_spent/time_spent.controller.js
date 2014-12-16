app.controller('timeSpentGadget',
function ($scope, Spaces) {
  $scope.phases = [];
  $scope.users = [];

  $scope.minutes = 10; // 10 minutes of timeout by default
  var offlineTimeout;

  function addUser(action, cb) {
    if (!userAlreadyAdded(action)) {
      var user = {
        id: action.actor.id,
        displayName: action.actor.displayName,
        currentPhase: action.target.id,
        lastAccess: action.published,
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

  function addTimeToUser(user, timeToAdd) {
    if (typeof user.timeSpentIn[user.currentPhase] !== 'undefined') {
      user.timeSpentIn[user.currentPhase].add(moment.duration(timeToAdd));
    }
  }

  function updateUserTimeSinceLastAccess(action) {
    var userToUpdate = getUser(action);
    if (typeof userToUpdate !== 'undefined') {
      var timeToAdd = new Date(action.published).getTime() - new Date(userToUpdate.lastAccess).getTime();
      addTimeToUser(userToUpdate, timeToAdd);
      userToUpdate.lastAccess = action.published;
      userToUpdate.currentPhase = action.target.id;
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
    user = getUser(action);
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
    resetUserTimeout(action);
  }

  function computeLastTimeForEachUser() {
    _.each($scope.users, function (user) {
      var timeSinceLastAction = new Date().getTime() - new Date(user.lastAction).getTime();
      if (timeSinceLastAction > offlineTimeout) {
        addTimeToUser(user, offlineTimeout);
        user.currentPhase = null;
      } else {
        var timeToAdd = new Date().getTime() - new Date(user.lastAccess).getTime();
        addTimeToUser(user, timeToAdd);
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

  $scope.setUsersTimeout = function() {
    offlineTimeout = $scope.minutes * 60000;
  };

  $scope.init = function () {
    Spaces.context(function (response) {
      if (response != null && response != undefined && response.error == undefined) {
        socket.emit('enterspace', response.id);
        $scope.setUsersTimeout();
        $scope.findPhases(function() {
          $scope.findAccesses();

          //Listening to the new actions
          socket.on('action_created', function (action) {
            resetUserTimeout(action);
            if (action.verb == "accessed") {
              addUser(action, function() {
                changeUserCurrentPhase(action);
              });
            }
          });
        });
      } else {
        $scope.notInIlsMessage = 'Please, place this app in an inquiry space to visualise the time spent by users in inquiry phases.';
      }
      gadgets.window.adjustHeight();
    });
  };

  $scope.findPhases = function (cb) {
    Spaces.getPhases(function (phases) {
      $scope.phases = phases;
      $scope.$apply();
      cb();
    });
  };

  $scope.findAccesses = function () {
    Spaces.getActions(function (actions) {
      _.each(actions, function (action) {
        if (action.verb === 'accessed') {
          addUser(action, function() {
            updateUserTimeSinceLastAccess(action);
          });
        }
        var user = getUser(action);
        user.lastAction = action.published;
      });
      computeLastTimeForEachUser();
      updateAverageTime();
      $scope.$apply();
    });
  };

  $scope.startTimer = function () {
    var oneSecond = 1000;
    setInterval(function(){
      incrementUsersCurrentSpaceTimer(oneSecond);
      updateAverageTime();
      $scope.$apply();
    }, oneSecond);
  };

});

