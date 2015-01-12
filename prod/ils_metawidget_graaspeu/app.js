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
    clearInterval(initIntervalTimer);
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
      $("#tools_content").animate({ height: "toggle"}, "slow");
      $("#arrow_down").show();
      $("#arrow_up").hide();
    } else {
      $("#tools_content").animate({ height: "toggle"}, "slow"); //added slide effect
      $("#arrow_down").hide();
      $("#arrow_up").show();

      }
  });

 //getting the user's settings
 getData(function (data) {
    app.viewer = data.viewer;
    app.viewerName = data.viewer.displayName;
    app.context = data.context;
    var prefix = (data.context.contextType === "@space") ? "s_" : "";
    app.contextId = prefix + data.context.contextId;
    app.owner = data.owner;

    var appdata = data.appdata; // .settings
    var apps = data.apps; // .list
    var subspaces = get_visible_spaces(data.spaces.list);  //subspaces of the current space
    var currentSpace = data.currentSpace;

    //try to get and cache the background image of the space, if any.
     try{
         app.backgroundImage = currentSpace.background.image?currentSpace.background.image:"";
         img = new Image();
         img.src = item.background.image;
         img_default= new Image();
         img_default.src="http://graasp.epfl.ch/gadget/prod/ils_metawidget_graaspeu/bg.jpg";
     }catch(err){
         app.backgroundImage="";
     }
     //try to get the background color of the space, if any.
     try{
         app.backgroundColor=currentSpace.background.color?currentSpace.background.color:"";
     }catch(err){
         app.backgroundColor="";
     }

     // add space title and description
     if (currentSpace) {
         ILS.name=currentSpace.displayName;
         ILS.id=currentSpace.id;
         $("#title").append(ILS.name);
         if (currentSpace.description && currentSpace.description.replace(/[\s|&nbsp;]+/gi,'') !="" && $(currentSpace.description).text()!=""){ // when there is a valid description
             $("#description").append(currentSpace.description);
         }
         else { //when there is not a valid description
             $("#description_block").remove(); // remove the description block
         }
     }

    // current viewer is the owner, then show management block
    if (app.viewer.id === app.owner.id) {
      isOwner = true;
    }

    //Check if there are available apps
    if (apps.list.length>0){
        // build a list with the app ids to be visualized
        var itemsIds= [];
        _.each(apps.list, function (item) {
            itemsIds.push(item);
        })

        var json_app = buildJson(apps.list, data.appdata, itemsIds, currentSpace.id);
        var json_allItems = buildJson(data.spaces.list, data.appdata, itemsIds, currentSpace.id);

        refreshItemsList(json_app);
        refreshItemsList(json_allItems);

        json_allItems.order = json_app.order;

        buildSkeleton($("#tools_content"), json_app, json_allItems, false);

    } else {
        // What to do when there are no apps
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
    setTimeout(function(){sendStream("access","ILS")},5000);

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
    var bg_image_url="";
    var bg_color;
    //try to get and cache the background image of the phase, if any.
    try{
        bg_image_url=item.background.image?item.background.image:"";
        img = new Image();
        img.src=item.background.image;
    }catch(err){
        bg_image_url="";
    }
    //try to get the background color of the phase, if any.
    try{
        bg_color=item.background.color?item.background.color:"";
    }catch(err){
        bg_color="";
    }
    tab_link.attr("bg_image_url", bg_image_url);
    tab_link.attr("bg_color", bg_color);

    if (item.metadata && item.metadata.type ) {
        tab_link.attr("phaseType", item.metadata.type); // default phases & spaces: 'Orientation', 'Conceptualisation', 'Investigation', 'Conclusion', 'Discussion', 'About', 'Vault'
    }else{
        tab_link.attr("phaseType", "Extra"); //phases manually added
    }
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

    getDataById(item, function (data) {
      var itemsIds=$('iframe').map(function() { return $(this).attr('name') }).get() //An array of all names/ids of iframes (apps that run in an iframe in the description)
      var json_app = buildJson(data.apps, data.appdata, itemsIds, item.id);
      var json_allItems = buildJson(data.items, data.appdata, itemsIds, item.id);

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
      ((item.spaceType == "folder") && (item.visibilityLevel != "hidden") && (!item.metadata)) ||
      ((item.spaceType == "folder") && (item.visibilityLevel != "hidden") && (item.metadata) && (item.metadata.type) && (item.metadata.type != "Vault") && (item.metadata.type != "About")));
  });
  return visible_spaces;
};

// build the json from a list and data
var buildJson = function(list, appdata, itemsIds, spaceId) {
  var json = {};
  json.contextId = "s_" + spaceId;
  json.hash = {};
  json.sizeType = "px";
  json.order = [];
  json.sizes = {};

    //for each app / item in a phase
  _.each(list, function (elem){
    if (itemsIds.indexOf(elem.id)==-1) //if the id of this widget is not found in the description
    {
      json.hash[elem.id] = elem; //add the widget to the widget list to be rendered
    }
  });

  if (appdata[json.contextId]) {
    json.data = JSON.parse(appdata[json.contextId].settings);
    json.order = json.data.order || [];
    json.sizes = json.data.sizes || {};
    json.sizeType = json.data.sizeType || "px"; // px or % to calculate the size
  }

  return json;
}

// Displays welcome message to user
var welcome_user = function(){
    $('#hello_msg').text(app.user_name);
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

// Log's out the active user by removing tha cookie and reloading tha page
var logoutUser = function() {
    $.removeCookie('graasp_user');
    sendStream("cancel","LOGOUT");
    location.reload();
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
      appId: ILS.id,
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
    if (app.sizeType && app.sizes) {
      type = type || app.sizeType
      var sizes = app.sizes
      $("#center").find(".window").each(function (i) {
        var win = $(this)
        var appId = win.attr('appId')
        win.css("width", sizes[appId] + type)
      })
    }
}

// refreshes order of items
var refreshItemsList = function (json) {
    // appends new space apps to the end
    var curIds = _.keys(json.hash)
    _.each(curIds, function (id) {
        json.order.push(id)
        json.sizes[id] = 300 // 300 - is the default width
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

  // build apps and resources
  _.each(all_json.order, function (id) {
      if(all_json.hash[id].itemType) {
          if (all_json.hash[id].itemType == "Application") {
              buildWindowApp(container, app_json.hash[id], is_center)
          } else if (all_json.hash[id].itemType == "Resource") {
              buildWindowDoc(container, all_json.hash[id], is_center)
          }
      }
  })
  // resize width of apps
  resizeAllApps()

  // set fake gadget height to the height of the first app
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
        buildGadget(app_json.hash[curId], is_center)
        // save new position
        save()
      }
    })
}

//display when is an app
var buildWindowApp = function (parent, gadget, is_center) {
  if(gadget.description.replace(/[\s|&nbsp;]+/gi,'') !="" ){
    var description = $("<div></div>").append(gadget.description);
    parent.append(description);
  }

  // build placeholder
  var blk = $("<div></div>")
    .addClass("window")
    .attr('appId', gadget.id)

  parent.append(blk);

  var gadget_el = $("<div></div>").attr('id', 'gadget-chrome-'+gadget.id);
  blk.append(gadget_el);
  blk.append($('<div class="window_placeholder"></div>'));
  blk.append($('<div class="drop_here"></div>'));

  buildGadget(gadget, is_center)

}

//display other formats than apps (documents, images, videos, ..)
var buildWindowDoc = function (parent, resource, is_center) {
    // build placeholder
    var $resourceToDisplay;
    var title = resource.displayName;
    var itemUrl = resource.originUrl;
    var location = window.location.protocol + "//";

    if((window.location.hostname == "localhost") && (itemUrl.indexOf("/resources/")>-1) && (itemUrl.indexOf("/raw")>-1)) {
        location = window.location.protocol + "//" + window.location.hostname + ":9091"
        itemUrl = location + "/resources/" + resource.id + "/raw";
    }
    
    var urlComponents = itemUrl.split('/');
    if(urlComponents[0].indexOf("http")<0){
        itemUrl = location + itemUrl;
    }

    if (resource.description.replace(/[\s|&nbsp;]+/gi, '') != "") {
        var descrToDisplay = $("<div></div>").append(resource.description);
        parent.append(descrToDisplay);
    }

    if (resource.embeddedHTML && resource.embeddedHTML != "") {
        $resourceToDisplay = $(resource.embeddedHTML).addClass("resource_content");
    } else {
        //if there's not mimeType it should be obtained
        if(!resource.mimeType || resource.mimeType == "") {
            var docType = title.substr(title.lastIndexOf("."), title.length);
            switch (docType.toLowerCase()) {
                //images
                case ".bmp": resource.mimeType = "image/bmp";  break;
                case ".gif": resource.mimeType = "image/gif";  break;
                case ".jpeg":
                case ".jpg":
                case ".jpe": resource.mimeType = "image/jpeg";  break;
                case ".png": resource.mimeType = "image/png";  break;
                case ".svg": resource.mimeType = "image/svg+xml";  break;

                //audio
                case ".m4a":
                case ".mp4a": resource.mimeType = "audio/mp4";  break;
                case ".mpga":
                case ".mp2":
                case ".mp2a":
                case ".mp3":
                case ".m2a":
                case ".m3a": resource.mimeType = "audio/mpeg";  break;
                case ".oga":
                case ".ogg":
                case ".spx": resource.mimeType = "audio/ogg";  break;
                case ".weba": resource.mimeType = "audio/webm";  break;
                case ".aac": resource.mimeType = "audio/x-aac";  break;
                case ".wav": resource.mimeType = "audio/x-wav";  break;

                //video
                case ".mp4":
                case ".mp4v":
                case ".mpg4": resource.mimeType = "video/mp4";  break;
                case ".ogv": resource.mimeType = "video/ogg";  break;
                case ".qt":
                case ".mov": resource.mimeType = "video/quicktime";  break;
                case ".webm": resource.mimeType = "video/webm";  break;
                case ".flv": resource.mimeType = "video/x-flv";  break;
                case ".m4v": resource.mimeType = "video/x-m4v";  break;
                case ".asf": resource.mimeType = "video/x-ms-asf";  break;
                case ".avi": resource.mimeType = "video/x-msvideo";  break;

                //application
                case ".mp4s": resource.mimeType = "application/mp4";  break;
                case ".ogx": resource.mimeType = "application/ogg";  break;
                case ".swf": resource.mimeType = "application/x-shockwave-flash";  break;

                //TXT
                case ".txt": resource.mimeType = "text/plain";  break;

                //PDFs
                case ".pdf": resource.mimeType = "application/pdf";  break;

                //HTML and graasp files
                case ".graasp":
                case ".html": resource.mimeType = "text/html";  break;

                default: resource.mimeType = "";    break;
            }
        }

        //visualize the resource based on the mimeType
        switch (resource.mimeType.toLowerCase()) {
            case "image/bmp":
            case "image/gif":
            case "image/jpeg":
            case "image/png":
            case "image/svg+xml":
                $resourceToDisplay = $('<img></img>');
                $resourceToDisplay.attr("class", "resource_content");
                if (resource.preview && resource.preview.size) {
                    if(resource.preview.image){
                        itemUrl =  lcoation + "/pictures/" + resource.id + "/"+resource.preview.size + "_" + resource.preview.image;
                    }else if(resource.picture){
                        itemUrl =  location + "/pictures/" + resource.id + "/" + resource.preview.size + "_" + resource.picture;
                    }
                }
                $resourceToDisplay.attr("src", itemUrl);
                $resourceToDisplay.attr("alt", itemUrl);
                break;

            case "audio/mp4":
            case "audio/mpeg":
            case "audio/ogg":
            case "audio/webm":
            case "audio/x-aac":
            case "audio/x-wav":
                $resourceToDisplay = $('<audio controls></audio>');
                $resourceToDisplay.attr("class", "resource_content");
                $resourceToDisplay.attr("src", itemUrl);
                $resourceToDisplay.attr("type", resource.mimeType);
                break;

            case "application/mp4":
            case "application/ogg":
            case "video/mp4":
            case "video/ogg":
            case "video/quicktime":
            case "video/webm":
            case "video/x-flv":
            case "video/x-m4v":
            case "video/x-ms-asf":
            case "video/x-msvideo":
                $resourceToDisplay = $('<video controls></video>');
                $resourceToDisplay.attr("class", "resource_content");
                $resourceToDisplay.attr("src", itemUrl);
                $resourceToDisplay.attr("type", resource.mimeType);
                break;

            case "application/pdf":
                $resourceToDisplay = $('<div></div>');
                $resourceToDisplay.attr("ng-swipe-left", "prev()");
                $resourceToDisplay.attr("ng-swipe-right", "next()");
                $resourceToDisplay.attr("class", "resource_content");
                var $pdf = $('<object></object>');
                $pdf.attr("data", itemUrl);
                $pdf.attr("type", resource.mimeType);
                $pdf.attr("width", "100%");
                $pdf.attr("height", "100%");
                $resourceToDisplay.append($pdf);
                break;

            case "application/x-shockwave-flash":
                $resourceToDisplay = $('<object></object>');
                $resourceToDisplay.attr("class", "resource_content");
                $resourceToDisplay.attr("data", itemUrl);
                $resourceToDisplay.attr("width", "100%");
                $resourceToDisplay.attr("height", "640px");
                break;

            case "text/plain":
                $resourceToDisplay = $('<div></div>');
                $resourceToDisplay.attr("class", "resource_content");
                var $txt = $('<object></object>');
                $txt.attr("data", itemUrl);
                $txt.attr("type", resource.mimeType);
                $txt.attr("width", "100%");
                $resourceToDisplay.append($txt);
                break;

            case "text/html":
                $resourceToDisplay = $('<div></div>');
                $resourceToDisplay.attr("class", "resource_content");
                if (resource.content) {
                    $resourceToDisplay.append(resource.content);
                }else{
                    var $code = $('<iframe seamless></iframe>');
                    $code.attr("class", "resource_content");
                    $code.attr("src", itemUrl);
                    $code.attr("width", "100%");
                    $resourceToDisplay.append($code);
                }
                break;

            default:
                $resourceToDisplay = $('<div class="resource_error"></div>');
                var $text = $('<p>[The file format of ' + resource.displayName + ' is not yet supported. You can access the resource in the following link: '+ itemUrl + ']</p>');
                $resourceToDisplay.append($text);
                break;
        }
    }

    parent.append($resourceToDisplay);
}

// is_center indicates if the gadget is in the center or at the bottom tool bar
var buildGadget = function (gadget, is_center) {
  // set the language and the country to shindig
  shindig.container.setLanguage(app.prefs.getLang());
  shindig.container.setCountry(app.prefs.getCountry());

  // get secure token for each widget from osapi.apps request
  var gadgetParams =
    { specUrl: gadget.appUrl
    , appId: gadget.id
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
    .attr('id', 'gadget-chrome-'+gadget.id)
    .attr('appId', gadget.id)
    .addClass('gadget');

  $('#gadget-chrome-'+gadget.id).replaceWith(gadget_el);

  // for gadgets in the center, if the width is not empty and less than 876, use the original width
  // otherwise, use 876px
  // for gadgets at the bottom tool bar, use the default width 300px
  if(is_center){
    if((gadget_size['gadgetWidth'] != "") && (parseInt(gadget_size['gadgetWidth']) < 768))
      $('#gadget-chrome-'+gadget.id).css('width', parseInt(gadget_size['gadgetWidth']) + 'px');
    else   $('#gadget-chrome-'+gadget.id).css('max-width', '100%');
  }

  shindig.container.setView("home");
  shindig.container.renderGadget(gadgetEl);

  gadgets.rpc.setRelayUrl(gadgetEl.getIframeId(), window.location.host.toString() + gadgetEl.getIframeUrl());
  gadgets.rpc.setAuthToken(gadgetEl.getIframeId(), gadgetEl.rpcToken);

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

  //Sending request for metawidget rendering
  var host_url=window.location.host.toString(); //Getting the running shindig
  xhr.open( "POST", "http://"+host_url+"/gadgets/metadata?st=0:0:0:0:0:0:0", false );
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
    { userId: app_json.contextId,
      appId : ILS.id,
      data: {"settings": JSON.stringify(data)}
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
//            actionLogger.setLoggingTarget("http://localhost/activity");
        }
    });
}

$(document).ready(function(){
    $('body').on('click','.nav-tabs li a', function (e) {
        $(this).trigger("tabClick");
        sendStream("access","PHASE");
    });

    $('body').on('click','#tools_title', function (e) {
        if ($(this).hasClass("expanded")){
            sendStream("access","TOOLBAR");
        }
    });
});


function sendStream(action,log_type){
    var ils_active_phase_element=$("#ils_cycle").children(".active").children();

    var ils_active_phase={
        id:ils_active_phase_element[0].attributes["href"].value.slice(1),
        name:ils_active_phase_element[0].innerHTML,
        phaseType:ils_active_phase_element[0].attributes["phaseType"].value
    }

    var new_target= {
        "objectType": "phase",
        "id":  ils_active_phase.id, // ils_active_phase.id.
        "displayName": ils_active_phase.name, // the given name of the phase.
        "inquiryPhase": ils_active_phase.phaseType // the type of the phase.
    }
    var ILSLogObject={};

    if (log_type=="ILS"){

        ILSLogObject = {
            objectType: "ils",
            id: ILS.id,
            displayName:ILS.name
        };

    }else if (log_type=="PHASE"){

        ILSLogObject = {
            "objectType": "phase",
            "id":  ils_active_phase.id, // ils_active_phase.id.
            "displayName": ils_active_phase.name, // the given name of the phase.
            "inquiryPhase": ils_active_phase.phaseType // the type of the phase.
        };

    }else if(log_type=="TOOLBAR") {

        ILSLogObject = {
            objectType: "toolbar"
        };
    }
    else if(log_type=="LOGOUT"){

        ILSLogObject = {
            objectType: "ils",
            id: ILS.id,
            displayName:ILS.name
        };
    }

    metadataHandler.setTarget(new_target);

    if (actionLogger&&metadataHandler) {
        actionLogger.log(action, ILSLogObject);
    }else{
        console.log("Could not log action "+action+". Action Logging not initialized properly.");
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

