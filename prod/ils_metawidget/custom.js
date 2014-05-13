//**** New UI Customization CERTH ****
// ------------------------------------ 
// ****			Start			 **** /

$("#loader-image-static").fadeIn(500);


// Dynamically add classes and format content
var applyNewLayout= function  () {
   $("#ils_phases .tab-pane").addClass("fade"); //Add Fade effect to tabs
   $("#ils_phases .tab-pane:first").addClass("in"); //Fade the tab in
   $("#ils_cycle").wrap("<div id='customTopWrapper' class='customTop'></div>");
   //When done, hide the loader and display content

    $("#loader").fadeOut(500);
   $("#main").fadeIn(1000);

   myNavMenu = $('#customTopWrapper');  //gets the tabbed menu
   customBar =$('#myCustomBar'); //get the info bar
   faux = $('#fauxContainer'); //gets the faux container
   customBarHeight = customBar.outerHeight(); //gets the height of info bar
   myNavMenuHeight = myNavMenu.outerHeight(); //gets the height of tabbed menu
   attached = false;


};


$(window).scroll(function(){
    stickyBar();
});


function stickyBar() {

    var myNavMenuDataTop = myNavMenu.attr("data-top"); //gets the data-top attribute
    var myNavMenuOffset = myNavMenu.offset().top;// gets the offset from top of tabbed menu
    var windowScrollTop= $(this).scrollTop(); //gets the ammount of scrolling in main_block
    var customBarOffset= customBar.offset().top;
    var fauxOffset=faux.offset().top;

    var test = fauxOffset - windowScrollTop + myNavMenuHeight;
    var test2 = fauxOffset - windowScrollTop - customBarHeight;

    //console.log(myNavMenuOffset+" "+windowScrollTop+" "+customBarOffset+" "+fauxOffset);

    if ((test2<=0) && (test>0)){ //when menu reaches right under top bar push the bar up
        customBar.css({top:test2});
    }
    
    else if (test2>0){ //else keep bar attached
        customBar.css({top:0});
    }


    
    if ((test < 0 ) && !attached ) //attach the sticky bar when it has reached to the top
        {
         customBar.css({top:-customBarHeight});
         myNavMenu.fadeOut(500,function(){
         myNavMenu.addClass("fixedCustomTop");
         faux.addClass("customHeight");
         myNavMenu.show("slide");

         });
         myNavMenu.bind('click', function (e) {
            $(bod).animate({ scrollTop: windowScrollTop }, 0);
         });
         attached=true;
         }

    else   if ((test > 0) && attached) // detach the sticky bar when not at the top
        
    {
        myNavMenu.removeClass("fixedCustomTop")
        myNavMenu.unbind('click');
        faux.removeClass("customHeight");
        attached=false;

    }
}

var animate_logo = function(){
    $("#name_prompt").fadeOut(500);
    $("#loader-image-static").hide();
    $("#loader-image").show();
};
//**** New UI Customization CERTH ****
// ------------------------------------ 
// ****			End	   			 **** /