myApp.controller('WebSocketController',['$scope', function($scope) {

    //Create flags and variables
    var sensorValue=0;
    var graphFlag = 0;
    var bs1IsActivated = 0;
    var bs2IsActivated = 0;
    var filterIsActivated = 0;
    $scope.piezoIsActivated = 0;
    $scope.showQuantumDivFlag = 0;
    $scope.showMetadataButtonsFlag=0;
    $scope.laserIsOn = 0;
    var pageIsLoaded = 0;
    var actionLoggerReady = 0;
    var connected = 0;
    var VWS;
    var FF;

    //upon loading
    $(document).ready(function() {
        pageIsLoaded = 1;
        createChart();
        //check if it is firefox
        FF=(navigator.userAgent.search("Firefox") >= 0);
        initialize();
        initializeVideoSocket();
    });
    //initializing the video web socket
    var initializeVideoSocket = function() {
        Vws = new WebSocket('ws://145.232.235.206:8888/WS_Video');
        Vwsopen.Vws = Vws;
        Vws.onopen = Vwsopen;
        Vws.onmessage = Vwsmessage;
        Vws.onclose = Vwsclose;

        var SVGDoc=null; 
        var myimage =new Image();

        function Vwsopen(event) {
            var sensorRequest = {
                method: 'getSensorData',
                sensorId: 'Video',
                accessRole: 'controller'
            }
            var jsonRequest = JSON.stringify(sensorRequest);
            Vws.send(jsonRequest);
        }

        function Vwsmessage(event) {
            if (event.data instanceof Blob) {
                var destinationCanvas = document.getElementById('mycanvas');
                destinationCanvas.height="210";
                destinationCanvas.width="280";
                var destinationContext = destinationCanvas.getContext('2d');
                var URL = window.URL || window.webkitURL;
                if (FF) {
                    myimage.src = URL.createObjectURL(event.data);
                    destinationContext.drawImage(myimage, 0, 0);
                }
                else { 
                destinationContext.scale(0.875,0.875);
                destinationContext.drawImage(myimage, 0, 0);
                myimage.src = URL.createObjectURL(event.data);
                }
            }
        }

        function Vwsclose(event) {
        }
    };

    //initialise UI elemenets
    var initialize = function() {
        $scope.showQuantumDivFlag = 0;
        var parts=[0,0,0,0,0,0];
        //Set the obtained values to the DOM elements
        piezo.noUiSlider.set([(-1)*(parts[3]), (parts[3])*(-1)]);
        $('#photoDiodeVoltage').html(parts[5]);
    };

    //Establish Connection
    var host = '145.232.235.206';
    var port = '8888';

    var results = '';
    var ws = new WebSocket('ws://' + host + ':' + port);
    ws.onopen = function() { 
        connected = 1;
        console.log("connected");
        //ws.send('laser_power?'+0); //Make sure the laser is off on startup
        var sensorRequest = {
            method: 'getSensorData',
            sensorId: 'photodiode',
            accessRole: 'controller'
        }
        jsonRequest = JSON.stringify(sensorRequest);
        if (connected){
            ws.send(jsonRequest);
        }
        //ws.send('getInitialData'); //Retrieve the initial situation of actuators
    };
    gadgets.window.adjustHeight();
    var currentUser;
    ils.getCurrentUser(function(result) {
        currentUser = result;
    });
    var initialMetadata = {
          "id": "2e90ab41-2893-42ca-9169-b2dcd10285a6",
          "published": "2016-08-22T13:09:28.395Z",
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
             "url": "http://shindig2.epfl.ch/gadget/prod/mach_zehnder_gadget/gadget.xml",
             "id": "57adec0c1ce973e1f2aa9ca8",
             "displayName": "Mach Zehnder Interferometer"
         },
         "provider": {
             "objectType": "ils",
             "url": "http://graasp.eu/spaces/57adeba41ce973e1f2aa9c69",
             "id": "57adeba41ce973e1f2aa9c69",
             "displayName": "Mach Zehnder ILS",
             "inquiryPhase": "Investigation"
         }
    };
    var example_metadata = {
          "published": "2016-08-22T13:09:28.395Z",
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
            "url": "http://shindig2.epfl.ch/gadget/prod/mach_zehnder_gadget/gadget.xml",
            "id": "57adec0c1ce973e1f2aa9ca8",
            "displayName": "Mach Zehnder Interferometer"
          },
          "provider": {
            "objectType": "ils",
            "url": "http://graasp.eu/spaces/57adeba41ce973e1f2aa9c69",
            "id": "57adeba41ce973e1f2aa9c69",
            "displayName": "Test",
            "inquiryPhase": "Investigation",
            "inquiryPhaseId": "57adeba41ce973e1f2aa9c78",
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
        actionLogger.setLoggingTarget("opensocial");
        actionLoggerReady =1 ;
    });

    //Initialize DOM elements
    //Initializing and handling Piezo
    var piezo = document.getElementById('piezo');
    noUiSlider.create(piezo, {
        start: [0, 15],
        step: 0.01,
        margin: 15,
        connect: true,
        orientation: 'vertical',
        behaviour: 'drag-fixed',
        range: {
            'min': -3,
            'max': 15
        }
    });
    piezo.setAttribute('disabled', true);
    document.getElementById("piezo").style.transform = "rotate(45deg)";
    document.getElementById("arrowsImage").style.transform = "rotate(45deg)";

    // Receive incoming messages
    ws.onmessage = function(event) {
        var data = event.data;
        var msg;
        try {
            msg = JSON.parse(data);
            if (msg.method=="getSensorMetadata" || msg.method=="getActuatorMetadata" || msg.method=="getClients" || msg.method=="sendActuatorData") {
                //Metadata request has been made       
                $scope.$apply(function() {
                    $('#messageDiv').html('<p>'+(event.data).split('\\n').join('<br>').split('\\t').join('&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;')+'</p>');
                });
            } else {       
                if (msg.method == "getSensorData") {
                    //This means that what is being received is a sensor data
                    if(msg.responseData){
                        sensorValue = Math.round(Number(msg.responseData.data[0])*10000)/10000;
                        $('#photoDiodeVoltage').html(sensorValue);
                    }
                }
            }
        } catch (e) {
            console.log(e);
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

    $scope.laserClick = function() {
        if ($scope.laserIsOn) 
            $scope.turnLaserOff();
        else
            $scope.turnLaserOn();
    }

    $scope.turnLaserOn = function() {
        $scope.laserIsOn = 1;
        $("#laserOffImage").glow({ radius: "5", color:"green"});
        var actuatorRequest = {
            authToken: 'skfjs343kjKJ',
            method: 'sendActuatorData',
            accessRole: 'controller',
            actuatorId: 'power',
            valueNames: "",
            data: '1'
        };
        var jsonRequest = JSON.stringify(actuatorRequest);
        ws.send(jsonRequest);
        graphFlag = 1;
        //Log Activity
         var logObject = {
            "objectType": "button",
            "displayName":"laserButton",
         }
         actionLogger.logStart(logObject);
    }
    $scope.turnLaserOff = function() {
        $scope.laserIsOn = 0; 
        $("#laserOffImage").glow({ disable:true });
        var actuatorRequest = {
            authToken: 'skfjs343kjKJ',
            method: 'sendActuatorData',
            accessRole: 'controller',
            actuatorId: 'power',
            valueNames: "",
            data: '0'
        };
        var jsonRequest = JSON.stringify(actuatorRequest);
        ws.send(jsonRequest);
        graphFlag = 0;
        //Log Activity
        var logObject = {
            "objectType": "button",
            "displayName":"laserButton",
        };
        actionLogger.logCancel(logObject);
    }

    $scope.bs1Clicked = function() {
        if (bs1IsActivated) {
            bs1IsActivated = 0;
            $('#bs1Image').animate({top : '-=15px'});
            $("#bs1Image").glow({ disable:true });
            var actuatorRequest = {
                authToken: 'skfjs343kjKJ',
                method: 'sendActuatorData',
                accessRole: 'controller',
                actuatorId: 'bs1',
                valueNames: "",
                data: '0'
            };
            var jsonRequest = JSON.stringify(actuatorRequest);
            ws.send(jsonRequest); 
            //Log Activity
            var logObject = {
                "objectType": "image",
                "displayName":"bs1Image",
            };
            actionLogger.logCancel(logObject);
        } else {
            bs1IsActivated = 1;
            $('#bs1Image').animate({top : '+=15px'});
            $("#bs1Image").glow({ radius: "3", color:"green"});
            var actuatorRequest = {
                authToken: 'skfjs343kjKJ',
                method: 'sendActuatorData',
                accessRole: 'controller',
                actuatorId: 'bs1',
                valueNames: "",
                data: '1'
            };
            var jsonRequest = JSON.stringify(actuatorRequest);
            ws.send(jsonRequest); 
            //Log Activity
            var logObject = {
                "objectType": "image",
                "displayName":"bs1Image",
             }
            actionLogger.logStart(logObject);
        }
    }

    $scope.bs2Clicked = function() {
        if (bs2IsActivated) {
            bs2IsActivated = 0;
            $('#bs2Image').animate({left : '-=18px'});
            $("#bs2Image").glow({ disable:true }); 
            var actuatorRequest = {
                authToken: 'skfjs343kjKJ',
                method: 'sendActuatorData',
                accessRole: 'controller',
                actuatorId: 'bs2',
                valueNames: "",
                data: '0'
            };
            var jsonRequest = JSON.stringify(actuatorRequest);
            ws.send(jsonRequest); 
            //Log Activity
            var logObject = {
                "objectType": "image",
                "displayName":"bs2Image",
            };
            actionLogger.logCancel(logObject);
        } else {
            bs2IsActivated = 1;
            $('#bs2Image').animate({left : '+=18px'});
            $("#bs2Image").glow({ radius: "3", color:"green"});
            var actuatorRequest = {
                authToken: 'skfjs343kjKJ',
                method: 'sendActuatorData',
                accessRole: 'controller',
                actuatorId: 'bs2',
                valueNames: "",
                data: '1'
            };
            var jsonRequest = JSON.stringify(actuatorRequest);
            ws.send(jsonRequest); 
            //Log Activity
            var logObject = {
                "objectType": "image",
                "displayName":"bs2Image",
            };
            actionLogger.logStart(logObject);
        }
    }

    $scope.filterClicked = function() {
        if (filterIsActivated) {
            deactivateFilter();
             //Log Activity
            var logObject = {
                "objectType": "image",
                "displayName":"filterImage",
            };
            actionLogger.logCancel(logObject);
            $('#classicalButton').prop('checked',true);
            $('#quantumButton').prop('checked',false);
        } else {
            activateFilter();
            //Log Activity
            var logObject = {
                "objectType": "image",
                "displayName":"filterImage",
            };
            actionLogger.logStart(logObject);
            $('#classicalButton').prop('checked',false);
            $('#quantumButton').prop('checked',true);
        }
    }

    function activateFilter() {
        filterIsActivated = 1;
        $('#filterImage').animate({top : '+=10px'});
        $("#filterImage").glow({ radius: "2", color:"green"});

        var actuatorRequest = {
            authToken: 'skfjs343kjKJ',
            method: 'sendActuatorData',
            accessRole: 'controller',
            actuatorId: 'duty2',
            valueNames: "",
            data: 3+''
        };
        var jsonRequest = JSON.stringify(actuatorRequest);
        if (connected)
            ws.send(jsonRequest);

        var actuatorRequest = {
            authToken: 'skfjs343kjKJ',
            method: 'sendActuatorData',
            accessRole: 'controller',
            actuatorId: 'duty2',
            valueNames: "",
            data: 0+''
        }
        console.log(actuatorRequest);
        var jsonRequest = JSON.stringify(actuatorRequest);
        setTimeout(function() { 
            ws.send(jsonRequest);
        }, 500);
    }

    function deactivateFilter() {
        filterIsActivated = 0;
        $('#filterImage').animate({top : '-=10px'});
        $("#filterImage").glow({ disable:true }); 

        var actuatorRequest = {
            authToken: 'skfjs343kjKJ',
            method: 'sendActuatorData',
            accessRole: 'controller',
            actuatorId: 'duty2',
            valueNames: "",
            data: 3+''
        };
        var jsonRequest = JSON.stringify(actuatorRequest);
        if (connected)
            ws.send(jsonRequest);

        var actuatorRequest = {
            authToken: 'skfjs343kjKJ',
            method: 'sendActuatorData',
            accessRole: 'controller',
            actuatorId: 'duty2',
            valueNames: "",
            //data: valueInputf1.value+''
            data: 0+''
        }
        console.log(actuatorRequest);
        var jsonRequest = JSON.stringify(actuatorRequest);
        setTimeout(function() { 
            ws.send(jsonRequest);
        },500);
    }

    //Handling piezo image changes
    $('#piezo').click(function() {
        if (!$scope.piezoIsActivated) {
            $scope.piezoIsActivated = 1;
            $("#piezo").glow({ radius: "4", color:"green"});
            piezo.noUiSlider.set([-3, 12]);
            setTimeout(function() {
                $('#mirrorImage').css({'top' : 197, 'left' : 75});
                $('#rayImage').css('top', 209);
                $('#ray2Image').css('top', 208);
            }, 150);
            $scope.$apply();
            var actuatorRequest = {
                authToken: 'skfjs343kjKJ',
                method: 'sendActuatorData',
                accessRole: 'controller',
                actuatorId: 'piezo',
                valueNames: "",
                data: '1'
            };
            var jsonRequest = JSON.stringify(actuatorRequest);
            ws.send(jsonRequest);
            //Log Activity
            var logObject = {
                "objectType": "button",
                "displayName":"piezoButton",
            };
             actionLogger.logStart(logObject);
        } else {
            $scope.piezoIsActivated = 0;
            $("#piezo").glow({ disable:true });
            piezo.noUiSlider.set([0, 15]); 
            setTimeout(function() {
                $('#mirrorImage').css({'top' : 200, 'left' : 72});
                $('#rayImage').css('top', 215);
                $('#ray2Image').css('top', 214);
            }, 150);
            $scope.$apply();
            var actuatorRequest = {
                authToken: 'skfjs343kjKJ',
                method: 'sendActuatorData',
                accessRole: 'controller',
                actuatorId: 'piezo',
                valueNames: "",
                data: '0'
            };
            var jsonRequest = JSON.stringify(actuatorRequest);
            ws.send(jsonRequest);
            //Log Activity
            var logObject = {
                "objectType": "button",
                "displayName":"piezoButton",
            };
            actionLogger.logCancel(logObject);
        }
    });

    //Classical or Quantum
    $('input[type=radio][name=optradio]').change(function() {
        if ($('input[name=optradio]:checked').val() == 'quantum') {
            if (!filterIsActivated)
                activateFilter();
            var logObject = {
                "objectType": "radioButton",
                "displayName":"quantumButton",
             }
             actionLogger.logAccess(logObject);
            
        } else {
            if (filterIsActivated)
                deactivateFilter();
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
    for (i = 0; i < 10; i += 0.1){
        dps.push({
            x: i,
            y: undefined
        });
    }

    function createChart() {
        var chart = new CanvasJS.Chart('chartContainer', {
            title : {
                'text': "",
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
                title: $scope.time + " (s)",
                titleFontColor: "white",
                tickColor: "white",
                lineColor: "white",
                lineThickness : 2,
                labelFontColor: "white"
            },
            axisY : {
                title: $scope.voltage + " (V)",
                titleFontColor: "white",
                gridColor: "white",
                tickColor: "white",
                lineColor: "white",
                lineThickness: 2,
                gridDashType: "dash",
                labelFontColor: "white",
                gridThickness: 1,
                minimum: -10,
                maximum: 10
            },
            backgroundColor: "#6262FF"
        });
        var xVal = 0;
        var updateInterval = 100;
        var dataLength = 100; // number of dataPoints visible at any point
        var updateChart = function() {
            if (xVal < 10) {
                for (j = 0; j < 100 ; j++){
                    if (dps[j].x == xVal)
                        dps[j].y = sensorValue;
                }
            } else {
                dps.push({
                    x: xVal,
                    y: sensorValue
                });
            }
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
    }
    
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

    $scope.save = function() {
        if (currentUser!= undefined)
            example_content.userName = currentUser;
        var blob = new Blob([results], {type: 'text/plain;charset=utf-8'});
        saveAs(blob, 'Experiment results on ' + new Date());
        results = '';
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