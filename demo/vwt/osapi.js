/**
 * New node file
 */

function displayContext (el, context) {
    el.append("<p>");
    el.append("<br />").append("contextId: "+context.contextId);
    el.append("<br />").append("contextType: "+context.contextType);
    el.append("<br />").append("containerUrl: "+context.containerUrl);
    el.append("</p>");
  }
  function displaySpace (el, space) {
    el.append("<p>");
    el.append("<br />").append("id: "+space.id);
    el.append("<br />").append("url: <a href='"+space.url+"'>"+space.url+"</a>");
    el.append("<br />").append("displayName: "+space.displayName);
    el.append("<br />").append("description: "+space.description);
    el.append("<br />").append("created: "+space.created);
    el.append("<br />").append("updated: "+space.updated);
    el.append("<br />").append("visibilityLevel: "+space.visibilityLevel);
    el.append("<br />").append("thumbnailUrl: "+space.thumbnailUrl).append("<img src='"+space.thumbnailUrl+"' />");
    el.append("<br />").append("parentId: "+space.parentId);
    el.append("</p>");
  }
  function displayDocument (el, doc) {
    el.append("<p>");
    el.append("<br />").append("id: "+doc.id);
    el.append("<br />").append("url: <a href='"+doc.url+"'>"+doc.url+"</a>");
    el.append("<br />").append("displayName: "+doc.displayName);
    el.append("<br />").append("description: "+doc.description);
    el.append("<br />").append("created: "+doc.created);
    el.append("<br />").append("updated: "+doc.updated);
    el.append("<br />").append("visibilityLevel: "+doc.visibilityLevel);
    el.append("<br />").append("thumbnailUrl: "+doc.thumbnailUrl).append("<img src='"+doc.thumbnailUrl+"' />");;
    el.append("<br />").append("parentId: "+doc.parentId);
    el.append("</p>");
  }
  function displayApp (el, doc) {
    el.append("<p>");
    el.append("<br />").append("id: "+doc.id);
    el.append("<br />").append("url: <a href='"+doc.url+"'>"+doc.url+"</a>");
    el.append("<br />").append("displayName: "+doc.displayName);
    el.append("<br />").append("description: "+doc.description);
    el.append("<br />").append("created: "+doc.created);
    el.append("<br />").append("updated: "+doc.updated);
    el.append("<br />").append("visibilityLevel: "+doc.visibilityLevel);
    el.append("<br />").append("thumbnailUrl: "+doc.thumbnailUrl).append("<img src='"+doc.thumbnailUrl+"' />");;
    el.append("<br />").append("parentId: "+doc.parentId);
    el.append("</p>");
  }
  function displayPerson (el, person) {
    el.append("<p>");
    el.append("<br />").append("id: "+person.id);
    el.append("<br />").append("profileUrl: <a href='"+person.profileUrl+"'>"+person.profileUrl+"</a>");
    el.append("<br />").append("displayName: "+person.displayName);
    if (person.name) {
      el.append("<br />").append("name.givenName: "+person.name.givenName);
      el.append("<br />").append("name.familyName: "+person.name.familyName);
    } else {
      el.append("<br />").append("name.givenName: undefined");
      el.append("<br />").append("name.familyName: undefined");
    }
    el.append("<br />").append("aboutMe: "+person.aboutMe);
    if (person.email) {
      el.append("<br />").append("email.value: "+person.email.value);
      el.append("<br />").append("email.primary: "+person.email.primary);
    } else {
      el.append("<br />").append("email.value: undefined");
      el.append("<br />").append("email.primary: undefined");
    }
    el.append("<br />").append("gender: "+person.gender);
    if (person.languagesSpoken) {
      el.append("<br />").append("languagesSpoken.value: "+person.languagesSpoken.value);
      el.append("<br />").append("languagesSpoken.primary: "+person.languagesSpoken.primary);
    } else {
      el.append("<br />").append("languagesSpoken.value: undefined");
      el.append("<br />").append("languagesSpoken.primary: undefined");
    }
    el.append("<br />").append("created: "+person.created);
    el.append("<br />").append("updated: "+person.updated);
    el.append("<br />").append("thumbnailUrl: "+person.thumbnailUrl).append("<img src='"+person.thumbnailUrl+"' />");;
    el.append("</p>");
  }
  function getContext(contId) {
    osapi.context.get().execute(function(context){
      displayContext($('#osapi_context'), context);
    });
  }
  function getSpaces () {
    if (osapi.spaces) {
    osapi.spaces.get({contextId: '@owner'}).execute(function(space){
      displaySpace($('#osapi_spaces'), space);
    });
    
    osapi.spaces.get({contextId: '@owner', contextType: '@space'}).execute(function(response){
      spaces = response.list;
      for(var i=0; i<spaces.length; i++) {
        displaySpace($('#osapi_spaces_space_collection'),spaces[i]);
      }
    });
    osapi.spaces.get({contextId: '@viewer', contextType: '@person'}).execute(function(response){
      spaces = response.list;
      for(var i=0; i<spaces.length; i++) {
        displaySpace($('#osapi_spaces_person_collection'),spaces[i]);
      }
    });
    //gets all items in space with contextId == 'spaceId'
    //osapi.spaces.get({contextId: 'spaceId', contextType: '@space'}).execute(function(response){
      //items = response.list;
      //for(var i=0; i<items.length; i++) {
        //displaySpace($('#osapi_spaces_items_collection'),items[i]);
      //}
    //});
    //gets a space with contextId == 'spaceId'
    //osapi.spaces.get({contextId: 'spaceId'}).execute(function(response){
        //displaySpace($('#osapi_spaces_space'),response);
    //});
    //creates space in space with spaceId. 
    osapi.spaces.create({contextId:"spaceId", params:{"displayName": "MyNewSpace"}}).execute(function(response){
      //displaySpace($('#osapi_spaces_create'),response);
    });
    } else {
      $('#osapi_spaces').append("No spaces supported in this container");
    }
  }
  function getDocument(contId) {
    osapi.documents.get({contextId: contId}).execute(function(doc){
      displayDocument($('#osapi_documents'), doc);
    });
  }
  function getDocuments () {
    $("#doc").submit(function( event ) {
      event.preventDefault();
      getDocument($("#docid").val());
      $('#docDispId').text($("#docid").val());
    });
    if (osapi.documents) {
      osapi.documents.get({contextId: '@owner', contextType: '@space'}).execute(function(response){
        docs = response.list;
        for(var i=0; i<docs.length; i++) {
          displayDocument($('#osapi_documents_space_collection'),docs[i]);
        }
      });
      osapi.documents.get({contextId: '@viewer', contextType: '@person'}).execute(function(response){
        docs = response.list;
        for(var i=0; i<docs.length; i++) {
          displayDocument($('#osapi_documents_person_collection'),docs[i]);
        }
      });
      //var params = {
                  //"document": {
                    //"parentType": "@space",
                    //"parentSpaceId": "spaceId",
                    //"mimeType": "txt",
                    //"fileName": "resourceName",
                    //"content": JSON.stringify("content"),
                    //"metadata": "metadata"
                  //}
                //};
      //osapi.documents.create(params).execute(function(response){
          displayDocument($('#osapi_documents_create_document'),response);
      //});
      //osapi.documents.update(params).execute(function(response){
          //displayDocument($('#osapi_documents_update_document'),response);
      //});
    } else {
      $('#osapi_documents').append("No documents supported in this container");
    }
  }
  function getApps () {
    if (osapi.apps) { 
      osapi.apps.get({contextId: "@self"}).execute(function(doc){
        displayApp($('#osapi_apps'), doc);
      });
      osapi.apps.get({contextId: '@owner', contextType: '@space'}).execute(function(response){
        apps = response.list;
        for(var i=0; i<apps.length; i++) {
          displayApp($('#osapi_apps_space_collection'),apps[i]);
        }
      });
      osapi.apps.get({contextId: '@viewer', contextType: '@person'}).execute(function(response){
        apps = response.list;
        for(var i=0; i<apps.length; i++) {
          displayApp($('#osapi_apps_person_collection'),apps[i]);
        }
      });
    } else {
      $('#osapi_apps').append("No apps supported in this container");
    }
  }
  function getPeople () {
    if (osapi.people) {
      osapi.people.getViewer().execute(function(person){
        displayPerson($('#osapi_people_viewer'), person);
      });
      osapi.people.getOwner().execute(function(person){
        displayPerson($('#osapi_people_owner'), person);
      });
      osapi.people.get({userId: '@viewer'}).execute(function(person){
        displayPerson($('#osapi_people'), person);
      });
      
      osapi.people.get({userId: '@owner', personId: '@space'}).execute(function(response){
        persons = response.list;
        for(var i=0; i<persons.length; i++) {
          displayPerson($('#osapi_people_space_collection'),persons[i]);
        }
      });
    } else {
      $('#osapi_people').append("No people support in this container");
    }
  }
 /**
  * Request for friend information.
  */
  function getData() {
    getContext();
    getSpaces();
    getPeople();
    getDocuments();
    getApps();
  };
  gadgets.util.registerOnLoadHandler(getData);