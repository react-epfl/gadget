myApp.controller('WebSocketController',['$scope', function($scope) {

    //Create flags
    var sensorValue=0;
    var graphFlag = 0;
    $scope.showQuantumDivFlag = 0;
    $scope.showMetadataButtonsFlag=0;
    var pageIsLoaded = 0;
    var actionLoggerReady = 0;

    $(document).ready(function() {
        pageIsLoaded = 1;
    });

    //Establish Connection
    var host = 'shindig2.epfl.ch';
    var port = '8000';
    var results = '';
    var ws = new WebSocket('ws://' + host + ':' + port);
    ws.onopen = function() { 
        ws.send('laser_power?'+0); //Make sure the laser is off on startup
        ws.send('getInitialData'); //Retrieve the initial situation of actuators
    };
    gadgets.window.adjustHeight();
    var currentUser;
    ils.getCurrentUser(function(result) {
        currentUser = result;
    });
    var initialMetadata = {
          "id": "2e90ab41-2893-42ca-9169-b2dcd10285a6",
          "published": "2014-11-12T09:27:14.186Z",
          "storageType": "vault",
          "storageId": "",
          "actor": {
             "objectType": "person",
             "id": "lars@5458b041427dd6ce7cbf7006",
             "displayName": "lars"
          },
          "target": {
             "objectType": "lab experiment",
             "id": "unknown",
             "displayName": "Mach Zehnder Experiment"
          },
          "generator": {
             "objectType": "application",
             "url": window.location.href,
             "id": "unknown",
             "displayName": "Mach Zehnder Interferometer"
         },
         "provider": {
             "objectType": "ils",
             "url": window.location.href,
             "id": "unknown",
             "displayName": "unknown",
             "inquiryPhase": "unknown"
         }
    };
    var example_metadata = {
          "published": "2016-08-15T09:27:14.186Z",
          "storageType": "vault",
          "storageId": "",
          "actor": {
            "objectType": "person",
            "id": "57a3939b8bf26f18c08e5e12",
            "displayName": "hagop"
          },
          "target": {
            "objectType": "lab experiment",
            "id": "unknown",
            "displayName": "Mach Zehnder Experiment"
          },
          "generator": {
            "objectType": "application",
            "url": "http://128.178.96.66/GadgetTest/WebClients/gadget.xml#appId=57b1aa566afd990f54b07795&owner=57b1aa276afd990f54b0770d",
            "id": null,
            "displayName": "Mach Zehnder Interferometer"
          },
          "provider": {
            "objectType": "ils",
            "url": "http://graasp.eu/spaces/57b1aa276afd990f54b076fc",
            "id": "57b1aa276afd990f54b076fc",
            "displayName": "Test",
            "inquiryPhase": "Investigation",
            "inquiryPhaseId": "57b1aa276afd990f54b0770d",
            "inquiryPhaseName": "Investigation"
          }
        };
    var example_content = { 
        "dataPoints": [
          {
            "t": 0,
            "V": 0,
          }
       ],
       "experimentTime": moment()
    };

    //Initializing the action logger
    var actionLogger;
    new window.golab.ils.metadata.GoLabMetadataHandler(initialMetadata, function(shouldBeNull,metadataHandler) {
        actionLogger = new window.ut.commons.actionlogging.ActionLogger(metadataHandler);
        actionLogger.setLoggingTarget("console");
        actionLoggerReady =1 ;
    });

    /*var Vws = new WebSocket("ws://IP:PORT/WS_Video");
    var sensorRequest = { method: 'getSensorData', sensorId: 'Video', accessRole: 'controller' } 
    var jsonRequest = JSON.stringify(sensorRequest); 
    Vws.send(jsonRequest); */

    //Initialize DOM elements
    //Initializing and handling F1
    var valueInputf1 = document.getElementById('value-inputf1');
    var f1 = document.getElementById('f1');
    noUiSlider.create(f1, {
        start: 0,
        step: 1,
        behaviour: 'tap',
        connect: 'lower',
        orientation: 'vertical',
        range: {
            'min':  0,
            'max':  90
        }
    });
    f1.noUiSlider.on('update', function(values, handle) {
        valueInputf1.value = Math.round(values[0]);
        if (pageIsLoaded==1) {
            ws.send('filter_0?'+Math.round(values[0]));
            //Log Activity
            var logObject = {
                "objectType": "slider",
                "displayName":"filterSlider",
                "content": Math.round(values[0])
            };
            if (actionLoggerReady)
                actionLogger.logChange(logObject);
        }
    });
    valueInputf1.addEventListener('change', function() {
        f1.noUiSlider.set(this.value);
    });

    //Initializing and handling BS1
    var valueInputbs1 = document.getElementById('value-inputbs1');
    var bs1 = document.getElementById('bs1');
    noUiSlider.create(bs1, {
        start: 0,
        step: 1,
        behaviour: 'tap',
        connect: 'lower',
        orientation: 'vertical',
        range: {
            'min':  0,
            'max':  90
        }
    });
    bs1.noUiSlider.on('update', function(values, handle) {
        valueInputbs1.value = Math.round(values[0]);
        if (pageIsLoaded==1) {
            ws.send('beam_splitter0?'+Math.round(values[0]));
            //Log Activity
            var logObject = {
                "objectType": "slider",
                "displayName":"beamSplitter0",
                "content": Math.round(values[0])
            };
            if (actionLoggerReady)
                actionLogger.logChange(logObject);
        }
    });
    valueInputbs1.addEventListener('change', function() {
        bs1.noUiSlider.set(this.value);
    });

    //Initializing and handling BS2
    var valueInputbs2 = document.getElementById('value-inputbs2');
    var bs2 = document.getElementById('bs2');
    noUiSlider.create(bs2, {
        start: 0,
        step: 1,
        behaviour: 'tap',
        connect: 'lower',
        orientation: 'horizontal',
        range: {
            'min':  0,
            'max':  90
        }
    });
    bs2.noUiSlider.on('update', function(values, handle) {
        valueInputbs2.value = Math.round(values[0]);
        if (pageIsLoaded==1) {
            ws.send('beam_splitter1?'+Math.round(values[0]));
            //Log Activity
            var logObject = {
                "objectType": "slider",
                "displayName":"beamSplitter1",
                "content": Math.round(values[0])
            };
            if (actionLoggerReady)
                actionLogger.logChange(logObject);
        }
    });
    valueInputbs2.addEventListener('change', function() {
        bs2.noUiSlider.set(this.value);
    });

    //Initializing and handling Piezo
    valueInputpiezo = document.getElementById('value-inputpiezo');
    var piezo = document.getElementById('piezo');
    noUiSlider.create(piezo, {
        start: [0, 3],
        step: 0.01,
        margin: 3,
        connect: true,
        orientation: 'vertical',
        behaviour: 'drag-fixed',
        range: {
            'min': -3,
            'max': 3
        }
    });
    piezo.noUiSlider.on('update', function(values, handle) {
        valueInputpiezo.value = values[0]*(-1);
        if (pageIsLoaded==1) {
            ws.send('piezo_actuator?'+values[0]*(-1));
            var logObject = {
                "objectType": "slider",
                "displayName":"piezo",
                "content": values[0]*(-1)
            };
            if (actionLoggerReady)
                actionLogger.logChange(logObject);
        }
    });
    valueInputpiezo.addEventListener('change', function() {
        piezo.noUiSlider.set([(-1)*(this.value), (this.value-3)*(-1)]);
    });
    document.getElementById("piezo").style.transform = "rotate(45deg)";

    // Receive incoming messages
    ws.onmessage = function(event) {
        if (event.data.charAt(1)=='?') {
            //This part is reached only when initializing
            //RESETING EVERYTHING ON START
            ws.send('beam_splitter0?'+0);
            ws.send('beam_splitter1?'+0);
            ws.send('piezo_actuator?'+0);
            ws.send('filter_0?'+0);
            $scope.showQuantumDivFlag = 0;
            var parts=[0,0,0,0,0,0];
            //END OF RESET
            // The code below shows how to get the data that is originally found in the actuator metadata
            //var parts = event.data.split("?"); //UNCOMMENT THIS WHEN INITIAL DATA IS NEEDED and delete the above reset part
            if (parts[0]==1) {
                if ($('#laserButton').hasClass('btn-warning')) {
                    //Do Nothing
                } else {
                    $('#laserButton').toggleClass('btn-warning');
                    $('#laserButton').toggleClass('btn-default');
                    $('#laserButton').html('Turn Laser Off');
                }
            } else {
                if ($('#laserButton').hasClass('btn-warning')) {
                    $('#laserButton').toggleClass('btn-warning');
                    $('#laserButton').toggleClass('btn-default');
                    $('#laserButton').html('Turn Laser On');
                } else {
                    //Do Nothing
                }
            }
            //Set the obtained values to the DOM elements
            bs1.noUiSlider.set(parts[1]);
            bs2.noUiSlider.set(parts[2]);
            f1.noUiSlider.set(parts[4]);
            piezo.noUiSlider.set([(-1)*(parts[3]), (parts[3])*(-1)]);
            valueInputbs1.value = parts[1];
            valueInputbs2.value = parts[2];
            valueInputf1.value = parts[4];
            valueInputpiezo.value = parts[3];
            $('#photoDiodeVoltage').html(parts[5]);
        } else
            if (event.data.charAt(0)=='?') {
                //This means that what is being received is a sensor data
                sensorValue = Math.round(Number(event.data.slice(1))*10000)/10000;
                $('#photoDiodeVoltage').html(sensorValue);
            } else {
                //Metadata request has been made
                $scope.$apply(function() {
                    $('#messageDiv').html('<p>'+(event.data).split('\\n').join('<br>').split('\\t').join('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;')+'</p>');
                });
            }
    };

    // Laser On and off button click.
    $scope.laserClick = function() {
        if ($('#laserButton').hasClass('btn-warning')) {
            ws.send('laserOn');
        } else {
            ws.send('laserOff');
        }
    };

    // getClients on button click.
    $scope.getClients = function() {
        ws.send('getClients');
    };

    // Get Position button click.
    $scope.getSensorData = function() {
        ws.send('getSensorData');
    };

    //getSensorMetadata
    $scope.getSensorMetadata = function() {
        ws.send('getSensorMetadata');
    };

    //getActuatorMetadata
    $scope.getActuatorMetadata = function() {
        ws.send('getActuatorMetadata');
    };

    //sendActuatorData
    $scope.sendActuatorData = function() {
        ws.send('sendActuatorData');
    };

    //Handling laser button changes
    $('#laserButton').click(function() {
        if (!$(this).hasClass('btn-warning')) {
            $('#laserButton').toggleClass('btn-warning');
            $('#laserButton').toggleClass('btn-default');
            $('#laserButton').html('Turn Laser Off');
        } else {
            $('#laserButton').toggleClass('btn-warning');
            $('#laserButton').toggleClass('btn-default');
            $('#laserButton').html('Turn Laser On');  
        }
        if ($('#laserButton').hasClass('btn-warning')) {
            ws.send('laser_power?'+1);
            graphFlag = 1;
            //Log Activity
             var logObject = {
                "objectType": "button",
                "displayName":"laserButton",
             }
             actionLogger.logStart(logObject);
        } else {
            ws.send('laser_power?'+0);
            //Log Activity
            var logObject = {
                "objectType": "button",
                "displayName":"laserButton",
             }
            actionLogger.logCancel(logObject);
        }
    });

    //Classical or Quantum
    $('input[type=radio][name=optradio]').change(function() {
        if ($('input[name=optradio]:checked').val() == 'quantum') {
            $scope.showQuantumDivFlag = 1;
            ws.send('beam_splitter0?' + valueInputbs1.value);
            ws.send('beam_splitter1?' + valueInputbs2.value);
            ws.send('piezo_actuator?' + valueInputpiezo.value);
            ws.send('filter_0?' + valueInputf1.value);
            //Log Activity
             var logObject = {
                "objectType": "radioButton",
                "displayName":"quantumButton",
             }
             actionLogger.logAccess(logObject);
        } else {
            ws.send('beam_splitter0?'+0);
            ws.send('beam_splitter1?'+0);
            ws.send('piezo_actuator?'+0);
            ws.send('filter_0?'+0);
            $scope.showQuantumDivFlag = 0;
            //Log Activity
            var logObject = {
                "objectType": "radioButton",
                "displayName":"classicalButton",
            }
            actionLogger.logAccess(logObject);
        }
        $scope.$apply();
        gadgets.window.adjustHeight();
    });

    //Handling metadata button changes
    $('#metadataDiv .btn-default').click(function() {
        $('.btn-default').removeClass('btn-warning');
        $(this).toggleClass('btn-warning');
    });

    //to generate the graph
    var dps = []; // dataPoints
    var chart = new CanvasJS.Chart('chartContainer', {
        title : {
            text: "Photo Diode Voltage During the Last 10 Seconds",
            fontColor: "white",
            titleFont: "arial"
        },
        data: [ {
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
        backgroundColor: "#6262FF"
    });
    var xVal = 0;
    var updateInterval = 100;
    var dataLength = 100; // number of dataPoints visible at any point
    var updateChart = function() {
        dps.push({
            x: xVal,
            y: sensorValue
        });
        example_content.dataPoints.push({
            t: Math.round(Number(xVal)*10)/10,
            V: sensorValue
        });
        results+= Math.round(Number(xVal)*10)/10 + ' , ' + sensorValue + '\n';
        xVal+=0.1;
        if (dps.length > dataLength)
            dps.shift();
        chart.render();
    };

    // generates first set of dataPoints
    updateChart();
    // update chart after specified time.
    setInterval(function() {
        if (graphFlag)
            updateChart();
    }, updateInterval);

    //pause and resume graph
    //This is how to pause and resume through clicking on the graph
    $scope.pause = function() {
        graphFlag = (graphFlag==1?0:1);
        //Log Action
        if (graphFlag==1) {
            var logObject = {
                "objectType": "button",
                "displayName":"graphActivityButton"
            }
            actionLogger.logStart(logObject);
        } else {
            var logObject = {
                "objectType": "button",
                "displayName":"graphActivityButton"
            }
            actionLogger.logCancel(logObject);
        }
    };

    //This is how to pause and resume in case we have a button for that
    /*$scope.pause = function(){
        if ($("#pauseButton").hasClass("btn-warning")){
            $("#pauseButton").html("Click to Pause Graph");
            graphFlag = 1;
        }else{
            $("#pauseButton").html("Click to Resume Graph");
            graphFlag = 0;
        }
        $("#pauseButton").toggleClass("btn-warning");
        $("#pauseButton").toggleClass("btn-default");
    };*/

    $scope.save = function() {
        if (currentUser!= undefined)
            example_content.userName = currentUser;
        var blob = new Blob([results], {type: 'text/plain;charset=utf-8'});
        saveAs(blob, 'Experiment results on ' + new Date());
        results = '';
        dps.splice(0,dps.length);
        xVal = 0;
        //Log Activity
        var logObject = {
            "objectType": "button",
            "displayName":"sendExperimentResults"
        };
        actionLogger.logSend(logObject);
        ils.createResource('test', example_content, example_metadata,function(resource) {
          console.log(resource);
        });
        example_content = { 
           "dataPoints": [
              {
                "t": 0,
                "V": 0,
              }
           ],
           "experimentTime": moment()
        };
    };
}]);