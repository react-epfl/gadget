app.factory('Spaces', function () {
  'use strict';

  var space = {};

  space.context = function(cb) {
    ils.getIls(function(response){
      cb(response);
    });
  };

  space.getActions = function(cb) {
    ils.getIls(function(ils_space){
      osapi.activitystreams.get({
        contextId: ils_space.id,
        contextType: '@space',
        "limit": "0",
        "discardVerbs": "accessed"
      }).execute(function (actions) {
        console.log(actions.list);
        var _actions = actions.list;
        _actions = _.filter(_actions, function(action){
          return action.verb == 'created' && action.object.objectType == 'Resource';
        });
        _actions = _.sortBy(_actions, function(action) {
          return action.published;
        });
        cb(_actions);
      });
    });
  };
  return space;
});
