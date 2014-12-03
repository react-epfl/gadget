app.factory('Spaces', function ($resource, $http) {
  'use strict';

  var space = {
    phases : [],
    lastActionByUser : [],
    ils_id : null
  };

  space.context = function(cb) {
    ils.getIls(function(ils_space){
      cb(ils_space.id);
    });
  }

  space.getPhases = function(cb) {
    ils.getIls(function(ils_space){

      osapi.spaces.get({contextId: ils_space.id, contextType: "@space"}).execute(function (subspaces){

        var phases = [];
        _.each(subspaces.list, function (subspace){
          if (subspace.spaceType != null
              && subspace.displayName != "About"
              && subspace.displayName != "Vault") {
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

  space.actions = function(cb) {
    ils.getIls(function(ils_space){
      osapi.activitystreams.get({contextId: ils_space.id, contextType: "@space", "minutes":"60"})
        .execute(function (actions) {
        var accesses = _.filter(actions.list, function(action){ return action.verb == "accessed" });
        var accessesByUser = _.toArray(_.groupBy(accesses, function(action){ return action.actor.id}));
        var lastActionByUser = [];
        _.each(accessesByUser, function (userAccesses) {
          var lastAction = _.last(_.sortBy(userAccesses, function(action){ return action.published }));
          lastActionByUser.push(lastAction);
        });
        cb(lastActionByUser);
      });
    });
  }
  return space;
});
