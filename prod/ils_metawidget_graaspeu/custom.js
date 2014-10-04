//**** New UI Customization CERTH ****
// ------------------------------------ 
// ****			Start			 **** /

// Dynamically add classes and format content
var applyNewLayout= function  () {

   $("#ils_phases .tab-pane").addClass("fade"); //Add Fade effect to tabs
   $("#ils_phases .tab-pane:first").addClass("in"); //Fade the tab in
   $("#ils_cycle").wrap("<div id='customTopWrapper' class='customTop'></div>");
   //$("#customTopWrapper").prepend("<div id='leftChevron' class='tabChevron'/><div id='righrChevron' class='tabChevron'/>");


    //When done, wait 1000ms hide the loader and display content
    setTimeout(function(){
        $("#main").show("fade",1000);
        $("#loader").hide("fade",500).remove();
        $("body").addClass("bg_image");
    },1000);


    myNavMenu = $('#customTopWrapper');  //gets the tabbed menu
    customBar =$('#myCustomBar'); //get the info bar
    faux = $('#fauxContainer'); //gets the faux container
    customBarHeight = customBar.outerHeight(); //gets the height of info bar
    myNavMenuHeight = myNavMenu.outerHeight(); //gets the height of tabbed menu
    attached = false;
    windowScrollTop= $(window).scrollTop(); //gets the ammount of scrolling in main_block

    $('body').on('click', '.fixedCustomTop', function (e) {
        $(window).scrollTop(fauxOffset+2);
    });

    $('#logout_button').on("click",function(e){
       logoutUser();
    });

};


$(window).scroll(function(){
    stickyBar();
});


function stickyBar() {

    fauxOffset=faux.offset().top;
    windowScrollTop= $(this).scrollTop();
    var test = fauxOffset - windowScrollTop ;
    var test2 = fauxOffset - windowScrollTop - customBarHeight;
    myNavMenuHeight = myNavMenu.outerHeight(); //gets the height of tabbed menu

    if ((test < 0) && !attached ) //attach the sticky bar when it has reached to the top
        {
            attached=true;
            myNavMenu.addClass("fixedCustomTop");
            faux.css("height", myNavMenuHeight);
            myNavMenu.fadeIn("slow");
         }

    else   if ((test > 0) && attached) // detach the sticky bar when not at the top

    {
        myNavMenu.removeClass("fixedCustomTop")
        faux.css("height", 0);
        attached=false;
    }
}

var animate_logo = function(){
    $("#name_prompt").hide("fade",500,function(){
        $("#greeting_text").find("h3").append(" "+app.user_name+"!");
        $("#greeting_text").show("fade",1000);
    });
    if($('#loader-image-static').is(':visible')) {
        $("#loader-image-static").hide();
    }

    if($('#loader-image').is(':hidden')) {
        $("#loader-image").show("fade", 500);
    }


};



//**** New UI Customization CERTH ****
// ------------------------------------ 
// ****			End	   			 **** /