/**
 * Created by Alexandros on 1/12/15.
 * ver. 1.5
 */


//Global variables
var app = { context: "",
            viewerName: "",
            viewerId:"",
            data: "",
            ownerId: ""};

var first_name = "";                //Default first name declaration
var autosave=true;                  //Toggles autosave feature
var debug=true;                    //Toggles bug options
var effectTime=0;                   //Global effects timer
var saveTimeoutSmall=0;             //Save timeout for 'stopped typing save'
var saveTimeoutBig=0;               //Save timeout for '5 secs typing save'
var connection_errors=false;        //Global connection error flag
var errorCount=0;                   //Global connection error counter
var mode="student";
var storageInfo= new Object();
var appId;
var save_flag=true;
var teacherName="";
var studentNameName="";

var initialize = function() {       //Initialization function called during startup
    try {
        checkMode();
        //Check for "demo" mode
        if (mode=="student") {
            debuglogger("Student mode.");
            // If in student mode try the vault storage first
            init_student_mode();

        }else if(mode=="teacher"){
            debuglogger("Teacher mode.")
            //Initialize student mode
            // If in teacher mode try the vault storage first
            $.when(getTeacherName())
             .then(function(){
                $.when(init_student_mode())
                .then(function(){
                    init_teacher_mode();
                },function(){
                    debuglogger("Could not initialize (vault issue?)")
                })
            },function(){
                    debuglogger("Could not initialize (cannot get teacher name)")
                })}
        else if (mode=="demo"){
            debuglogger("Demo mode.");
            // When in "demo mode", just enable the textarea
            var prefs = new gadgets.Prefs();
            var msg = prefs.getMsg('type_here');
            $("#scratchpad_text").prop('disabled', false).attr("placeholder",msg).show();
        }
        init_activity_streams();
        $("#main_content").show();
    }catch(err){
        debuglogger("Could not complete initialization: "+err);
    }
}

var getTeacherName=function(){
    var deferred = $.Deferred();
    debuglogger("Getting teacher name...");
    osapi.people.get({userId: '@viewer'}).execute(function(viewer) {
        teacherName = viewer.displayName;
        if (teacherName){
            debuglogger("Teacher name found: "+teacherName);
            deferred.resolve()
        }else if(viewer.error){
            debuglogger("Error getting teacher name: "+viewer.error);
            deferred.reject()
        }else{
            debuglogger("Error getting teacher name: "+viewer.error);
            deferred.reject()
        }
    });
    return deferred.promise();
}

var init_student_mode=function(){
    var deferred = $.Deferred();
    $.when(getCurrentUser())
        .then(function(){

    $.when(set_vault_storage())
        .then(function(storageHandler){
            storageInfo.storageHandler=storageHandler;
            //If StorageHandler was initialized try to load data from vault
            debuglogger("StorageHandler was initialized");
            $.when(load_data_vault(storageInfo.storageHandler))
                .then(function(resource){
                    //If data were loaded from the vault put them in place and keep the id
                    storageInfo.resource=resource;
                    storageInfo.resourceId=storageInfo.resource.metadata.id;
                    document.getElementById('scratchpad_text').value=storageInfo.resource.content;
                    $(".autoExpand").trigger('fitResize');
                    //$("#scratchpad_text").prop('disabled', false);
                    set_autosave();
                    getAppContextParameters();
                    debuglogger("Successfully initialized.");
                    deferred.resolve();
                },function(){
                    //If data were not loaded from the vault try to create them
                    $.when(create_data_vault(storageInfo.storageHandler))
                        .then(function(id){
                            //If data were created
                            storageInfo.resourceId=id;

                                    set_autosave();
                                    getAppContextParameters();
                                    $(".autoExpand").trigger('fitResize');
                                    debuglogger("Successfully initialized.");
                                    deferred.resolve();

                        },function(){
                            //If data could not be created
                            debuglogger("Vault data could not be created.");
                            deferred.reject();
                        })
                })
        },function(){
            debuglogger("StorageHandler could not be initialized.");
            deferred.reject();
        });
        });
    return deferred.promise();
}

var init_teacher_mode=function(){
    var deferred = $.Deferred();
    debuglogger("Init teacher mode...");
    $.when(set_read_vault_storage())
        .then(function(storageHandler){
            storageInfo.readStorageHandler=storageHandler;
            $.when(load_all_ids_vault(storageInfo.readStorageHandler))
                .then(function(resourceIdsList){
                    storageInfo.resourceIdsList=resourceIdsList;
                    console.log(storageInfo.resourceIdsList);
                    $.when(load_all_data_vault(storageInfo.readStorageHandler))
                        .then(function(resourceList){
                            //If data were loaded from the vault put them in place and keep the id
                            debuglogger("Appending resource content text...");
                            storageInfo.resourceList=resourceList;
                            storageInfo.resourceListId=storageInfo.resourceList[0].metadata.id;
                            var sortedResourceList=sortListbyIds(storageInfo.resourceIdsList,storageInfo.resourceList);
                            console.log(sortedResourceList);
                            displayStudentResults(sortedResourceList);
                            teacherButtonActions();
                            deferred.resolve();
                        },function(){
                            debuglogger("Could not load all data from vault.");
                            deferred.reject()
                        }
                    )
                },function(){
                    debuglogger("Could not load the resource list from vault.");
                    deferred.reject();
                })
        },function(){debuglogger("Could not create read storage.");})

    return deferred.promise();
}

function teacherButtonActions(){

        $("#scratchpad_input_teacher").show();
        $("#scratchpad_text").hide();
        adjustHeight();
   }

function adjustHeight(){
    gadgets.window.adjustHeight();

}

function checkMode(){
    debuglogger("Checking mode...")
    var context=ils.identifyContext();
    var preview="preview";
    var graasp="graasp";
    var standalone_ils="standalone_ils";
    var standalone_html="standalone_html";
    debuglogger(context);
    if (context==preview) mode="demo";
    else if (context==graasp) {
        mode="teacher";
    }
}

function getAppId(){
    var deferred = $.Deferred();
    osapi.apps.get({contextId: '@self'}).execute(function(response){
        if (!response.error){
            deferred.resolve(response.id);
        }else{
            deferred.reject();
        }

    });

    return deferred.promise();
}

function set_vault_storage(){
    debuglogger("Initializing Vault Storage...");
    var deferred = $.Deferred();
    var displayname="";

    if (mode=="student") displayname=studentNameName+"_InputBox_";
    else if (mode=="teacher") displayname="Teacher_"+teacherName+"_InputBox_";

    var initial_metadata={
        "id": generateUUID(),
        "published": "",
        "actor": {
            "objectType": "person",
            "id": "unknown",
            "displayName": "unknown"
        },
        "target": {
            "objectType": "InputBoxText",
            "id": generateUUID(),
            "displayName": displayname
        },
        "generator": {
            "objectType": "application",
            "url": window.location.href,
            "id": "",
            "displayName": "InputBox"
        },
        "provider": {
            "objectType": "ils",
            "url": document.referrer,
            "id": "unknown",
            "inquiryPhase": "unknown",
            "displayName": "unknown"
        }
    };
    debuglogger("Initial metadata:"+initial_metadata);
    $.when(getAppId())
     .then(function(appIdValue){
            appId=appIdValue;
            initial_metadata.generator.id=appId;
            initial_metadata.target.displayName+=appId;
            debuglogger("Trying to create a metadataHandler instance");
            var storageHandler;
            new golab.ils.metadata.GoLabMetadataHandler(initial_metadata,function(error, metadataHandler) {
                if (error!=undefined) {
                    debuglogger("Something went wrong when creating the MetadataHandler: " + error);
                    deferred.reject();
                }
                else {
                    debuglogger("Inputbox successfully created metadataHandler instance");
                    var inputBoxlMetadataHandler = metadataHandler;
                    storageHandler = new golab.ils.storage.VaultStorageHandler(inputBoxlMetadataHandler);
//                    storageHandler = new golab.ils.storage.MongoIISStorageHandler(inputBoxlMetadataHandler, "http://go-lab.gw.utwente.nl/mongoStorage/iis_scripts")
                    deferred.resolve(storageHandler);
                }
            });
        },function(){deferred.reject();});

    return deferred.promise();
}

function set_read_vault_storage(){
    debuglogger("Initializing Read Vault Storage...");
    var deferred = $.Deferred();
    var displayname="";

    if (mode=="student") displayname=studentNameName+"_InputBox_";
    else if (mode=="teacher") displayname="Teacher_"+teacherName+"_InputBox_";

    var initial_metadata={
        "id": generateUUID(),
        "published": "",
        "actor": {
            "objectType": "person",
            "id": "unknown",
            "displayName": "unknown"
        },
        "target": {
            "objectType": "InputBoxText",
            "id": generateUUID(),
            "displayName": displayname
        },
        "generator": {
            "objectType": "application",
            "url": window.location.href,
            "id": "",
            "displayName": "InputBox"
        },
        "provider": {
            "objectType": "ils",
            "url": document.referrer,
            "id": "unknown",
            "inquiryPhase": "unknown",
            "displayName": "unknown"
        }
    };
    debuglogger("Initial metadata:"+initial_metadata);
    $.when(getAppId())
        .then(function(appIdValue){
            appId=appIdValue;
            initial_metadata.generator.id=appId;
            initial_metadata.target.displayName+=appId;
            debuglogger("Trying to create a metadataHandler instance");
            var storageHandler;
            new golab.ils.metadata.GoLabMetadataHandler(initial_metadata,function(error, metadataHandler) {
                if (error!=undefined) {
                    debuglogger("Something went wrong when creating the MetadataHandler: " + error);
                    deferred.reject();
                }
                else {
                    debuglogger("Inputbox successfully created metadataHandler instance");
                    var inputBoxlMetadataHandler = metadataHandler;
                    storageHandler = new golab.ils.storage.VaultStorageHandler(inputBoxlMetadataHandler);
//                    storageHandler = new golab.ils.storage.MongoIISStorageHandler(inputBoxlMetadataHandler, "http://go-lab.gw.utwente.nl/mongoStorage/iis_scripts")
                    deferred.resolve(storageHandler);
                }
            });
        },function(){deferred.reject();});

    return deferred.promise();
}

function set_osapi_storage(){
    var deferred= $.Deferred();
    var batch = osapi.newBatch();
    batch.add('viewer', osapi.people.getViewer());

    if (osapi.context) { // only for spaces extended container
        debuglogger("Space-enabled container !!");
        batch.add('context', osapi.context.get());
    } else {
        debuglogger("Space NOT enabled in this container !!");
        batch.add('context', osapi.people.getOwner());
    }

    batch.execute(function (data) {
        if (data.error){
            debuglogger("Could not initialize osapi."+data.error)
            deferred.reject();
        }else{
            app.viewer = data.viewer;
            app.viewerName = app.viewer.displayName;

            var contextId = "@owner";
            var contextType = "@user";
            if (osapi.context) { // only for spaces extended container
                contextId = data.context.contextId;
                contextType = data.context.contextType;
            } else {
                app.ownerId = data.context.id; // user - owner of the widget
            }
            var prefix = (contextType === "@space") ? "s_" : "";
            app.context = prefix + contextId;
            debuglogger("Osapi initialized.")
            deferred.resolve();
        }
    });

    return deferred.promise();
}

function load_data_osapi(name){           //Loads scratchpad text
    var deferred= $.Deferred();
    debuglogger("Loading application Data from OSAPI appdata...");
    debuglogger("app.context: "+app.context);
    debuglogger("app.ownerId: "+app.ownerId);
    osapi.appdata.get({userId: app.context}).execute(function(data){
        if (data.error)
        {
            debuglogger("Error " + data.error.code + " while retrieving application data: " + data.error.message);
            deferred.reject();
        }
        else {
            debuglogger("Data Loaded!");
            if (osapi.context) { // only for spaces extended container
                var scratch_pad = data[app.context];
                debuglogger("App context: "+app.context);
            } else {
                var scratch_pad = data[app.ownerId];
                debuglogger("Owner ID: "+app.ownerId);
            }
            debuglogger("Name: "+name);
            console.log(data);
            debuglogger("scratch_pad: "+scratch_pad);
            if (name=="" || name==null){
                debuglogger("No valid name found, cannot retrieve data for unknown user. first_name:"+name);
                deferred.reject();
            }else{
                try{
                    var encoded_first_name=encodeURIComponent(name.toUpperCase());
                    var scratch_pad_text = scratch_pad["scratch_pad_"+encoded_first_name];
                    if (scratch_pad_text && scratch_pad_text.trim()!=""){
                        debuglogger("Scratchpad Data retrieved for user "+name);
                        deferred.resolve(scratch_pad_text);
                    }else{
                        debuglogger("Scratchpad data for user "+name+" are empty or don't exist");
                        deferred.reject();
                    }
                }
                catch(err){
                    debuglogger("Could not retrieve data. No valid scratchpad entry was found");
                    debuglogger(err.message);
                    deferred.reject();
                }
            }
        }
    });
    return deferred.promise()
}

function migrate_from_appdata(){
    debuglogger("Migrating from appdata...")
    var deferred = $.Deferred();
    $.when(set_osapi_storage())
     .then(function(){
            $.when(get_first_name())
             .then(function(name){
                    $.when(load_data_osapi(name))
                     .then(function(osapi_text){
                            debuglogger("Successfully got osapi data:"+osapi_text)
                            deferred.resolve(osapi_text)
                        },function(){
                            debuglogger("Could not read data from osapi storage");
                            deferred.reject();
                        })
                },function(){
                    debuglogger("Could not get name for osapi storage");
                    deferred.reject();
                })
        },function(){
            debuglogger("Could not init osapi storage");
            deferred.reject();
        })
    return deferred.promise();
}

function load_data_vault(storageHandler){

    debuglogger("Loading application data from the vault...");
    var deferred = $.Deferred();

    storageHandler.configureFilters(true,true,true,true);

    storageHandler.readLatestResource("InputBoxText", function(error, resource){
        if (error!=undefined) {
            debuglogger("No data is found: " + error);
            deferred.reject()

        } else {
            debuglogger("Logging resource:");
            debuglogger(resource);
            if (resource){
                debuglogger("Successfully loaded resource "+resource.metadata.id);
                if (typeof resource.content==='string'&&resource.content.trim()!=""){
                    resource.content=resource.content.trim();
                    deferred.resolve(resource);
                }else{
                    debuglogger("Data are empty or invalid. Setting to empty string...");
                    resource.content="";
                    deferred.resolve(resource);
                }

            }else{
                debuglogger("Data are empty");
                deferred.reject()
            }
        }
    });

    return deferred.promise();
}

function load_all_ids_vault(storageHandler){

    debuglogger("Listing the available resources in the vault for all students...");
    var deferred = $.Deferred();

    storageHandler.configureFilters(true,false,true,true);

    debuglogger("Getting the ids...");
    storageHandler.listResourceMetaDatas(function(error, ids){
        if (error!=undefined) {
            debuglogger("No data is found: " + error);
            deferred.reject()
        }else {
            debuglogger("Logging resource ids list ("+ids.length+"):");
            if (ids.length>0){
                deferred.resolve(ids);
            }else{
                debuglogger("List empty");
                deferred.reject()
            }

        }
    });

    return deferred.promise();
}


function load_all_data_vault(storageHandler){

    debuglogger("Loading application data from the vault for all students...");
    var deferred = $.Deferred();
    var resource_list= new Array();
    debuglogger("Trying to load resources...");
    for (var i=0;i<storageInfo.resourceIdsList.length;i++){
        (function (i){
            debuglogger("Loading resource "+i+" with id: "+storageInfo.resourceIdsList[i].id);
            storageHandler.readResource(storageInfo.resourceIdsList[i].id, function(error, resource){
                if (error!=undefined) {
                    debuglogger("Resource "+i+" with id: "+storageInfo.resourceIdsList[i]+" not found: " + error);
                    deferred.reject()
                }else{
                    debuglogger("Successfully loaded resource "+resource.metadata.id);
                    console.log(resource);
                    debuglogger("Storing it in resource list position "+i);
//                    resource_list[i]=resource;
                    resource_list.push(resource);
                    debuglogger("Loaded resources: "+resource_list.length+" of the total: "+storageInfo.resourceIdsList.length);
                    if (resource_list.length==storageInfo.resourceIdsList.length)
                    {
                        debuglogger("List is complete resolving deferred.");
                        deferred.resolve(resource_list);
                    }
                }
            });
        })(i);
    }
    return deferred.promise();
}

function create_data_vault(storageHandler){

    debuglogger("Creating application data to the vault...");
    var deferred = $.Deferred();
    var InputBoxText="";
    storageHandler.createResource(InputBoxText, function(error, resource){
        if (error!=undefined) {
            debuglogger("Could not create data: " + error);
            deferred.reject();
        } else {
            debuglogger("Successfully created resource "+resource.metadata.id);
            console.log(resource);
            deferred.resolve(resource.metadata.id);
        }
    });
    return deferred.promise();
}
function save_data_vault(){

    debuglogger("Saving application data for resource "+ storageInfo.resourceId +" to the vault...");
    var deferred = $.Deferred();
    var InputBoxText="";
    var tmpInput=document.getElementById('scratchpad_text').value;
//    if (tmpInput&&tmpInput.trim()!="") InputBoxText=tmpInput.trim(); else InputBoxText=" ";
    if (tmpInput) InputBoxText=tmpInput;
    else InputBoxText=" ";
    debuglogger("Text to store: "+InputBoxText);
    storageInfo.storageHandler.updateResource(storageInfo.resourceId,InputBoxText, function(error, resource){
        if (error!=undefined) {
            debuglogger("Data for resource "+storageInfo.resourceId+" could not be updated: " + error);
            deferred.reject();

        } else {
            debuglogger("Successfully updated resource "+resource.metadata.id);
            deferred.resolve(resource);
        }
    })
    return deferred.promise();

}

function save_data_osapi(){           //Saves the scratchpad text from the textarea
    try{

        if (first_name=="" || first_name==null){
            debuglogger("No valid name found, cannot save data for unknown user. first_name:"+first_name);
        }else{
            var app_data = {};
            var encoded_first_name=encodeURIComponent(first_name.toUpperCase());
            app_data["scratch_pad_"+encoded_first_name]= document.getElementById('scratchpad_text').value;

            //sets a timer for server timeout
            var requestTimeout=setTimeout(function(){
                reportStatus(false);
                notify_user("Save",false,". Server timed out.");
            },3000);


            //Try to update appdata object
            osapi.appdata.update({userId: app.context,
                data: JSON.stringify(app_data) }).execute(function(response){
                clearTimeout(requestTimeout);// Cancel the timeout once you get the response

                if (response.error) //Actions to do if there is there is an error in the response
                {
                    reportStatus(false);
                    notify_user("Save",false,"Error " + response.error.code + " updating application data: " + response.error.message);

                }

                else {             //Actions to do when everything is ok
                    reportStatus(true);
                    notify_user("Save", true,"Scratch pad data updated for user "+first_name);

                }
            });
        }
    }
    catch(err){
        reportStatus(false);
        notify_user("Save",false,"Error occurred while saving application data: " + err);
    }

}


function get_first_name()  //Attempts to get the nickname of the user
{
    var deferred= $.Deferred();
        if (mode=="student"){
            debuglogger("Getting student username... ");
            // Check if localstorage exists
            if(typeof(Storage) !== "undefined") {
                // If it does load from localstorage
                first_name = studentNameName;
            } else {
                // else try to load from cookie
                first_name = $.cookie('graasp_user');
            }
            if(!first_name=="" || !first_name==null) {
                debuglogger("Username "+first_name+" was found!");
                deferred.resolve(first_name);
            }else{
                debuglogger("No valid name found!");
                deferred.reject();
            }
        }else if (mode=="teacher"){
            deferred.resolve(teacherName)
        }
    return deferred.promise();
}

function getCurrentUser(){
    var deferred= $.Deferred();
    ils.getCurrentUser(function(current_user){
        studentNameName=current_user;
        debuglogger(studentNameName);
        deferred.resolve();
    });
    return deferred.promise();
}

function getAppContextParameters(){
    var deferred= $.Deferred();
    ils.getAppContextParameters(function(parameters){
        if (parameters.contextualActor==undefined){
            $("#scratchpad_text").show().prop('disabled', true);
            var prefs = new gadgets.Prefs();
            var msg = prefs.getMsg('waiting_feedback');
            $("#scratchpad_text").attr("placeholder",msg);
        }else{
            $("#scratchpad_text").show().prop('disabled', false);
            var prefs = new gadgets.Prefs();
            var msg = prefs.getMsg('type_here');
            $("#scratchpad_text").attr("placeholder",msg);
        }
        deferred.resolve();
    });
    return deferred.promise();
}

function set_autosave(){

        //Implemented with 2 timers.
        // 1)It saves once every X<Y secs, while the user types
        // 2)It saves once the user stops writing for ZZZ ms

        $("body").on('input','#scratchpad_text',function(e) {
            clearInterval(saveTimeoutSmall);
            if (save_flag){
                save_flag=false;
                saveTimeoutBig=setTimeout(function(){
                    debuglogger("big");
                    save_data_vault();
                    logFeedback(document.getElementById('scratchpad_text').value);
                    save_flag=true;
                },10000);
            }

            saveTimeoutSmall=setTimeout(function(){
                debuglogger("small");
                save_data_vault();
                logFeedback(document.getElementById('scratchpad_text').value);
                clearInterval(saveTimeoutBig);
                save_flag=true;
            },2000);
        });
}


function toggleInput(status){       //Enables-Disables the textarea

    if (status=="on")
    {
        $("#scratchpad_text").prop('disabled', false);
    }
    else if (status=="off"){
        $("#scratchpad_text").prop('disabled', true);
    }


}


function notify_user(action,result,message){        //Notify user about the status of an action
    if (message==null) message="";
    if (result) message=action+" was successful."+message;
    else message=action+" failed."+message;

    debuglogger(message);

}

function  display_status(issue,status){                   //Displays the status of an action
    if (issue=="network"){
        if (!status){
            debuglogger("Network error!");
            toggleInput("off");
        }
        else {
            debuglogger("Recovered from Error.");
            toggleInput("on");
        }
    }
    else if (issue=="user"){
        if (!status){
            toggleInput("off");
        }
        else {
            toggleInput("on");
        }
    }
}

function reportStatus(status){                      //Reports the status of an action to the system
    if (!status && !connection_errors){
        errorCount++;
        var errorTolerance=1;
        if (errorCount>=errorTolerance) {
            connection_errors=true;
            display_status("network",false);
        }

    }
    else if (!status && connection_errors){
        connection_errors=true;
    }
    else if (status && connection_errors){
        setTimeout(function(){
            errorCount=0;
            connection_errors=false;
            display_status("network",true);
        },1000);
    }
    else if (status && !connection_errors){
        connection_errors=false;
    }
}

var sortListbyIds=function(resourceIdsList,resourceList){
    sortedArray=[];
    resourceIdsList.forEach(function(key) {
        var found = false;
        resourceList = resourceList.filter(function(resource) {
            if(!found && resource.metadata.id == key.id) {
                sortedArray.push(resource);
                found = true;
                return false;
            } else
                return true;
        })
    })
    return sortedArray;
}

var displayStudentResults=function(resourceList){
    var input_results=$('#scratchpad_input_teacher');
    var inputTable=$('<table id="inputTable" class="stripe"/>');
    var inputTableHeader=$('<thead><tr><td>Student Name</td><td>Feedback</td><td>Date Added</td></tr>');
    inputTable.append(inputTableHeader);
    var inputTableBody=$('<tbody/>');

    var color_classes = [ 'white', 'gray'];
    var colorCounter=0;
    for (var c=0;c<resourceList.length;c++){
        var inputEntry=$('<tr class=""/>');
        if (resourceList[c]&&typeof resourceList[c].content==='string'&&resourceList[c].content.trim()!=""){
            var studentNameDiv = $("<td class=''></td>").text(resourceList[c].metadata.actor.displayName);
            inputEntry.append(studentNameDiv);
            var textDiv= $("<td class=''></td>").text(resourceList[c].content);
            inputEntry.append(textDiv);
            var inputDate = $("<td class='date'></td>").text(new Date(resourceList[c].metadata.published).toUTCString().split(", ")[1].replace("GMT",""));
            inputEntry.append(inputDate);
            inputTableBody.append(inputEntry);
        }else{
            debuglogger("Something went wrong with resource "+c);
        }
    }
    inputTable.append(inputTableBody);
    input_results.append(inputTable);
    $('#inputTable').DataTable( {
        paging: false,
        info:     false,
        searching:false
    } );
    adjustHeight();
}

function debuglogger(msg) {                     //Custom logger for debugging purposes
    if (debug){
        var prefix="TeacherFeedback App "+appId+": ";
        console.log(prefix+msg);
    }
}

jQuery.fn.center = function (orientation) {     //jquery function for centering an element in the screen
    this.css("position","absolute");
    if (orientation=="" || orientation==null || orientation===null) orientation="both";
    if (orientation=="horizontal" || orientation=="both"){
        this.css("left", Math.max(0, (($(window).width() - $(this).outerWidth()) / 2) +
            $(window).scrollLeft()) + "px");
    }
    if (orientation=="vertical" || orientation=="both"){
        this.css("top", Math.max(0, (($(window).height() - $(this).outerHeight()) / 2) +
            $(window).scrollTop()) + "px");
    }
    return this;
}

$(window).resize(function(){
    $(".autoExpand").trigger('fitResize');
});

$(document)
    .on('input.textarea', '.autoExpand', function(e){
        while($(this).outerHeight() < this.scrollHeight + parseFloat($(this).css("borderTopWidth")) + parseFloat($(this).css("borderBottomWidth"))) {
            $(this).height($(this).height()+20);
        }
        gadgets.window.adjustHeight();
    })
    .on('keyup', '.autoExpand',function(e){
        if (e.which == 8 || e.which == 46) {
            $(this).trigger('fitResize');
        }
    })
    .on('fitResize','.autoExpand',function(e){
        $(this).height(parseFloat($(this).css("min-height")) != 0 ? parseFloat($(this).css("min-height")) : parseFloat($(this).css("font-size")));
        $(this).trigger('input');
    })
;

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

var init_activity_streams=function(){
    var defaultMetadata = {
        "actor": {
            "objectType": "person",
            "id": "unknown",
            "displayName": "unknown"
        },
        "target": {
            "objectType": "unknown",
            "id": generateUUID(),
            "displayName": "unnamed"
        },
        "generator": {
            "objectType": "application",
            "url": window.location.href,
            "id": generateUUID(),
            "displayName": "TeacherFeedback"
        },
        "provider": {
            "objectType": "ils",
            "url": window.location.href,
            "id": "unknown",
            "inquiryPhase": "unknown",
            "displayName": "unknown"
        }
    };

    new window.golab.ils.metadata.GoLabMetadataHandler(defaultMetadata, function(error, createdMetadataHandler) {
        if (error) {
            console.log(error);
        } else {
            metadataHandler = createdMetadataHandler;
            actionLogger = new window.ut.commons.actionlogging.ActionLogger(metadataHandler);
            actionLogger.setLoggingTargetByName("opensocial");
        }
    });


}
var logFeedback=function(fd){
    var feedback_data=fd;

    var tfObject = {
        objectType: "teacherFeedback",
        id: generateUUID(),
        feedback_data: feedback_data
    };
    try {
        debuglogger(tfObject);
        actionLogger.logAdd(tfObject);
        debuglogger(answersArray);
    }catch(err){
        debuglogger("Could not log action",err)
    }

};