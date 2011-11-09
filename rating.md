Rating widget
-------------

Widget that can be rated should emit 'click' events via openapp.

The following widget can be rated, since it emits 'click' events:
http://iamac71.epfl.ch/gadget_info.xml

Below changes in the code for rated widget.
It should be straight forward - initialize openapp listener and bind it to 'click' event.


     <script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.6.0/jquery.min.js"></script>
     <script type="text/javascript" src="http://open-app.googlecode.com/files/openapp.js"></script>
 
     <script type="text/javascript">
     var sendClickEvent = function() {
        // hack to get gadget id (should be fixed in opensocial 2.1 with spaces)
        var appId = document.location.search.match(/&st=.+:.+:(.+):.+:.+:.+:.+/)[1];

        gadgets.openapp.publish({
          event: "click",
          type: "json",
          message: {
            appId: appId,
          }
        });
      };
     /**
      * Request for friend information.
      */
      function getData() { 
        $(document).bind("click",sendClickEvent);
      
        ...
      };

      // setTimeout(getData, 1000);
      </script>
