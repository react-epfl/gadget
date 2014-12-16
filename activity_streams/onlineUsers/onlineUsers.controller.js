app.controller('onlineUsersGadget',
function ($scope, $timeout, Spaces) {
  $scope.phases = [];

  $scope.minutes = 10; // 10 minutes of timeout by default
  var offlineTimeout;
  var idleTimeout;

  var usersIdleTimeout = {};
  var usersOfflineTimeout = {};

  function connectUserToPhase(action) {
    removeUserFromAllPhases(action);
    addUserToPhase(action);
  }

  function addUserToPhase(action) {
    var phaseToAddUser = _.find($scope.phases, function (phase) {
      return phase.id === action.target.id;
    });
    $timeout(function() {
      //if phaseToAddUser is undefined, it means the phase is not in the gadget (e.g. for the root of the ILS)
      if (typeof phaseToAddUser !== 'undefined') {
        //From the socket, the url of the gravatar is in action.actor.image
        //and from activitystreams, the url is in action.actor.image.url
        //Temparory workaround:
        var avatar;
        if (typeof action.actor.image === 'undefined') {
          avatar = '';
        } else if (typeof action.actor.image.url !== 'undefined') {
          avatar = action.actor.image.url;
        } else {
          avatar = action.actor.image;
        }
        var userAlreadyInPhase = _.find(phaseToAddUser.onlineUsers, function (user) {
          return user.id === action.actor.id;
        });
        if (!userAlreadyInPhase) {
          phaseToAddUser.onlineUsers.push({
            id: action.actor.id,
            displayName: action.actor.displayName,
            avatar: avatar
          });
        }
      }
    });

    resetUserTimeouts(action);
  }

  function removeUserFromAllPhases(action) {
    var userToRemove = null;

    _.each($scope.phases, function (phase) {
      userToRemove = _.find(phase.onlineUsers, function (user) {
          return user.id === action.actor.id;
      });
      $scope.$apply(function() {
        phase.onlineUsers = _.without(phase.onlineUsers, userToRemove);
      });
    });
  }

  function resetUserTimeouts(action) {
    clearTimeout(usersIdleTimeout[action.actor.id]);
    clearTimeout(usersOfflineTimeout[action.actor.id]);

    // After 'idleTimeout' minutes without changing phases, users are considered idle.
    usersIdleTimeout[action.actor.id] = setTimeout(function () {
      $("#user-" + action.actor.id).attr('class','idle');
    }, idleTimeout);

    // After 'offlineTimeout' minutes without changing phases, users are considered offline.
    usersOfflineTimeout[action.actor.id] = setTimeout(function () {
      removeUserFromAllPhases(action);
    }, offlineTimeout);
  }

  $scope.setUsersTimeout = function() {
    offlineTimeout = $scope.minutes * 60000;
    idleTimeout = 0.9 * offlineTimeout;
  };

  $scope.init = function () {
    Spaces.context(function (response) {
      if (response != null && response != undefined && response.error == undefined) {
        socket.emit('enterspace', response.id);
        $scope.setUsersTimeout();

        //Listening to the new actions
        socket.on('action_created', function (action) {
          resetUserTimeouts(action);

          if (action.verb == "accessed") {
            connectUserToPhase(action);
          }
        });

        $scope.findPhases();
        $scope.findActivities();
      } else {
        $scope.notInIlsMessage = 'Please, place this app in an inquiry space to get visualise who is active in which inquiry phase.';
        $scope.$apply();
      }
      gadgets.window.adjustHeight();
    });
  };

  $scope.findPhases = function () {
    Spaces.getPhases(function (phases) {
      $scope.phases = phases;
      $scope.$apply();
      gadgets.window.adjustHeight();
    });
  };

  $scope.findActivities = function () {
    Spaces.actions(function (actions) {
      _.each(actions, function (action) {
        addUserToPhase(action);
        $scope.$apply();
      });
    });
  };

  $scope.getPhaseClass = function(nbConnectedUsers) {
    if (nbConnectedUsers >= 13) {
      return "a-lot";
    } else if (nbConnectedUsers <= 6) {
      return "few";
    } else {
      return "";
    }
  };

  $scope.getTotalConnectedUsers = function() {
    var total = 0;
    var nbPhases =  $scope.phases.length;
    for(var i = 0; i < nbPhases; i++) {
      //We just wait for 100ms in case a user change space
        total += $scope.phases[i].onlineUsers.length;
    }
    return total;
  };

});

