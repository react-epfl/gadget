var isOwner = false;
var my = {};
var app = { context: "", viewerName: ""
          , data: { view: "" }
          , root_url: "http://graasp.epfl.ch/gadget/prod/app_view_with_user_tracking/"
          , user_name: ""
          }

// gets the data and calls build for container
var initialize = function() {

  // This container lays out and renders gadgets itself.
  my.LayoutManager = function() {
    shindig.LayoutManager.call(this);
  };

  my.LayoutManager.inherits(shindig.LayoutManager);

  my.LayoutManager.prototype.getGadgetChrome = function(gadget) {
    var chromeId = 'gadget-chrome-' + gadget.appId;
    return chromeId ? document.getElementById(chromeId) : null;
  };

  shindig.container.layoutManager = new my.LayoutManager();
  // to remove building prefs and title block in gadget
  shindig.Gadget.prototype.getContent=function(A){
    shindig.callAsyncAndJoin(["getMainContent"],function(B){A(B.join(""))},this)
  }
  
  //getting the user's settings
  getData(function (data) {
    app.viewer = data.viewer // .displayName
    app.viewerName = data.viewer.displayName
    var context = data.context // .contextId, .contextType
    app.context = context
    var prefix = (context.contextType === "@space") ? "s_" : "";
    app.contextId = prefix + context.contextId;
    app.owner = data.owner
    var appdata = data.appdata // .settings
    var apps = data.apps // .list
    var subspaces = data.spaces.list  //subspaces of the current space


    // add space title
    var currentSpace = data.currentSpace
    if (currentSpace) {
      $("#title").append(currentSpace.displayName)
      $("#description").append(currentSpace.description)
    }

    // current viewer is the owner, then show management block
    if (app.viewer.id === app.owner.id) {
      isOwner = true
    }

    // --- apps from space ---
    app.list = apps.list

    // build a hash containing {id, app} pairs from the space
    app.hash = {}
    app.sizeType = "px" // px or % to calculate the size
    app.order = [] // list of app ids
    app.sizes = {} // hash or app sizes {id: size, id: size}
    _.each(apps.list, function (item) {
      app.hash[item.id] = item
    })
    // -----------------------

    appdata = appdata[app.contextId]
    if (appdata) {
      app.data = JSON.parse(appdata.settings)

      app.order = app.data.order || []
      app.sizes = app.data.sizes || {}
      app.sizeType = app.data.sizeType || "px" // px or % to calculate the size
    }
    // set AppSize
    $('#select_button').val(app.sizeType)
    // refresh order of apps based on current spaces from the app
    refreshAppsList(app)

    buildSkeleton($("#tools"),app);

    $("#help_button").click(function(){
      $('#popup').show()
    })

    // build tabs for inquiry learning phases
    build_tabs(subspaces);

    // identify which user is using this url
    identifyUser();

    // We set three timeouts to make sure the apps are loaded to do proper resizing
    // if it take long time, it will be resized when mouse is moved above the app
    // 1 seconds
    setTimeout(adjustHeight,1000);
    // 3 seconds
    setTimeout(adjustHeight,3000);
    // 10 seconds
    setTimeout(adjustHeight,10000);
  });
  
};

// build tabs for inquiry learning phases
var build_tabs = function(subspaces) {
  var center = $("#center");
  var ils_cycle_tabs = $("#ils_cycle");
  var ils_phases = $("#ils_phases");
  _.each(subspaces, function(item) {
    var ils_tab = $("<li></li>");
    var tab_link = $("<a></a>").text(item.displayName);
    tab_link.attr("href", "#" + item.displayName);
    ils_tab.append(tab_link);
    ils_cycle_tabs.append(ils_tab);
    var phase = $("<div></div>").addClass("tab-pane");
    phase.attr("id", item.displayName);
    var phase_description = $("<div></div>").append(item.description);
    phase.append(phase_description);
    var phase_content = $("<div></div>");
    phase_content.attr("id", "phase_" + item.id);
    phase.append(phase_content);
    ils_phases.append(phase);
    getDataById(item.id, function (data) {
      
      var json = {};
      json.contextId = "s_" + item.id;
      
      json.hash = {};
      json.sizeType = "px";
      json.order = [];
      json.sizes = {};
      _.each(data.apps.list, function (elem){
        json.hash[elem.id] = elem;
      });
      var appdata = data.appdata[json.contextId];
      if (appdata) {
        json.data = JSON.parse(appdata.settings)
        json.order = json.data.order || []
        json.sizes = json.data.sizes || {}
        json.sizeType = json.data.sizeType || "px" // px or % to calculate the size
      }

      refreshAppsList(json);
      buildSkeleton(phase_content,json);

    });
  });

  // set the first tab active
  $('#ils_cycle a:first').tab('show');

  // set ils cycle tab events
  $('#ils_cycle a').click(function (e) {
    e.preventDefault();
    $(this).tab('show');
  });
  center.append(ils_cycle_tabs);
  center.append(ils_phases);
}


// identify which user is using this url
var identifyUser = function() {
  // check if the cookie exists, if not, set the cookie
  if ($.cookie('graasp_user')) {
    app.user_name = $.cookie('graasp_user');
    $('#hello_msg').text("Hello" + " " + app.user_name + "!");
    updateUserActions(app.user_name);
  } else {
    $('#login_popup').modal('show');
    $('#user_name').keyup(function(){
      if (event.keyCode === 13) {
        saveUserName();
      }})
    $('#ok_btn').click(function(){
      saveUserName();
    });
  }
}

// save user's name in appData and display user name on the page
var saveUserName = function() {
  app.user_name = $('#user_name').val();
  if (!app.user_name || /^\s*$/.test(app.user_name) || 0 === app.user_name.length) {
    $("#error_msg").show();
  } else{
    updateUserActions(app.user_name);
    $.cookie('graasp_user', app.user_name, { expires: 1 });
    $('#login_popup').modal('hide');
    $('#hello_msg').text("Hello" + " " + app.user_name + "!");
  }
}

// update user's last access time in appData
var updateUserActions = function(user_name) {
  var user_hash = {};
  var current_time = new Date();
  var user_actions = {};
  user_actions.last_access = current_time;
  user_hash[user_name] = JSON.stringify(user_actions);
  osapi.appdata.update(
    { userId: app.contextId, 
      data: user_hash
    }).execute(function() {})
}

// sets app sizes based on template
// always does it in %
var setViewSize = function (view) {
  var arr = []
  switch (view) {
    case '1':
      arr = [99]; break
    case '2':
      arr = [99, 99, 49.5]; break
    case '3':
      arr = [99, 49.5]; break
    case '4':
      arr = [99, 33]; break
    case '5':
      arr = [49.5]; break
    case '6':
      arr = [33]; break
  }
  var arrLength = arr.length
  var last = arr[arrLength - 1]
  _.each(app.order, function (id, i) {
    // for first items take from template, for the rest - all the same
    var size = (i < arrLength) ? arr[i] : last
    app.sizes[id] = size
  })
}
// builds sizes as % or px depending on chosen type
// and update the app.sizes accordingly
var rebuildSizes = function (parent) {
  var centerSize = $("#center").width()
  parent.find(".window").each(function (i) {
    var win = $(this)
      , appId = win.attr("appId")
      , size = win.width()
      , finalSize
    if (app.sizeType === "%") {
      finalSize = size*100/centerSize
      win.css("width", finalSize+"%")
      app.sizes[appId] = finalSize
    } else {
      //finalSize = size*centerSize/100
      finalSize = size
      win.css("width", finalSize+"px")
      app.sizes[appId] = finalSize
    }
  })
}
// type = % or px
var resizeAllApps = function (type) {
  type = type || app.sizeType
  var sizes = app.sizes
  $("#center").find(".window").each(function (i) {
    var win = $(this)
    var appId = win.attr('appId')
    win.css("width", sizes[appId]+type)
  })
}
// refreshes order of app, takes as the base appdata representation
// removes deleted app and adds new apps
var refreshAppsList = function (app_json) {
  // removes apps that are no longer in the space
  var savedIds = [] // list of valid ids that are in the app.order
  _.each(app_json.order, function (id, i) {
    if (!app_json.hash[id]) { // delete id since it does not exist anymore
      delete app_json.order[i]
      delete app_json.sizes[id]
    } else { // add to the current savedIds list
      savedIds.push(id)
    }
  })

  // appends new space apps to the end
  var curIds = _.keys(app_json.hash)
  var newIds = _.difference(curIds, savedIds)
  _.each(newIds, function (id) {
    app_json.order.push(id)
    app_json.sizes[id] = 300 // 300 - is the default width
  })

  save(true,app)
}

var adjustHeight = function () {
  gadgets.window.adjustHeight();
}

var buildSkeleton = function (container,app_json) {
  // var tools = $("#tools")
    // , context = app.context
    // , viewer = app.viewer

  // // warning message when no apps exist
  // if (app.list.length == 0) {
  //   $("#tools").append($('<span style="margin-left:20px">No apps exist in this space</span>'))
  //   return
  // }

  // build first drop_here block
  var fakeGadget = $('<div id="fake_gadget" appId="0"></div>')
    .append($('<div class="drop_here"></div>'))
  container.append(fakeGadget)

  // build apps
  _.each(app_json.order, function (id) {
    buildWindow(id, container, app_json)
  })
  // resize width of apps
  resizeAllApps()

  // //set fake gadget height to the height of the first app
  fakeGadget.height(container.find(".window").height())

  $(".window").draggable(
    { revert: "invalid"
    , start: function (ev, ui) {
        var g = $(ev.target)
        $(".window_placeholder").addClass("active")
        g.css("zIndex", 10)
      }
    , drag: function (ev, ui) {
        // disable the droppable before dragged item
        $(ev.target).prev().find(".drop_here").removeClass("active")
      }
    , stop: function (ev, ui) {
        $(".window_placeholder").removeClass("active")
        $(ev.target).css("zIndex", "auto")
      }
    })
  $(".window").resizable(
    { handles: "e"
    , maxWidth: "100%"
    , containement: "center"
    , start: function (ev, ui) {
        $(".window_placeholder").addClass("active")
        ui.element.css("position", "relative").css("left", "0").css("top", "0")
      }
    , resize: function (ev, ui) {
        ui.element.css("position", "relative").css("left", "0").css("top", "0")
      }
    , stop: function (ev, ui) {
        $(".window_placeholder").removeClass("active")
        // save new width
        var appId = ui.element.attr('appId')
        
        rebuildSizes(ui.element.parent())
        save(app)
      }
    })

  $(".drop_here").droppable(
    { hoverClass: "hover"
    , activeClass: "active"
    , tolerance: "pointer"
    , drop: function (ev, ui) {
        // insert dragged item after current droppable
        var prev = $(this).parent()
          , prevId = prev.attr('appId')
          , cur = ui.draggable
          , curId = cur.attr('appId')

        prev.after(ui.draggable)
        // set left and top to 0 for dragged item
        cur.css('left',0).css('top',0)
        // update order array
        app_json.order.splice(_.indexOf(app_json.order, curId), 1)
        var prevPos = (prevId == 0) ? 0 : (_.indexOf(app_json.order, prevId)+1)
        app_json.order.splice(prevPos, 0, curId)
        // build gadget content again (iframe is lost for some reason)
        buildGadget(curId, app_json)
        // save new position
        save()
      }
    })
}

var buildWindow = function (id, parent, app_json) {
  var gadget = app_json.hash[id]

  // build placeholder
  var blk = $("<div></div>")
    .addClass("window")
    .attr('appId', gadget.id)

  var title = $("<div></div>").addClass('gadgets-gadget-title-bar')
    .append($("<span></span>").text(gadget.displayName))
  blk.append(title)
  parent.append(blk)

  var gadget_el = $("<div></div>").attr('id', 'gadget-chrome-'+id)
  blk.append(gadget_el)
  buildGadget(id, app_json)

  blk.append($('<div class="window_placeholder"></div>'));
  blk.append($('<div class="drop_here"></div>'));
}
var buildGadget = function (id, app_json) {
  var gadget = app_json.hash[id]

  // get secure token for each widget from osapi.apps request
  var gadgetParams = 
    { specUrl: gadget.appUrl
    , height: '400px'
    , appId: id
    , secureToken: gadget.token
    }
  var gadgetEl = shindig.container.createGadget(gadgetParams)
  // if no token specified, make it anonymous by removing secureToken
  if (!gadget.token) {
    delete gadgetEl.secureToken
  }
  shindig.container.addGadget(gadgetEl);

  var gadget_el = $('<div><div>')
    .attr('id', 'gadget-chrome-'+id)
    .attr('appId', id)
    .addClass('gadget')

  $('#gadget-chrome-'+id).replaceWith(gadget_el)

  shindig.container.setView("home");
  shindig.container.renderGadget(gadgetEl);
}

// notHumanAct - save that is not initiated by a human
var save = function(notHumanAct, app_json){
  var humanAct = !notHumanAct
  //only owner can save changes
  if (humanAct && !isOwner) {
    $("#not_owner").show()
    return
  }
  if (isFreeze) {
    return
  }
  var data = {}
  data.order = app_json.order
  data.sizes = app_json.sizes
  data.sizeType = app_json.sizeType

  osapi.appdata.update(
    { userId: app_json.contextId
    , data: {"settings": JSON.stringify(data)}
    })
    .execute(function() {})
}

