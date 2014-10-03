var metadataHandler = undefined;
var actionLogger = undefined;
var isOwner = false;
var my = {};
var app = { context: "", viewerName: ""
          , data: { view: "" }
          , root_url: "http://graasp.epfl.ch/gadget/prod/ils_metawidget_graaspeu/"
          , user_name: ""
          , prefs: new gadgets.Prefs()
}
var ILS = { name: "",
            id: ""};

// Identify which user is using this url
// The ILS is not initialized unless a valid nickname is found

var initialize_user = function(){
    if ($.cookie('graasp_user')) {
        app.user_name = $.cookie('graasp_user');
        animate_logo();
        //updateUserActions(app.user_name); //Temporarily Deactivated
        initialize_ils();
    } else {
        $("#loader-image-static").show();
        $("#loader-image").hide();
        $('#name_prompt').fadeIn(1500);
        $('#user_name').keyup(function(event){
            if (event.keyCode === 13) {
                if (checkUserName()){
                    init_actions();
                }else{
                    show_error_msg();
                }
            }});
    }

    //Specifies a series of actions to be taken for initialization
    var init_actions=function(){
        animate_logo();
        saveUserName();
        initialize_ils();
    }

    var show_error_msg=function(){
        $("#name_prompt").effect("shake");
        $("#enter_name_text").hide();
        $("#error_name_text").show();
    }
}

// gets the data and calls build for container
var initialize_ils = function() {

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

  // make toolbar togglable
  $("#tools_title").click(function() {
    $(this).toggleClass("expanded");
    var tools_panel = document.getElementById("tools_content");
    var main_block = document.getElementById("main_block");
    if ((tools_panel.style.display == 'none') || (tools_panel.style.display == '')) {
      $("#tools_content").animate({ height: "toggle"}, "slow",function() { //added slide effect
        // Animation complete fuction
          if(app.list.length > 0) {
              main_block.style.bottom = "495px";
          }
      });
      $("#arrow_down").show();
      $("#arrow_up").hide();

    } else {
      $("#tools_content").animate({ height: "toggle"}, "slow"); //added slide effect
      $("#arrow_down").hide();
      $("#arrow_up").show();
      if(app.list.length > 0) {
        main_block.style.bottom = "40px";
      }
    }
  });

  //getting the user's settings
  getData(function (data) {
    app.viewer = data.viewer; // .displayName
    app.viewerName = data.viewer.displayName;
    var context = data.context; // .contextId, .contextType
    app.context = context;
    var prefix = (context.contextType === "@space") ? "s_" : "";
    app.contextId = prefix + context.contextId;
    app.owner = data.owner;
    var appdata = data.appdata; // .settings
    var apps = data.apps; // .list
    var subspaces = get_visible_spaces(data.spaces.list);  //subspaces of the current space

    // add space title and description
    var currentSpace = data.currentSpace;
    ILS.name=currentSpace.displayName;
    ILS.id=currentSpace.id;
    if (currentSpace) {
      $("#title").append(ILS.name);
      if (currentSpace.description !="" ){ // when there is a valid description
        $("#description").append(currentSpace.description);
      }
      else { //when there is not a valid description
        $("#description_block").hide(); // remove the description block
      }
    }

    // current viewer is the owner, then show management block
    if (app.viewer.id === app.owner.id) {
      isOwner = true;
    }

    // --- apps from space ---
    app.list = apps.list;

    //Check if there are available apps
    if (app.list.length>0)
    {
        // build a hash containing {id, app} pairs from the space
        app.hash = {};
        app.sizeType = "px"; // px or % to calculate the size
        app.order = []; // list of app ids
        app.sizes = {}; // hash or app sizes {id: size, id: size}
        _.each(apps.list, function (item) {
        app.hash[item.id] = item;
        });
        // -----------------------

        refreshItemsList(app);

        buildSkeleton($("#tools_content"),app, app, false);
    } else {
        // What to do when there re no apps  
        toggle_toolbar(); // Hide the toolbar
    }
    $("#help_button").click(function(){
      $('#popup').show();
    });


    // build tabs for inquiry learning phases
    build_tabs(subspaces);

    // We set three timeouts to make sure the apps are loaded to do proper resizing
    // if it take long time, it will be resized when mouse is moved above the app
    // 1 seconds
    setTimeout(adjustHeight,1000);
    // 3 seconds
    setTimeout(adjustHeight,3000);
    // 10 seconds
    setTimeout(adjustHeight,10000);

      welcome_user();
        
    try{
      applyNewLayout();
    }catch(err){
      console.log("Couldn't apply new layout!");
    }

    //Initialize activity streams via MetadataHandler and ActionLogger
    init_activity_streams(); 
    //Sends the access verb in action logging when the user is logged in
    setTimeout(function(){sendStream("access","ILS","")},5000); 
    
  });

};

// toggle toolbar 
var toggle_toolbar = function () {
    $('#toolbar').hide(); //remove toolbar
    $("#main_block").css('bottom','0px'); //extend main block
    $("#container").css("margin-bottom", "0px");
};


// build tabs for inquiry learning phases
var build_tabs = function(subspaces) {
  var center = $("#center");
  var ils_cycle_tabs = $("#ils_cycle");
  var ils_phases = $("#ils_phases");
  _.each(subspaces, function(item) {
    var ils_tab = $("<li></li>");
    var tab_link = $("<a></a>").text(item.displayName);
    tab_link.attr("href", "#" + item.id);
    ils_tab.append(tab_link);
    ils_cycle_tabs.append(ils_tab);
    var phase = $("<div></div>").addClass("tab-pane");
    phase.attr("id", item.id);
    var phase_description = $("<div></div>").append(item.description);
    phase.append(phase_description);
    var phase_content = $("<div></div>");
    phase_content.attr("id", "phase_" + item.id);
    phase.append(phase_content);
    ils_phases.append(phase);
    getDataById(item.id, function (data) {

      var itemsIds=$('iframe').map(function() { return $(this).attr('name') }).get() //An array of all names/ids of iframes (apps that run in an iframe in the description)
      var json_app = buildJson(data.apps, data, itemsIds, item);
      var json_allItems = buildJson(data.items, data, itemsIds, item);

      refreshItemsList(json_app);
      refreshItemsList(json_allItems);
      buildSkeleton(phase_content, json_app, json_allItems, true);

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
};

// get the visible spaces from the subspaces array
var get_visible_spaces = function(subspaces) {
  var visible_spaces = _.filter(subspaces, function(item) {
    return ( (item.spaceType == "ils") ||
      ((item.spaceType == "folder") && (item.visibilityLevel != "hidden") && (item.metadata === undefined)) ||
      ((item.spaceType == "folder") && (item.visibilityLevel != "hidden") && (item.metadata.type != "Vault")&& (item.metadata.type != "About")));
  });
  return visible_spaces;
};

// build the json from a list and data

var buildJson = function(list, data, itemsIds, item) {
  var json = {};
  jsoncontextId = "s_" + item.id;

  json.hash = {};
  json.sizeType = "px";
  json.order = [];
  json.sizes = {};
  _.each(list, function (elem){
    if (itemsIds.indexOf(elem.id)==-1) //if the id of this widget is not found in the description
    {
      json.hash[elem.id] = elem; //add the widget to the widget list to be rendered
    }
  });
  var appdata = data.appdata[json.contextId];
  if (appdata) {
    json.data = JSON.parse(appdata.settings);
    json.order = json.data.order || [];
    json.sizes = json.data.sizes || {};
    json.sizeType = json.data.sizeType || "px"; // px or % to calculate the size
  }

  return json;
}

// Displays welcome message to user
var welcome_user = function(){
    $('#hello_msg').text(app.prefs.getMsg("hello") + " " + app.user_name + "!");
};

// save user's name in appData and display user name on the page
var saveUserName = function() {
    //updateUserActions(app.user_name); //Temporarily Deactivated
    $.cookie('graasp_user', app.user_name, { expires: 1 });
};

// Validates the entered username
var checkUserName = function(){
    app.user_name = $('#user_name').val();
    if (app.user_name && /^\w+$/.test(app.user_name) && app.user_name.length<=14) {
        return app.user_name;
    }
    else{
        return false;
    }
};

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
var refreshItemsList = function (app_json) {
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

var buildSkeleton = function (container, app_json, all_json, is_center) {
  // build first drop_here block
  var fakeGadget = $('<div id="fake_gadget" appId="0"></div>')
    .append($('<div class="drop_here"></div>'))
  container.append(fakeGadget)

  // build apps
  _.each(all_json.order, function (id) {
    //check if it is an app: buildApp or not: buildDoc.
    if(app_json.order.indexOf(id) != -1) {
      buildWindowApp(id, container, app_json, is_center)
    } else {
      buildWindowDoc(id, container, all_json, is_center)
    }
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
        buildGadget(curId, app_json, is_center)
        // save new position
        save()
      }
    })
}

//display when is an app
var buildWindowApp = function (id, parent, app_json, is_center) {
  var gadget = app_json.hash[id]

  var description = $("<div></div>").append(gadget.description);
  parent.append(description);
  
  // build placeholder
  var blk = $("<div></div>")
    .addClass("window")
    .attr('appId', gadget.id)

  parent.append(blk)

  var gadget_el = $("<div></div>").attr('id', 'gadget-chrome-'+id)
  blk.append(gadget_el)
  buildGadget(id, app_json, is_center)

  blk.append($('<div class="window_placeholder"></div>'));
  blk.append($('<div class="drop_here"></div>'));
}

//display other formats than apps (documents, images, videos, ..)
var buildWindowDoc = function (id, parent, doc_json, is_center) {
  var doc = doc_json.hash[id];
  // build placeholder
  var title = doc.displayName;
  //  URL for development purposes (local)
  // var itemUrl = window.location.protocol+"//"+window.location.hostname+":9091"+"/resources/"+id+"/raw";
  var itemUrl = "http://graasp.eu"+"/resources/"+id+"/raw";

  var descrToDisplay = $("<div></div>").append(doc.description);
  var docType = title.substr(title.lastIndexOf("."), title.length);
  var $docToDisplay;
  switch (docType) {
    case ".drw":
    case ".gif":
    case ".jpg":
    case ".jpeg":
    case ".png":
    case ".svg":
    case ".tif":
    case ".tiff":
    case ".vsd":
      $docToDisplay = $('<img></img>');
      $docToDisplay.attr("class", "resource_content");
      $docToDisplay.attr("src", itemUrl);
      break;
    case ".acm":
    case ".aif":
    case ".asf":
    case ".avi":
    case ".bun":
    case ".caf":
    case ".csh":
    case ".flv":
    case ".omf":
    case ".mid":
    case ".mov":
    case ".mp3":
    case ".mp4":
    case ".mpg":
    case ".mus":
    case ".m3u":
    case ".m4a":
    case ".nsf":
    case ".oga":
    case ".ogg":
    case ".ram":
    case ".rm":
    case ".sib":
    case ".sty":
    case ".swf":
    case ".vag":
    case ".vlc":
    case ".wav":
    case ".wma":
    case ".wmv":
    case ".3pg":
      $docToDisplay = $('<video controls></video>');
      $docToDisplay.attr("class", "resource_content");
      $docToDisplay.attr("src", itemUrl);
      $docToDisplay.attr("type", "video/"+docType);
      break;
    case ".txt":
      $docToDisplay = $('<div></div>').addClass("content");
      var $txt = $('<object data="'+itemUrl+'" type="text/plain" width="100%" height="100%"></object>');
      $docToDisplay.append($txt)
      break;
    case ".pdf":
      $docToDisplay = $('<div ng-swipe-left="prev()" ng-swipe-right="next()"></div>').addClass("content");
      var $pdf = $('<object data="'+itemUrl+'" type="application/pdf" width="100%" height="100%"></object>');
      $docToDisplay.append($pdf)
      break;
    default:
      if (doc.embeddedHTML!=undefined && doc.embeddedHTML!=""){
        $docToDisplay = $(doc.embeddedHTML);
        break;
      }else{
        $docToDisplay = $('<div class="resource_error"></div>').text("[The file format is not yet supported.]");
      }    
  }

    parent.append(descrToDisplay);
    parent.append($("<br>"));
    parent.append($docToDisplay);
    parent.append($("<br>"));
}}

// is_center indicates if the gadget is in the center or at the bottom tool bar
var buildGadget = function (id, app_json, is_center) {
  var gadget = app_json.hash[id];
  var lang = app.prefs.getLang(); //get the language
  var country = app.prefs.getCountry(); //and the country
  shindig.container.setLanguage(lang); // set the language to shingig
  shindig.container.setCountry(country); // and the country

  // get secure token for each widget from osapi.apps request
  var gadgetParams =
    { specUrl: gadget.appUrl
    , appId: id
    , secureToken: gadget.token
    }
  // for gadgets in the center, use the height of the gadgets themselves
  // for gadgets at the bottom tool bar, set height as 400px
  var gadget_size = {};
  if(is_center){
    gadget_size = getGadgetSize(gadget.appUrl);
    if(gadget_size['gadgetHeight'] != "")
      gadgetParams['height'] = gadget_size['gadgetHeight'];
    else
      gadgetParams['height'] = '400px';
  }else{
    gadgetParams['height'] = '400px';
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
    .addClass('gadget');

  $('#gadget-chrome-'+id).replaceWith(gadget_el);

  // for gadgets in the center, if the width is not empty and less than 876, use the original width
  // otherwise, use 876px
  // for gadgets at the bottom tool bar, use the default width 300px
  if(is_center){
    if((gadget_size['gadgetWidth'] != "") && (parseInt(gadget_size['gadgetWidth']) < 876))
      $('#gadget-chrome-'+id).css('width', parseInt(gadget_size['gadgetWidth']) + 'px');
    else
      $('#gadget-chrome-'+id).css('width', '876px');
  }

  shindig.container.setView("home");
  shindig.container.renderGadget(gadgetEl);
}

// get the size of gadget before rendering it
var getGadgetSize = function(gadgetUrl){
  var xhr = new XMLHttpRequest();
  var shindig_context = {
    "view": "canvas",
    "container": "default"
  }
  var shindig_gadgets = new Array();
  shindig_gadgets[0] = {
    "url": gadgetUrl,
    "moduleId": 0
  }
  var shindig_data = {
    "context": shindig_context,
    "gadgets": shindig_gadgets
  }
  str_data = JSON.stringify(shindig_data);

  var host_url=window.location.host.toString(); //Gets the current host and uses it to switch between development and production in the following URL
  // for testing on developement machine use port 8080
  xhr.open( "POST", "http://"+host_url+":80/gadgets/metadata?st=0:0:0:0:0:0:0", false );
  xhr.setRequestHeader("Content-type", "application/json");
  xhr.setRequestHeader("Accept", "application/json");
  xhr.send(str_data);

  var shindig_response = JSON.parse(xhr.responseText);
  var h_gadget = shindig_response['gadgets'][0]['height']?shindig_response['gadgets'][0]['height']:"";
  var w_gadget = shindig_response['gadgets'][0]['width']?shindig_response['gadgets'][0]['width']:"";
  var s_gadget = {
    gadgetHeight: h_gadget,
    gadgetWidth: w_gadget
  }
  return s_gadget;
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

var init_activity_streams=function() {
    var documentType = "newDocumentType";
    var toolName = "ILS Metawidget";
    var initialMetadata = {
        "id": "",
        "published": "",
        "actor": {
            "objectType": "person",
            "id": "unknown",
            "displayName": "unknown"
        },
        "target": {
            "objectType": "unknown",
            "id": generateUUID(),
            "displayName": "unknown"
        },
        "generator": {
            "objectType": "application",
            "url": window.location.href,
            "id": generateUUID(),
            "displayName": toolName
        },
        "provider": {
            "objectType": "ils",
            "url": window.location.href,
            "id": "unknown",
            "inquiryPhase": "unknown",
            "displayName": "unknown"
        }
    };


    new window.golab.ils.metadata.GoLabMetadataHandler(initialMetadata, function (error, createdMetadataHandler) {
        if (error) {
            console.log(error);
        } else {
            metadataHandler = createdMetadataHandler;
            actionLogger = new window.ut.commons.actionlogging.ActionLogger(metadataHandler);
//            actionLogger.setLoggingTargetByName("console");
//            actionLogger.setLoggingTargetByName("consoleShort");
            actionLogger.setLoggingTargetByName("opensocial");
//            actionLogger.setLoggingTargetByName("dufftown");
        }
    });
}

$(document).ready(function(){
    $('body').on('click','.nav-tabs>li>a', function (e) {
        var ils_active_phase={
            id:this.attributes["href"].value.slice(1),
            name:this.innerHTML
        };
        sendStream("access","PHASE",ils_active_phase);
    });

    $('body').on('click','#tools_title', function (e) {
        if ($(this).hasClass("expanded")){
            sendStream("access","TOOLBAR","");
        }
    });
});


function sendStream(action,log_type,ils_active_phase){
    var phase_target={};
    var ILSLogObject={};

    if (log_type=="ILS"){
         phase_target={
            "objectType": "ils",
            "id": ILS.id,
            "displayName":ILS.name
        }
    }else if (log_type=="PHASE"){
        phase_target={
            "objectType": "phase",
            "id": ils_active_phase.id,
            "displayName":ils_active_phase.name
        }

    }else if(log_type=="TOOLBAR"){
         phase_target={
            "objectType": "toolbar",
            "id": ILS.id,
            "displayName":"toolbar"
        }
    }

    metadataHandler.setTarget(phase_target);

    ILSLogObject = {
        objectType: "ILS_Log_Object",
        id: generateUUID(),
        log_type: log_type,
        ils_name: ILS.name,
        ils_id: ILS.id,
        ils_active_phase_name: ils_active_phase.name,
        ils_active_phase_id: ils_active_phase.id
    };

    if (actionLogger&&metadataHandler) {
        actionLogger.log(action, ILSLogObject);
    }else{
        console.log("Could not log action "+action+". Action Logging not initialized properly.")
    }
}


var generateUUID = (function() {
    function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
    }
    return function() {
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
            s4() + '-' + s4() + s4() + s4();
    };
})();
