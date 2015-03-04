app.controller('submittedFilesGadget',
function ($scope, Spaces) {
  $scope.users = [];

  function userAlreadyAdded(action) {
    var user = _.find($scope.users, function (user) {
      return user.id === action.actor.id;
    });
    return typeof user !== 'undefined';
  }

  function addUser(action) {
    var user = {
      id: action.actor.id,
      displayName: action.actor.displayName,
      submissions: []
    };
    $scope.users.push(user);
    return user;
  }

  function getUser(action) {
    return _.find($scope.users, function (user) {
      return user.id === action.actor.id;
    });
  }

  function addSubmission(action) {
    var user;
    if (!userAlreadyAdded(action)) {
      user = addUser(action);
    } else {
      user = getUser(action);
    }
    user.submissions.push(action);
    $scope.$apply();
    gadgets.window.adjustHeight();
  }

  $scope.init = function () {
    Spaces.context(function (response) {
      if (response != null && response != undefined && response.error == undefined) {
        socket.emit('enterspace', response.id);
        $scope.findActions();

        //Listening to the new actions
        socket.on('action_created', function (action) {
          if (action.verb == 'created' && action.object.objectType == 'Resource') {
            addSubmission(action);
          }
        });
      } else {
        $scope.notInIlsMessage = 'Please, place this app in an inquiry space to visualise the resources submitted by users in inquiry phases.';
        $scope.$apply();
      }
    return setTimeout(function() {
      gadgets.window.adjustHeight();
    }, 5000);
    });
  };

  $scope.findActions = function () {
    Spaces.getActions(function (actions) {
      console.log(actions);
      _.each(actions, function (action) {
        addSubmission(action);
      });
      $scope.$apply();
    });
  };

});

