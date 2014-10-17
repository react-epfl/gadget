// no appdata calls if isFreeze set to true
var isFreeze = false

// gets data from the container and returns the object containing all
// data retrieved
// calls callback once data is received and passed to it the build data object
function getData(callback) {
  var output = {}
  //getting the user's settings
  var batch = osapi.newBatch();
  batch.add('viewer', osapi.people.getViewer());
  batch.add('context', osapi.context.get());
  batch.execute(function(data){
    output.viewer = data.viewer;
    var context = data.context;
    output.context = context;
    var contextId = context.contextId;
    var contextType = context.contextType;
    var prefix = (contextType === "@space") ? "s_" : "";
    var prefixContextId = prefix + contextId;
    var batch = osapi.newBatch();
    
    batch.add('owner', osapi.people.getOwner());
    batch.add('currentSpace', osapi.spaces.get({contextId: contextId}));
    batch.add('spaces', osapi.spaces.get({contextId: contextId, contextType: contextType}));
    batch.add('appdata', osapi.appdata.get({userId: prefixContextId, appId: contextId}));
    batch.add('apps', osapi.apps.get({contextId: contextId, contextType: contextType}));
    
    batch.execute(function(res){
      output.owner = res.owner;
      output.apps = res.apps;
      output.appdata = res.appdata;
      output.currentSpace = res.currentSpace;
      output.spaces = res.spaces;
      callback(output);
    });
  });

}

function getDataById(space, callback) {
  var output = {};
  var contextType = "@space";
  var contextId = space.parentId;
  var prefixContextId = "s_" + space.id;
  var batch = osapi.newBatch();
  
  batch.add('appdata', osapi.appdata.get({userId: prefixContextId, appId: contextId}));
  batch.add('apps', osapi.apps.get({contextId: space.id, contextType: contextType}));
  batch.add('spaces', osapi.spaces.get({contextId: space.id, contextType: contextType}));

  batch.execute(function(res){
    output.appdata = res.appdata;
    output.apps = res.apps.list;
    output.items = res.spaces.list;
    callback(output);
  }); 
}
