//**** New UI Customization CERTH ****
// ------------------------------------ 
// ****			Start			 **** /
 
// Dynamically add classes and format content
var applyNewLayout= function  () {
   $("#ils_phases img").attr("width","").addClass("img-responsive centered"); //Format Images
   //$("#ils_phases .tab-pane:first").addClass("active"); 
   $("#ils_phases .tab-pane").addClass("fade"); //Add Fade effect to tabs
   $("#ils_phases .tab-pane:first").addClass("in"); //Fade the tab in
   $("#ils_cycle").wrap("<div id='customTopWrapper' class='customTop'></div>");
   //When done, hide the loader and display content
   $("#loader").fadeOut(500);
   $("#main").fadeIn(1000);
};


$("#main_block").scroll(function(){
  stickyBar();
});


function stickyBar() {
    var myNavMenu = $('#customTopWrapper');  //gets the tabbed menu
    var myNavMenuHeight = myNavMenu.outerHeight(); //gets the height of tabbed menu
    var myNavMenuDataTop = myNavMenu.attr("data-top"); //gets the data-top attribute
    var myNavMenuOffset = myNavMenu.offset().top;// gets the offset from top of tabbed menu
    var windowScrollTop= $("#main_block").scrollTop(); //gets the ammount of scrolling in main_block
    var customBar =$('#myCustomBar'); //get the info bar
    var customBarOffset= customBar.offset().top;
    var faux = $('#fauxContainer'); //gets the faux container
    var fauxOffset=faux.offset().top;
    var customBarHeight = customBar.outerHeight(); //gets the height of info bar
    
    // DEBUG START
    
    test = fauxOffset;
    test2 = fauxOffset - customBarHeight+2;
   
    //console.log(" Menu initial offset: " + myNavMenuDataTop + "\n" +
    //            " Menu Height: " + myNavMenuHeight + "\n" +
    //            " Menu current offset " + myNavMenuOffset + "\n"+
    //            " Top Bar Height: " + customBarHeight + "\n" +
    //            " Scrolling: " + windowScrollTop + "\n" +
    //            " test: " + test + "\n" +
    //            " test2: " + test2);
     
    // DEBUG END
    
    if ((test2<=0) && (test>=0)){ //when menu reaches right under top bar push the bar up
        customBar.css({top:test2});
    }
    
    else if (test2>0){ //else keep bar attached
        customBar.css({top:0});
    }
    
    
    if (!myNavMenu.attr('data-top')) { // set the data-top attribute to menu when not existing (initial top offset)
        if (myNavMenu.hasClass('fixedCustomTop')) return;
         var offset = myNavMenu.offset();
        myNavMenu.attr('data-top', offset.top);
    }
    
    if ((test <= 0) && (!myNavMenu.hasClass('fixedCustomTop'))) //attach the sticky bar when it has reached to the top
        {
         //console.error("Attached!");
         //myNavMenu.addClass('navbar-fixed-top');
         myNavMenu.addClass('fixedCustomTop');
         faux.addClass('customHeight');
         myNavMenu.bind('click', function (e) {
            $("#main_block").animate({ scrollTop: windowScrollTop }, 0);
         });
         }

    else   if ((test > 0) && (myNavMenu.hasClass('fixedCustomTop'))) // detach the sticky bar when not at the top
        
    {
        //console.warn("Detached!");
        //myNavMenu.removeClass('navbar-fixed-top');
        myNavMenu.removeClass('fixedCustomTop'); 
        faux.removeClass('customHeight');
        myNavMenu.unbind('click');
        }
}

//**** New UI Customization CERTH ****
// ------------------------------------ 
// ****			End	   			 **** /