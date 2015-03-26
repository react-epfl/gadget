//**** New UI Customization CERTH ****
// ------------------------------------ 
// ****			Start			 **** /

// Dynamically add classes and format content
var applyNewLayout= function  () {

   $("#ils_phases .tab-pane").addClass("fade"); //Add Fade effect to tabs
   $("#ils_phases .tab-pane:first").addClass("in"); //Fade the tab in
   $("#ils_cycle").wrap("<div id='topWrapper'></div>").wrap("<div id='customTopWrapper' class='customTop'></div>");

    //When done, hide the loader and display content
        $("#main").show();
        var firstPhase=$("#ils_cycle").children("li:first").children();
        var firstColor=firstPhase.attr("bg_color");
        var firstImage=firstPhase.attr("bg_image_url");
        applyBackground(firstImage,firstColor);
        checkTabBarOverflow();
        $("#loader").hide("fade", 500, function () {
                $(this).remove();
        });


    myNavMenu = $('#topWrapper');  //gets the tabbed menu
    customBar =$('#myCustomBar'); //get the info bar
    customBarWrapper =$('#customBarWrapper'); //get the customBarWrapper
    faux = $('#fauxContainer'); //gets the faux container
    customBarHeight = customBar.outerHeight(); //gets the height of info bar
    myNavMenuHeight = myNavMenu.outerHeight(); //gets the height of tabbed menu
    attached = false;


    $('body').on('click', '.fixedCustomTop', function (e) {
        var descriptionOffset;
        try{
            descriptionOffset=$("#description_block").innerHeight();
        }catch(err){
            descriptionOffset=0;
        }
        descriptionOffset= isNaN(descriptionOffset)?0:descriptionOffset;
        $("#main_block").scrollTop(descriptionOffset);
    });

    $('body').on('click', '#title', function (e) {
        setTimeout(function(){stickyBar();},50);
        $("#description_block").slideToggle(500,function(){stickyBar();});
    });

    $('#logout_button').on("click",function(e){
        logoutUser();
    });

};

$('body').on('tabClick',function (e) {
    var clickedTab = e.target;
    applyBackground($(clickedTab).attr("bg_image_url"),$(clickedTab).attr("bg_color"));
});


$("#main_block").scroll(function(){
    stickyBar();
});

$(window).resize(function(){
    checkTabBarOverflow();
});


function stickyBar() {

    fauxOffset=faux.offset().top;
    myNavMenuHeight = myNavMenu.outerHeight(); //gets the height of tabbed menu

    if ((fauxOffset < customBarHeight) && !attached ) //attach the sticky bar when it has reached to the top
    {
        attached=true;
        myNavMenu.addClass("fixedCustomTop").css("top",customBarHeight);
        faux.css("height", myNavMenuHeight);
    }

    else   if ((fauxOffset > customBarHeight) && attached) // detach the sticky bar when not at the top

    {
        myNavMenu.removeClass("fixedCustomTop").css("top",0);
        faux.css("height", 0);
        attached=false;
    }
}

var applyBackground=function(image_url,color){
    try{
        var image_url=image_url?image_url:app.backgroundImage;
        var color=color?color:app.backgroundColor;
        if(image_url!=undefined&&image_url!=""&&image_url!=null){
            var new_node=$("<div class='bg_image'/>").appendTo("#bg_image").css({"background-image": "url('"+image_url+"')"});
            new_node.fadeIn(500,function(){
                $("#bg_image").children(":first").not(this).remove()
            });

        }else if (color!=undefined&&color!=""&&acolor!=null){
            var new_node=$("<div class='bg_image'/>").appendTo("#bg_image").css({"background-color":color});
            new_node.fadeIn(500,function(){
                $("#bg_image").children(":first").not(this).remove()
            });
        }else{
            var new_node=$("<div class='bg_image bg_default'/>").appendTo("#bg_image");
            new_node.fadeIn(500,function(){
                $("#bg_image").children(":first").not(this).remove()
            });
        }


    }catch(err){
        console.log("Cannot set custom ILS background. Using default. "+err)
        var new_node=$("<div class='bg_image bg_default'/>").appendTo("#bg_image")
        new_node.fadeIn(500,function(){$("#bg_image").children(":first").not(this).remove();});
    }
}

var animate_logo = function(){
    if ($('#user_name').is(':visible')){
        $("#name_prompt").hide("fade",500,function(){
            $("#inner_loader").animate({top:"+=200"},1000);
        });
    }
    if($('#loader-image-static').is(':visible')) {
        $("#loader-image-static").hide();
    }

    if($('#loader-image').is(':hidden')) {
        $("#loader-image").show("fade", 500);
    }
};

var checkTabBarOverflow=function(){ //Check if tab bar has overflow
    var ils_cycle_bar=$("#ils_cycle");
    var ils_wrapper=$('#customTopWrapper');
    if (checkOverflow("current")&&!ils_cycle_bar.hasClass("hasChevrons")){
        ils_cycle_bar.addClass("hasChevrons").parent("#customTopWrapper").addClass("hasChevrons").prepend("<div id='leftChevron' class='tabChevron left disabled'/><div id='rightChevron' class='tabChevron right'/>");

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
                if (checkOverflow("current")){
                    firstVisible.hide();
                    $("#leftChevron").removeClass("disabled");
                }
                if (!checkOverflow("current")){
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
    }else if (!checkOverflow("initial")&&ils_cycle_bar.hasClass("hasChevrons")) {
        ils_cycle_bar.removeClass("hasChevrons").parent("#customTopWrapper").removeClass("hasChevrons").children(".tabChevron").remove();
        ils_cycle_bar.children().show();
    }

    function checkOverflow(state){ //checks if tab bar has still overflowing items to display (on the right)

        var childrenWidth=0;
        if (state=="current") {
            ils_cycle_bar.children(':visible').each(function () {
                childrenWidth += $(this).width();
            });
        }else if (state=="initial") {
            ils_cycle_bar.children().each(function () {
                childrenWidth += $(this).width();
            });
        }
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



//**** New UI Customization CERTH ****
// ------------------------------------ 
// ****			End	   			 **** /