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
        $("body").addClass("bg_image")
        checkTabBarOverflow();
    },1000);


    myNavMenu = $('#customTopWrapper');  //gets the tabbed menu
    customBar =$('#myCustomBar'); //get the info bar
    customBarWrapper =$('#customBarWrapper'); //get the customBarWrapper
    faux = $('#fauxContainer'); //gets the faux container
    customBarHeight = customBar.outerHeight(); //gets the height of info bar
    myNavMenuHeight = myNavMenu.outerHeight(); //gets the height of tabbed menu
    attached = false;
    windowScrollTop= $(window).scrollTop(); //gets the ammount of scrolling in main_block


    $('body').on('click', '.fixedCustomTop', function (e) {
        $(window).scrollTop(fauxOffset+2);
    });

    $('body').on('click', '#title', function (e) {
        setTimeout(function(){stickyBar();},50);
        $("#description_block").slideToggle(500,function(){stickyBar();});
    });



    $('#logout_button').on("click",function(e){
       logoutUser();
    });

};

var checkTabBarOverflow=function(){ //Check if tab bar has overflow
    var ils_cycle_bar=$("#ils_cycle");
    var ils_wrapper=$('#customTopWrapper');
    if (checkOverflow()){
        ils_cycle_bar.addClass("hasChevrons").parent("#customTopWrapper").prepend("<div id='leftChevron' class='tabChevron left disabled'/><div id='rightChevron' class='tabChevron right'/>");

        $('body')
            .on('click','#leftChevron',function (e) {
                var elem=hasHidden(this);
                if (elem){
                    $("#rightChevron").removeClass("disabled");
                    elem.show();
                }
                if (!hasHidden(this)){
                    $(this).addClass("disabled");
                }
                e.stopPropagation();
            })
            .on('click','#rightChevron',function (e) {
                var firstVisible=$(this).nextAll("#ils_cycle").children(":visible:first");
                if (checkOverflow()){
                    firstVisible.hide();
                    $("#leftChevron").removeClass("disabled");
                }
                if (!checkOverflow()){
                    $(this).addClass("disabled");
                }
                e.stopPropagation();
            })
            .on('tabClick',function (e) {
                var clickedTab = isOutsideContainer(e);
                if (clickedTab){
                        $("#rightChevron").trigger('click');
                        $(e.target).trigger("tabClick");

                }
            });
    }

    function checkOverflow(){ //checks if tab bar has still overflowing items to display (on the right)

        var childrenWidth=0;
        ils_cycle_bar.children(':visible').each(function(){
            childrenWidth+=$(this).width();
        });
        var margin=3;
        if (childrenWidth-margin > ils_cycle_bar.width()) {
        return true;
        }else return false;
    }

    function hasHidden(elem){ // checks if tab bar has hidden  items to display (on the left)
        var hiddenElem=$(elem).nextAll("#ils_cycle").children(":hidden:last");
        if (hiddenElem[0]!=null && hiddenElem[0]!=undefined&hiddenElem[0]!=""){
            return hiddenElem;
        }else return false;
    }

    function isOutsideContainer(elem){
        var targetTab= $(elem.target).parent();
        var targetTabWidth=targetTab.outerWidth();
        var targetTabOffset=targetTab.position().left;
        var containerWidth=targetTab.parents("#ils_cycle").width();
        if ((targetTabOffset+targetTabWidth)>containerWidth) {
            return targetTab;
        }
        else return false;
    }
}


$(window).scroll(function(){
    stickyBar();
});


function stickyBar() {

    fauxOffset=faux.offset().top;
    windowScrollTop= $(this).scrollTop();
    var test = fauxOffset - windowScrollTop ;
    var test2 = fauxOffset - windowScrollTop - customBarHeight;
    myNavMenuHeight = myNavMenu.outerHeight(); //gets the height of tabbed menu

    if ((test < customBarHeight) && !attached ) //attach the sticky bar when it has reached to the top
        {
            attached=true;
            myNavMenu.addClass("fixedCustomTop").css("top",customBarHeight);
            faux.css("height", myNavMenuHeight);
         }

    else   if ((test > customBarHeight) && attached) // detach the sticky bar when not at the top

    {
        myNavMenu.removeClass("fixedCustomTop").css("top",0);
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