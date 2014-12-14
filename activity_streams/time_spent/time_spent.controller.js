app.controller('timeSpentGadget',
function ($http, $scope, $resource, $timeout, Spaces) {
  $scope.phases = [];
  $scope.users = [];

  $scope.minutes = 10; // 10 minutes of timeout by default
  var offlineTimeout;

  //Listening to the new actions
  socket.on('action_created', function (action) {
    resetUserTimeout(action);
    if (action.verb == "accessed") {
      //console.log('New access by ' + action.actor.displayName);
      addUser(action, function() {
        changeUserCurrentPhase(action);
      });
    }
  });

  function addUser(action, cb) {
    if (!userAlreadyAdded(action)) {
      //From the socket, the url of the gravatar is in action.actor.image
      //and from activitystreams, the url is in action.actor.image.url
      //Temparory workaround:
      if (typeof action.actor.image === 'undefined') {
        var avatar = '';
      } else if (typeof action.actor.image.url !== 'undefined') {
        var avatar = action.actor.image.url;
      } else {
        var avatar = action.actor.image;
      }
      var user = {
        id: action.actor.id,
        displayName: action.actor.displayName,
        avatar: avatar,
        currentPhase: action.object.id,
        lastAccess: action.published,
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
      console.log('User ' + user.displayName + ' added');
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
      //console.log("Adding " + timeToAdd + "ms to " + user.currentPhase + " for " + user.displayName);
      user.timeSpentIn[user.currentPhase].add(moment.duration(timeToAdd));
    }
    //console.log(user.timeSpentIn);
  }

  function updateUserTimeSinceLastAction(action) {
    var userToUpdate = getUser(action);
    if (typeof userToUpdate !== 'undefined') {
      var timeToAdd = new Date(action.published).getTime() - new Date(userToUpdate.lastAccess).getTime();
      addTimeToUser(userToUpdate, timeToAdd);
      userToUpdate.lastAccess = action.published;
      userToUpdate.currentPhase = action.object.id;
    }
  }

  function updateAverageTime() {
    var totalTime;
    _.each($scope.phases, function (phase) {
      totalTime = 0;
      _.each($scope.users, function (user) {
        totalTime += user.timeSpentIn[phase.id];
      })
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
    userToChangePhase.currentPhase = action.object.id;
    resetUserTimeout(action);
  }

  function computeLastTimeForEachUser() {
    _.each($scope.users, function (user) {
      var timeToAdd = new Date().getTime() - new Date(user.lastAccess).getTime();
      addTimeToUser(user, timeToAdd)
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
    console.log(offlineTimeout);
  }

  $scope.init = function () {
    Spaces.context(function (context) {
      socket.emit('enterspace', context);
    });
    $scope.setUsersTimeout();
    $scope.findPhases();
    $scope.findLastAccesses();
  };

  $scope.findPhases = function () {
    Spaces.getPhases(function (phases) {
      $scope.phases = phases;
      $scope.$apply();
    });
  };

  $scope.findLastAccesses = function () {
    Spaces.getLastAccesses(function (actions) {
      _.each(actions, function (action) {
        addUser(action, function() {
          updateUserTimeSinceLastAction(action);
        });
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
  }

});

