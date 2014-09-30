//**** New UI Customization CERTH ****
// ------------------------------------ 
// ****			Start			 **** /

// Dynamically add classes and format content
var applyNewLayout= function  () {
   $("#ils_phases .tab-pane").addClass("fade"); //Add Fade effect to tabs
   $("#ils_phases .tab-pane:first").addClass("in"); //Fade the tab in
   $("#ils_cycle").wrap("<div id='customTopWrapper' class='customTop'></div>");

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
        $(window).scrollTop(fauxOffset-customBarHeight);
    });

};


$(window).scroll(function(){
    stickyBar();
});


function stickyBar() {

    var myNavMenuDataTop = myNavMenu.attr("data-top"); //gets the data-top attribute
    var myNavMenuOffset = myNavMenu.offset().top;// gets the offset from top of tabbed menu
    //var windowScrollTop= $(this).scrollTop(); //gets the ammount of scrolling in main_block
    var customBarOffset= customBar.offset().top;
    fauxOffset=faux.offset().top;
    windowScrollTop= $(this).scrollTop();
    var test = fauxOffset - windowScrollTop ;
    var test2 = fauxOffset - windowScrollTop - customBarHeight;


    if ((test2<=0) && (test>=0)){ //when menu reaches right under top bar push the bar up
        customBar.css({top:test2});
    }

    else if (test2>0){ //else keep bar attached
        customBar.css({top:0});
    }

    if ((test < 0) && !attached ) //attach the sticky bar when it has reached to the top
        {
            attached=true;
                 customBar.hide();
                     myNavMenu.addClass("fixedCustomTop");
                     faux.addClass("customHeight");
                     myNavMenu.fadeIn("slow");
         }

    else   if ((test > 0) && attached) // detach the sticky bar when not at the top

    {
        customBar.show();
        myNavMenu.removeClass("fixedCustomTop")
        faux.removeClass("customHeight");
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