app.factory('Spaces', function () {
  'use strict';

  var space = {
    phases : [],
    lastActionByUser : [],
    ils_id : null
  };

  space.context = function(cb) {
    ils.getIls(function(response){
      cb(response);
    });
  };

  space.getPhases = function(cb) {
    ils.getIls(function(ils_space){

      osapi.spaces.get({contextId: ils_space.id, contextType: "@space"}).execute(function (subspaces){

        var phases = [];
        _.each(subspaces.list, function (subspace){
          if (subspace.spaceType !== null &&
              subspace.displayName != "About" &&
              subspace.displayName != "Vault") {
            phases.push({
              id: subspace.id,
              name: subspace.displayName,
              onlineUsers: []
            });
          }
        });
        cb(phases);
      });
    });
  };

  space.getActions = function(cb) {
    ils.getIls(function(ils_space){
      osapi.activitystreams.get({contextId: ils_space.id, contextType: "@space", "minutes":"180"})
        .execute(function (actions) {
        var accesses = _.filter(actions.list, function (action) {
          return (action.verb === "accessed" || action.verb === "logged out") &&
              action.target && action.target.objectType === "Space";
        });
        var accessesByUser = _.toArray(_.groupBy(accesses, function(action){ return action.actor.id; }));
        var lastActionByUser = [];
        _.each(accessesByUser, function (userAccesses) {
          var lastAction = _.last(_.sortBy(userAccesses, function(action){ return action.published; }));
          lastActionByUser.push(lastAction);
        });
        cb(lastActionByUser);
      });
    });
  };
  return space;
});
