var buildRadio = function (i) {
  var btn = $("<span></span>").attr('view',i).addClass("view_pic sprite view"+i)
    .mouseover(function (ev) {
      $(this).addClass("view"+i+"_blue")
    })
    .mouseout(function (ev) {
      $(this).removeClass("view"+i+"_blue")
    })
    .click(function (ev) {
      var view = $(ev.target).attr('view')
      setViewSize(view)
      resizeAllApps("%")
      rebuildSizes()
      save();
    });
  $('#menu').prepend(btn)
}
for (var i = 6; i >= 1; i--) {
  buildRadio(i)
}


var isOwner = false;
var my = {};
var app = { context: "", viewerName: ""
          , data: { view: "" }
          , root_url: "http://graasp.epfl.ch/gadget/prod/grid_view/"
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

    // add space title
    var currentSpace = data.currentSpace
    if (currentSpace) {
      $("#title").append(currentSpace.displayName)
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
    refreshAppsList()

    buildSkeleton();

    $("#help_button").click(function(){
      $('#popup').show()
    })

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

var sizeTypeChanged = function () {
  app.sizeType = $('#select_button').val()
  rebuildSizes()
  resizeAllApps()
  save()
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
var rebuildSizes = function () {
  var centerSize = $("#center").width()
  $("#center").find(".window").each(function (i) {
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
var refreshAppsList = function () {
  // removes apps that are no longer in the space
  var savedIds = [] // list of valid ids that are in the app.order
  _.each(app.order, function (id, i) {
    if (!app.hash[id]) { // delete id since it does not exist anymore
      delete app.order[i]
      delete app.sizes[id]
    } else { // add to the current savedIds list
      savedIds.push(id)
    }
  })

  // appends new space apps to the end
  var curIds = _.keys(app.hash)
  var newIds = _.difference(curIds, savedIds)
  _.each(newIds, function (id) {
    app.order.push(id)
    app.sizes[id] = 300 // 300 - is the default width
  })

  save(true)
}

var adjustHeight = function () {
  gadgets.window.adjustHeight();
}

var buildSkeleton = function () {
  var center = $("#center")
    , context = app.context
    , viewer = app.viewer

  // warning message when no apps exist
  if (app.list.length == 0) {
    $("#center").append($('<span style="margin-left:20px">No apps exist in this space</span>'))
    return
  }

  // build first drop_here block
  var fakeGadget = $('<div id="fake_gadget" appId="0"></div>')
    .append($('<div class="drop_here"></div>'))
  center.append(fakeGadget)

  // build apps
  _.each(app.order, function (id) {
    buildWindow(id, center)
  })
  // resize width of apps
  resizeAllApps()

  //set fake gadget height to the height of the first app
  fakeGadget.height(center.find(".window").height())

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
        rebuildSizes()
        save()
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
        app.order.splice(_.indexOf(app.order, curId), 1)
        var prevPos = (prevId == 0) ? 0 : (_.indexOf(app.order, prevId)+1)
        app.order.splice(prevPos, 0, curId)
        // build gadget content again (iframe is lost for some reason)
        buildGadget(curId)
        // save new position
        save()
      }
    })
}

var buildWindow = function (id, parent) {
  var gadget = app.hash[id]

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
  buildGadget(id)

  blk.append($('<div class="window_placeholder"></div>'));
  blk.append($('<div class="drop_here"></div>'));
}
var buildGadget = function (id) {
  var gadget = app.hash[id]

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
var save = function(notHumanAct){
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
  data.order = app.order
  data.sizes = app.sizes
  data.sizeType = app.sizeType

  osapi.appdata.update(
    { userId: app.contextId
    , data: {"settings": JSON.stringify(data)}
    })
    .execute(function() {})
}

