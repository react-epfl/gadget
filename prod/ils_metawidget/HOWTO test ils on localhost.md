To test ILSes on localhost:
1. Graasp side: in metawidget_controller.rb
	if user_tracking == 1
      #metawidget_source = CGI.escape("http://graasp.epfl.ch/gadget/prod/ils_metawidget/gadget.xml")
      metawidget_source = CGI.escape("http://iamac115.epfl.ch/gadget.xml") //where your gadget.xml is

2. Gadget repo side: app.js
	xhr.open( "POST", "http://shindig.epfl.ch:80/gadgets/metadata?st=0:0:0:0:0:0:0", false );
  // for testing at development machine, use the following url.
  // xhr.open( "POST", "http://localhost:8080/gadgets/metadata?st=0:0:0:0:0:0:0", false );

  in gadget.xml: 
  <script type="text/javascript" src="http://graasp.epfl.ch/gadget/prod/ils_metawidget/app.js"></script>
  => set the path to where your app.js is