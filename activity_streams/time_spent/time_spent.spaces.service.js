app.factory('Spaces', function () {
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
              name: subspace.displayName
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
        var accesses = _.sortBy(actions.list, function(action) {
          return action.published;
        });
        cb(accesses);
      });
    });
  };
  return space;
});
