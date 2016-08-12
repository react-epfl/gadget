myApp.controller('WebSocketController',['$scope', function($scope) {

    //Create flags
    var sensorValue=0;
    var graphFlag = 0;
    $scope.showQuantumDivFlag = 0;
    $scope.showMetadataButtonsFlag=0;

    //Establish Connection
    var host = 'shindig2.epfl.ch';
    var port = '8000';
    var results = "";

    var ws= new WebSocket('ws://' + host + ':' + port);
    ws.onopen=function(){
        ws.send("laser_power?"+0); //Make sure the laser is off on startup
        ws.send('getInitialData'); //Retrieve the initial situation of actuators
    };
    gadgets.window.adjustHeight();

    // Receive incoming messages
    ws.onmessage = function (event) {
        if(event.data.charAt(1)=='?'){
            //This part is reached only when initializing

            //RESETING EVERYTHING ON START
            ws.send("beam_splitter0?"+0);
            ws.send("beam_splitter1?"+0);
            ws.send("piezo_actuator?"+0);
            ws.send("filter_0?"+0);
            $scope.showQuantumDivFlag = 0;
            var parts=[0,0,0,0,0,0];
            //END OF RESET

            // The code below shows how to get the data that is originally found in the actuator metadata
            //var parts = event.data.split("?"); //UNCOMMENT THIS WHEN INITIAL DATA IS NEEDED and delete the above reset part
            if(parts[0]==1){
                if($('#laserButton').hasClass('btn-warning')){
                    //Do Nothing
                }else{
                    $("#laserButton").toggleClass("btn-warning");
                    $("#laserButton").toggleClass("btn-default");
                    $("#laserButton").html("Turn Laser Off");
                }
            }else{
                if($('#laserButton').hasClass('btn-warning')){
                    $("#laserButton").toggleClass("btn-warning");
                    $("#laserButton").toggleClass("btn-default");
                    $("#laserButton").html("Turn Laser On");
                }else{
                    //Do Nothing
                }
            }

            //Set the obtained values to the DOM elements
            $("#1").data('slider').setValue(parts[1]);
            $("#2").data('slider').setValue(parts[2]);
            $("#4").data('slider').setValue(parts[4]);
            $("#3").val(parts[3]);
            $("#span1").html(parts[1]);
            $("#span2").html(parts[2]);
            $("#span4").html(parts[4]);
            $("#photoDiodeVoltage").html(parts[5]);
        }else
            if(event.data.charAt(0)=='?'){
                //This means that what is being received is a sensor data
                sensorValue = Math.round(Number(event.data.slice(1))*10000)/10000;
                $("#photoDiodeVoltage").html(sensorValue);
            }
            else{
                //Metadata request has been made
                $scope.$apply(function () {
                    $("#messageDiv").html("<p>"+(event.data).split('\\n').join('<br>').split('\\t').join('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;')+"</p>");
                });
            }
    };

    // Laser On and off button click.
    $scope.laserClick = function () {
        if($('#laserButton').hasClass('btn-warning')){
            ws.send('laserOn');
        }else{
            ws.send('laserOff');
        }
    };

    // getClients on button click.
    $scope.getClients = function () {
        ws.send('getClients');
    };

    // Get Position button click.
    $scope.getSensorData = function () {
        ws.send('getSensorData');
    };

    //getSensorMetadata
    $scope.getSensorMetadata = function () {
        ws.send('getSensorMetadata');
    };

    //getActuatorMetadata
    $scope.getActuatorMetadata = function () {
        ws.send('getActuatorMetadata');
    };

    //sendActuatorData
    $scope.sendActuatorData = function () {
        ws.send('sendActuatorData');
    };

    //Handling UI changes

    //Beam Splitter 0 UI changes
    $('#1').slider().on('slide', function (event) {
        $('#span1').html(event.value);
        ws.send("beam_splitter0?"+event.value);
    });

    //Beam Splitter 1 UI changes
    $('#2').slider().on('slide', function (event) {
        $('#span2').html(event.value);
        ws.send("beam_splitter1?"+event.value);
    });

    //FIlter UI changes
    $('#4').slider().on('slide', function (event) {
        $('#span4').html(event.value);
        ws.send("filter_0?"+event.value);
    });

    //Piezo UI changes
    $('#3').on("keyup", function (event) {
        if ($(this).val()<=3) {
            if ($(this).val() != "")
                ws.send("piezo_actuator?" + $(this).val());
            else {
                ws.send("piezo_actuator?" + 0);
            }
        }
        else{
            $("#piezoError").html("* The piezo value must be between 0 and 3");
            $("#3").focus();
            $("#3").val($("#3").val().substring(0,$("#3").val().length -1))
            setTimeout(function(){
                $("#piezoError").html("");
            },2500);
        }
    });

    $("#laserButton").click(function(){
        if(!$(this).hasClass("btn-warning")) {
            $("#laserButton").toggleClass("btn-warning");
            $("#laserButton").toggleClass("btn-default");
            $("#laserButton").html("Turn Laser Off");
        }else{
            $("#laserButton").toggleClass("btn-warning");
            $("#laserButton").toggleClass("btn-default");
            $("#laserButton").html("Turn Laser On");
            
        }
        if($("#laserButton").hasClass("btn-warning")){
            ws.send("laser_power?"+1);
        }else{
            ws.send("laser_power?"+0);
        }
    });

    //Classical or Quantum
    $('input[type=radio][name=optradio]').change(function(){
        if($('input[name=optradio]:checked').val() == "quantum"){
            ws.send("beam_splitter0?"+$("#1").data('slider').getValue());
            ws.send("beam_splitter1?"+$("#2").data('slider').getValue());
            if($("#3").val()!="")
                ws.send("piezo_actuator?"+$("#3").val());
            else{
                ws.send("piezo_actuator?"+0);
            }
            $scope.showQuantumDivFlag = 1;
            ws.send("filter_0?"+$("#4").data('slider').getValue());
        }else{
            ws.send("beam_splitter0?"+0);
            ws.send("beam_splitter1?"+0);
            ws.send("piezo_actuator?"+0);
            ws.send("filter_0?"+0);
            $scope.showQuantumDivFlag = 0;
        }

        $scope.$apply();
        gadgets.window.adjustHeight();
    });

    //Handling metadata button changes
    $("#metadataDiv .btn-default").click(function(){
        $(".btn-default").removeClass("btn-warning");
        $(this).toggleClass("btn-warning");
    });

    //to generate the graph
    var dps = []; // dataPoints
    var chart = new CanvasJS.Chart("chartContainer",{
        title :{
            text: "Photo Diode Voltage During the Last 10 Seconds",
            fontColor: "white",
            titleFont: "arial"
        },
        data: [{
            type: "line",
            dataPoints: dps,
            color : "white",
            markerType: "none",
            toolTipContent: "t = {x} (s) <br/> V = {y} (V)"
        }],
        toolTip : {
            fontColor: "white",
            backgroundColor: "#5050d2",
            fontSize: 16
        },
        axisX : {
            title: "Time (s)",
            titleFontColor: "white",
            tickColor: "white",
            lineColor: "white",
            lineThickness : 2,
            labelFontColor: "white"
        },
        axisY : {
            title: "Voltage (V)",
            titleFontColor: "white",
            gridColor: "white",
            tickColor: "white",
            lineColor: "white",
            lineThickness : 2,
            gridDashType: "dash",
            labelFontColor: "white",
            gridThickness:1
        },
        backgroundColor: "#6262FF",
        zoomEnabled: true
    });

    var xVal = 0;
    var updateInterval = 100;
    var dataLength = 100; // number of dataPoints visible at any point

    var updateChart = function () {
        dps.push({
            x: xVal,
            y: sensorValue
        });
        results+= Math.round(Number(xVal)*10)/10 + " , " + sensorValue + "\n";
        xVal+=0.1;

        if (dps.length > dataLength)
        {
            dps.shift();
        }

        chart.render();

    };

    // generates first set of dataPoints
    updateChart();


    // update chart after specified time.
    setInterval(function(){
        if (graphFlag)
            updateChart();
    }, updateInterval);

    //pause and resume graph
    $scope.pause = function(){
        if ($("#pauseButton").hasClass("btn-warning")){
            $("#pauseButton").html("Click to Pause Graph");
            graphFlag = 1;
        }else{
            $("#pauseButton").html("Click to Resume Graph");
            graphFlag = 0;
        }
        $("#pauseButton").toggleClass("btn-warning");
        $("#pauseButton").toggleClass("btn-default");
    };

    $scope.save = function(){
        
            var blob = new Blob([results], {type: "text/plain;charset=utf-8"});
            saveAs(blob, "Experiment results on " + new Date());
            results="";
            dps.splice(0,dps.length);
            xVal=0;
    };

}]);

