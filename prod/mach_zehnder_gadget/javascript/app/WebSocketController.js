myApp.controller('WebSocketController', ['$scope', function($scope) {
    //Create flags and variables
    $scope.piezoIsActivated = 0;
    $scope.showQuantumDivFlag = 0;
    $scope.showMetadataButtonsFlag = 0;
    $scope.laserIsOn = 0;
    var sensorValue = 0,
        graphFlag = 0,
        bs1IsActivated = 0,
        bs2IsActivated = 0,
        filterIsActivated = 0,
        metadata,
        actionLoggerReady = 0,
        connected = 0,
        currentUser,
        actionLogger,
        ws,
        VWS,
        VWSIR,
        FF,
        host = '172.22.11.2', //145.232.235.206
        port = '8888',
        results = '',
        w,
        firstChange = 1,
        glowCount = 0,
        quantitative = 0,
        camera1Active = 0,
        camera2Active = 0,
        enableCamera1 = 0,
        enableCamera2 = 0,
        controller = 0,
        infCase = 0,
        w = 860,
        h = 500,
        t = 0,
        padding = 10,
        first = [{x: 48, y: 85}, {x: 146, y: 85}],
        second = [{x: 146, y: 85}, {x: 193, y: 85}],
        horizontalTop = [{x: 193, y: 85}, {x: 511, y: 85}],
        horizontalTop2 = [{x: 193, y: 85}, {x: 362, y: 85}],
        verticalLeft = [{x: 196, y: 85},{x: 196, y: 356}],
        horizontalBottom = [{x:196 , y:350},{x:600 , y:350}],
        horizontalBottom2 = [{x:196 , y:350},{x:362 , y:350}],
        verticalRight = [{x:511, y:85},{x:511, y:350}],
        tri = [{x:600 , y:350}, {x:681 , y:375}, {x:681 , y:325}],
        triQuant = [{x:600 , y:350}, {x:681 , y:350}],
        quant = [{x:681, y:350}, {x:750, y:350}],
        last = [{x:511 , y:350}, {x:600 , y:350}],
        empty = [{x:0, y:0}, {x:0, y:0}],
        line = d3.svg.line().x(x).y(y).interpolate("linear"),
        n = 1,
        stroke = d3.scale.category20b(),
        orders = d3.range(4, n+4);
    var vis = d3.select("#vis");
    var svg = vis
      .append("svg")
      .data(orders)
      .attr("width", "100%")
      .attr("height", "100%")
      .attr("id","svgSnap")
      .append("g");
    var g = svg.append("g")
      .data(function (d) { return [d]; })
      .attr("transform", "translate(" + padding + "," + padding + ")");
    var firstPath = g.append("path")
      .data(function (d) { return [d]; })
      .style("fill", "green")
      .style("stroke", "green")
      .attr("stroke-width", 5)
      .attr("opacity", 0)
      .attr("class", "straight-line")
      .attr("d", line(first));
    var secondPath = g.append("path")
      .data(function (d) { return [d]; })
      .style("fill", "green")
      .style("stroke", "green")
      .attr("stroke-width", 5)
      .attr("opacity", 0)
      .attr("class", "straight-line")
      .attr("d", line(second));
    var horizontalTopPath = g.append("path")
      .data(function (d) { return [d]; })
      .style("fill", "green")
      .style("stroke", "green")
      .attr("stroke-width", 5)
      .attr("opacity", 0)
      .attr("class", "straight-line")
      .attr("d", line(horizontalTop));
    var verticalLeftPath = g.append("path")
      .data(function (d) { return [d]; })
      .style("fill", "none")
      .style("stroke", "green")
      .attr("stroke-width", 5)
      .attr("opacity", 0)
      .attr("class", "straight-line")
      .attr("d", line(verticalLeft));
    var hortizontalBottomPath = g.append("path")
      .data(function (d) { return [d]; })
      .style("fill", "green")
      .style("stroke", "green")
      .attr("stroke-width", 5)
      .attr("opacity", 0)
      .attr("class", "straight-line-bottom")
      .attr("d", line(horizontalBottom));
    var verticalRightPath = g.append("path")
      .data(function (d) { return [d]; })
      .style("fill", "green")
      .style("stroke", "green")
      .attr("stroke-width", 5)
      .attr("opacity", 0)
      .attr("class", "straight-line")
      .attr("d", line(verticalRight));
    var triRightPath = g.append("path")
      .data(function (d) { return [d]; })
      .style("fill", "green")
      .style("stroke", "green")
      .attr("stroke-width", 5)
      .attr("opacity", 0)
      .attr("class", "straight-line")
      .attr("d", line(tri));
    var triBottomPath = g.append("path")
      .data(function (d) { return [d]; })
      .style("fill", "green")
      .style("stroke", "green")
      .attr("stroke-width", 5)
      .attr("opacity", 0)
      .attr("class", "straight-line-bottom")
      .attr("d", line(tri));
    var quantPath = g.append("path")
      .data(function (d) { return [d]; })
      .style("fill", "white")
      .style("stroke", "white")
      .attr("stroke-width", 5)
      .attr("opacity", 0.6)
      .attr("class", "straight-line-quant")
      .attr("d", line(quant));
    var lastPath = g.append("path")
      .data(function (d) { return [d]; })
      .style("fill", "green")
      .style("stroke", "green")
      .attr("stroke-width", 5)
      .attr("opacity", 0)
      .attr("class", "straight-line")
      .attr("d", line(last));

    function getScale() {
        w = parseInt(d3.select("body").style("width"));
        var h = parseInt(d3.select("body").style("height"));
        if (w<172)
            w = 172;
        $(".gadget4 #filterImage").css({"height": (54-(6*((796-w)/100))) + "px", "width": (18-(1.85*((796-w)/100))) +"px"});
        $(".gadget4 #beamShutter1Image").css({"height": (56-(6.15*((796-w)/100))) + "px", "width": (12-(1.35*((796-w)/100))) +"px"});
        $(".gadget4 #beamShutter2Image").css({"height": (56-(6.35*((796-w)/100))) + "px", "width": (12-(1.35*((796-w)/100))) +"px"});
        $(".gadget4 #camera1Image").css({"height": 7 + (30 * (w/796)) + "px", "width": 7 + (30 * (w/796)) +"px"});
        $(".gadget4 #camera2Image").css({"height": 7 + (30 * (w/796)) + "px", "width": 7 + (30 * (w/796)) +"px"});
        $(".gadget4 #arrowImage").css({"height": 15 + (40 * (w/796)) + "px"});
        $(".gadget4 #piezoVoltageDiv").css({'zoom': (w/796)});
        if (FF) 
            $('#piezoVoltageDiv').css({MozTransform: 'scale(' + (w/796) + ')'});
        var wScale = w / 900;
        var hScale = h / 500;
        var scale = (wScale < hScale) ? wScale : hScale;
        if (scale < 0.6) 
            $("path").attr("stroke-width", 3.5);
        else
            if (scale<0.4) 
                $("path").attr("stroke-width", 2.5);
            else
                $("path").attr("stroke-width", 5);
        if (scale < 0.2) 
            scale = 0.2;
        $(".straight-line-quant").attr("stroke-width", 10);
        return scale;
    }

    function resize() {
        var scale = getScale();
        var newPoints = scalePoints(first, scale);
        var newPoints2 = scalePoints(verticalLeft, scale);
        var newPoints6 = scalePoints(second, scale);
        var newPoints9 = scalePoints(quant, scale);
        if (!filterIsActivated) {
            triRightPath.attr('stroke-dasharray',"0,0");
            triBottomPath.attr('stroke-dasharray',"0,0");
        } else {
            triRightPath.attr('stroke-dasharray',"5,15");
            triBottomPath.attr('stroke-dasharray',"5,15");
        }
        if (!bs1IsActivated) {
            var newPoints1 = scalePoints(horizontalTop, scale);
            var newPoints4 = scalePoints(verticalRight, scale);
            var newPoints5 = scalePoints(last, scale);
            if (!filterIsActivated) 
                var newPoints7 = scalePoints(tri, scale);
            else
                var newPoints7 = scalePoints (triQuant, scale);
        } else {
            var newPoints1 = scalePoints(horizontalTop2, scale);
            var newPoints4 = scalePoints(empty, scale);
            var newPoints5 = scalePoints(empty, scale);
            var newPoints7 = scalePoints(empty, scale);
        }
        if (!bs2IsActivated) {
            var newPoints3 = scalePoints(horizontalBottom, scale);
            if (!filterIsActivated) 
                var newPoints8 = scalePoints(tri, scale);
            else
                var newPoints8 = scalePoints(triQuant, scale);
        }
        else {
            var newPoints3 = scalePoints(horizontalBottom2, scale);
            var newPoints8 = scalePoints(empty, scale);
        }
        if (bs1IsActivated && bs2IsActivated)
            $(".straight-line-quant").attr("opacity", 0);
        else
            if (bs1IsActivated || bs2IsActivated)
                $(".straight-line-quant").attr("opacity", 0.3);
            else
                $(".straight-line-quant").attr("opacity", 0.6);
        firstPath.attr("d", line(newPoints));
        secondPath.attr("d", line(newPoints6));
        horizontalTopPath.attr("d", line(newPoints1));
        verticalLeftPath.attr("d", line(newPoints2));
        hortizontalBottomPath.attr("d", line(newPoints3));
        verticalRightPath.attr("d", line(newPoints4));
        triRightPath.attr("d", line(newPoints7));
        triBottomPath.attr("d", line(newPoints8));
        quantPath.attr("d", line(newPoints9));
        lastPath.attr("d", line(newPoints5));
        $('#vis').css({'height': 460 * scale, 'width': 860 * scale});
        $('#diagramDiv').css({'height': 500 * scale, 'width': 860 * scale});
        $('#saveButton').css({'font-size': (scale * 16) + 'px'})
        var videoWidth = $('#video1').width();
        $('#video1, #video2, #mycanvas, #mycanvas2').css('height', videoWidth*0.667);
        if (chart) {
            chart.options.height = videoWidth*0.667;
            chart.render();
        }
    }

    function scalePoints(points, scale) {
      var newPoints = [];
      for (var i = 0; i < points.length; i++) {
        newPoints[i] = {x: points[i].x * scale, y: points[i].y * scale};
      }
      return newPoints;
    } 

    function x(d) { return d.x; }

    function y(d) { return d.y; }

    $(window).on('resize', resize);

    var initializeSocket = function() {
        ws = new WebSocket('ws://' + host + ':' + port);
        ws.onopen = function() { 
            connected = 1;
            var sensorRequest = {
                method: 'getSensorData',
                sensorId: 'INFO_S',
                accessRole: 'controller'
            }
            jsonRequest = JSON.stringify(sensorRequest);
            if (connected)
                ws.send(jsonRequest);
            var sensorRequest = {
                method: 'getSensorData',
                sensorId: 'photodiode',
                accessRole: 'controller'
            }
            jsonRequest = JSON.stringify(sensorRequest);
            if (connected) 
                ws.send(jsonRequest);
        };

        ws.onmessage = function(event) {
            var data = event.data;
            var msg;
            try {
                msg = JSON.parse(data);
                if (msg.method=="getSensorMetadata" || msg.method=="getActuatorMetadata" || msg.method=="getClients" || msg.method=="sendActuatorData") {
                    //Metadata request has been made       
                } else {       
                    if (msg.method == "getSensorData") {
                        if (msg.sensorId != "Info") {
                            if(msg.responseData) {
                                sensorValue = Math.round(Number(msg.responseData.data[0])*10000)/10000;
                            }
                        } else {
                            if (msg.responseData) {
                                var Q_Size = parseFloat(msg.responseData.Q_Size);
                                if (Q_Size == 0) {
                                    if (!camera1Active) {
                                        enableCamera1 = 0;
                                        $('#camera1Span').show();
                                    }
                                    if (!camera2Active) {
                                        enableCamera2 = 0;
                                        $('#camera2Span').show();
                                    }
                                    if ($('input[name=optradio]:checked').val() == 'quantitative') {
                                        $('#chartContainer').css({'display':'block'});
                                        $('#video1').css({'display':'none'});
                                    } else {
                                        $('#chartContainer').css({'display':'none'});
                                        $('#video1').css({'display':'block'});
                                    }
                                    if (!controller) {
                                        setTimeout (function() {
                                            configureSD($scope.laserIsOn, bs1IsActivated, bs2IsActivated, parseFloat(piezoVoltageSlider.noUiSlider.get()[0]), filterIsActivated);
                                        }, 700);
                                        controller = 1;
                                    }
                                }
                                if (Q_Size == 0 && (parseFloat(msg.responseData.Q_Est) > 130 || msg.responseData.Q_Est == "Inf")) {
                                    $('#diagramDiv').css({'opacity':'1'});
                                    $('#diagramDiv').css({'pointer-events':'auto'});
                                    $('#queueInformation').html('Connected');
                                    if (!infCase)
                                        infCase = 1;
                                }
                                var Q_Est = parseFloat(msg.responseData.Q_Est);
                                if (Q_Size == 0 && Q_Est < 120) {
                                    infCase = 0;
                                    $('#diagramDiv').css({'opacity':'1'});
                                    $('#diagramDiv').css({'pointer-events':'auto'});
                                    $('#queueInformation').html('Connected<br>My turn will end in: ' + (''+(120 - Q_Est)).split('.')[0] + ' seconds.');
                                    if (Q_Est > 118) {
                                        setTimeout(function() {
                                            sendActuatorData('power', [0]);
                                        }, 2500);
                                    }
                                }
                                if (Q_Size != 0) {
                                    $('#diagramDiv').css({'opacity':'0.8'});
                                    $('#diagramDiv').css({'pointer-events':'none'});
                                    if (infCase)
                                        $('#queueInformation').html('Waiting<br>There ' + (Q_Size==1?'is ':'are ') + Q_Size + (Q_Size==1?' person ':' people ') + 'before me.<br>Estimated waiting time: ' + ('' + ((120-(Q_Est - 120 * Q_Size)) + (Q_Size - 1) * 120)).split('.')[0] + ' seconds.<br>The last change you made will be <br>applied when it is your turn again');
                                    else
                                        $('#queueInformation').html('Waiting<br>There ' + (Q_Size==1?'is ':'are ') + Q_Size + (Q_Size==1?' person ':' people ') + 'before me.<br>Estimated waiting time: ' + ('' + ((120-(Q_Est - 120 * Q_Size)) + (Q_Size - 1) * 120)).split('.')[0] + ' seconds.');
                                    $('#chartContainer').css({'display':'none'});
                                    $('#video1').css({'display':'block'});
                                    enableCamera1 = 1;
                                    enableCamera2 = 1;
                                    $('#camera1Span, #camera2Span').hide();
                                    controller = 0;
                                }
                            }
                        }
                    } 
                }
            } catch (e) {
                console.log(e);
            }
        };

        ws.onclose = function(event) {
        }
    }

    var initializeVideoSocket = function() {
        Vws = new WebSocket('ws://172.22.11.2:8888/WS_Video');
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
                var destinationCanvas = document.getElementById('mycanvas2');
                destinationCanvas.height="210";
                destinationCanvas.width="280";
                var destinationContext = destinationCanvas.getContext('2d');
                var URL = window.URL || window.webkitURL;
                if (enableCamera2)
                    if (FF) {
                        myimage.src = URL.createObjectURL(event.data);
                        destinationContext.drawImage(myimage, 0, 0);
                    }
                    else { 
                        destinationContext.drawImage(myimage, 0, 0);
                        myimage.src = URL.createObjectURL(event.data);
                    }
            }
        }

        function Vwsclose(event) {
        }
    };

    var initializeVideoIRSocket = function() {
        VWSIR = new WebSocket('ws://172.22.11.2:8888/WS_Video');
        VWSIRopen.VWSIR = VWSIR;
        VWSIR.onopen = VWSIRopen;
        VWSIR.onmessage = VWSIRmessage;
        VWSIR.onclose = VWSIRclose;
        var SVGDoc=null; 
        var myimage =new Image();

        function VWSIRopen(event) {
            var sensorRequest = {
                method: 'getSensorData',
                sensorId: 'VideoIR',
                accessRole: 'controller'
            }
            var jsonRequest = JSON.stringify(sensorRequest);
            VWSIR.send(jsonRequest);
        }

        function VWSIRmessage(event) {
            if (event.data instanceof Blob) {
                var destinationCanvas = document.getElementById('mycanvas');
                destinationCanvas.height="210";
                destinationCanvas.width="280";
                var destinationContext = destinationCanvas.getContext('2d');
                var URL = window.URL || window.webkitURL;
                if (enableCamera1)
                    if (FF) {
                        myimage.src = URL.createObjectURL(event.data);
                        destinationContext.drawImage(myimage, 0, 0);
                    }
                    else { 
                        destinationContext.drawImage(myimage, 0, 0);
                        myimage.src = URL.createObjectURL(event.data);
                    }
            }
        }

        function VWSIRclose(event) {
        }
    };

    ils.getAppContextParameters(function(data) {
        if (data.error) return console.error(data.error);
        metadata = data;
        currentUser = metadata.actor.displayName;
        //Initialize action logger
        new window.golab.ils.metadata.GoLabMetadataHandler(metadata, function(err,metadataHandler) {
            actionLogger = new window.ut.commons.actionlogging.ActionLogger(metadataHandler);
            actionLogger.setLoggingTarget("opensocial");
            actionLoggerReady =1 ;
        });
    });

    var configureSD = function(laser, bs1, bs2, piezo, filter) {
        sendActuatorData('power', [laser]);
        sendActuatorData('bs1', [bs1]);
        sendActuatorData('bs2', [bs2]);
        sendActuatorData('piezo', [piezo]);
        sendActuatorData('filter', [filter]);
    }

    var sendActuatorData = function (actuator, actuatorValue) {
        var actuatorRequest = {
            authToken: 'skfjs343kjKJ',
            method: 'sendActuatorData',
            accessRole: 'controller',
            actuatorId: actuator,
            valueNames: '',
            data: actuatorValue
        };
        var jsonRequest = JSON.stringify(actuatorRequest);
        if (connected)
            ws.send(jsonRequest);
    }

    var example_content = { 
        "dataPoints": [
          {
            "t": 0,
            "V": 0,
          }
       ],
       "experimentTime": moment()
    };

    $scope.laserClick = function() {
        if ($scope.laserIsOn) 
            $scope.turnLaserOff();
        else
            $scope.turnLaserOn();
    }

    $scope.turnLaserOn = function() {
        $scope.laserIsOn = 1;
        $('#laser').addClass('active');
        firstPath.attr('opacity',0.3);
        secondPath.attr('opacity',0.3);
        horizontalTopPath.attr('opacity',0.3);
        verticalLeftPath.attr('opacity',0.3);
        hortizontalBottomPath.attr('opacity',0.3);
        verticalRightPath.attr('opacity',0.3);
        triRightPath.attr('opacity',0.3);
        triBottomPath.attr('opacity',0.3);
        lastPath.attr('opacity',0.3);
        if (quantitative)
            quantPath.style("fill", "green").style("stroke", "green");
        sendActuatorData('power', [1]);
        graphFlag = 1;
        //Log Activity
         var logObject = {
            "objectType": "button",
            "displayName":"laserButton",
         }
         if (actionLoggerReady)
            actionLogger.logStart(logObject);
    }

    $scope.turnLaserOff = function() {
        $scope.laserIsOn = 0; 
        $('#laser').removeClass('active');
        firstPath.attr('opacity',0);
        secondPath.attr('opacity',0);
        horizontalTopPath.attr('opacity',0);
        verticalLeftPath.attr('opacity',0);
        hortizontalBottomPath.attr('opacity',0);
        verticalRightPath.attr('opacity',0);
        triRightPath.attr('opacity',0);
        triBottomPath.attr('opacity',0);
        quantPath.style("fill", "white").style("stroke", "white");
        lastPath.attr('opacity',0);
        sendActuatorData('power', [0]);
        graphFlag = 0;
        //Log Activity
        var logObject = {
            "objectType": "button",
            "displayName":"laserButton",
        };
        if (actionLoggerReady)
            actionLogger.logCancel(logObject);
    }

    $scope.bs1Clicked = function() {
        if (bs1IsActivated) {
            bs1IsActivated = 0;
            $("#beamShutter1Image").animate({'margin-top' : '0%'});
            $("#beamShutter1Image").glow({ disable:true });
            setTimeout (function() {
                resize();
            }, 300);
            sendActuatorData('bs1', [0]);
            //Log Activity
            var logObject = {
                "objectType": "image",
                "displayName":"bs1Image",
            };
            if (actionLoggerReady)
                actionLogger.logCancel(logObject);
        } else {
            bs1IsActivated = 1;
            $("#beamShutter1Image").animate({'margin-top' : '2.5%'});
            $("#beamShutter1Image").glow({ radius: "3", color:"green"});
            setTimeout (function() {
                resize();
            }, 300);
            sendActuatorData('bs1', [1]);
            //Log Activity
            var logObject = {
                "objectType": "image",
                "displayName":"bs1Image",
            }
            if (actionLoggerReady)
                actionLogger.logStart(logObject);
        }
    }

    $scope.bs2Clicked = function() {
        if (bs2IsActivated) {
            bs2IsActivated = 0;
            $("#beamShutter2Image").animate({'margin-top' : '0%'});
            $("#beamShutter2Image").glow({ disable:true }); 
            setTimeout (function() {
                resize();
            }, 300);
            sendActuatorData('bs2', [0]);
            //Log Activity
            var logObject = {
                "objectType": "image",
                "displayName":"bs2Image",
            };
            if (actionLoggerReady)
                actionLogger.logCancel(logObject);
        } else {
            bs2IsActivated = 1;
            $("#beamShutter2Image").animate({'margin-top' : '-2.5%'});
            $("#beamShutter2Image").glow({ radius: "3", color:"green"});
            setTimeout (function() {
                resize();
            }, 300);
            sendActuatorData('bs2', [1]);
            //Log Activity
            var logObject = {
                "objectType": "image",
                "displayName":"bs2Image",
            };
            if (actionLoggerReady)
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
            if (actionLoggerReady)
                actionLogger.logCancel(logObject);
        } else {
            activateFilter();
            //Log Activity
            var logObject = {
                "objectType": "image",
                "displayName":"filterImage",
            };
            if (actionLoggerReady)
                actionLogger.logStart(logObject);
        }
        setTimeout (function() {
            resize();
        }, 300);
    }

    function activateFilter() {
        filterIsActivated = 1;
        $("#filterImage").animate({'margin-top' : '2.2%'});
        $("#filterImage").glow({ radius: "2", color:"green"});
        setTimeout (function() {
            secondPath.attr('stroke-dasharray',"10,10");
            horizontalTopPath.attr('stroke-dasharray',"5,15");
            verticalLeftPath.attr('stroke-dasharray',"5,15");
            hortizontalBottomPath.attr('stroke-dasharray',"5,15");
            verticalRightPath.attr('stroke-dasharray',"5,15");
            quantPath.attr('stroke-dasharray',"5,15");
            lastPath.attr('stroke-dasharray',"5,15");
        }, 300);
        sendActuatorData('filter', [1]);
    }

    function deactivateFilter() {
        filterIsActivated = 0;
        $("#filterImage").animate({'margin-top' : '0%'});
        $("#filterImage").glow({ disable:true });
        setTimeout (function() {
            secondPath.attr('stroke-dasharray',"0,0");
            horizontalTopPath.attr('stroke-dasharray',"0,0");
            verticalLeftPath.attr('stroke-dasharray',"0,0");
            hortizontalBottomPath.attr('stroke-dasharray',"0,0");
            verticalRightPath.attr('stroke-dasharray',"0,0");
            quantPath.attr('stroke-dasharray',"0,0");
            lastPath.attr('stroke-dasharray',"0,0");
        }, 300);
        sendActuatorData('filter', [0]);
    }

    var piezoVoltageSlider = document.getElementById('piezoVoltageSlider');
    noUiSlider.create(piezoVoltageSlider, {
        start: 0,
        connect: [true, false],
        step: 0.1,
        tooltips: true,
        range: {
          'min': 0,
          'max': 3
        },
        format: {
          to: function ( value ) {
            return (value!="0"?parseFloat(Math.round(value * 100) / 100).toFixed(1):0) + 'V';
          },
          from: function ( value ) {
            return value.replace('V', '');
          }
        }
    });

    piezoVoltageSlider.noUiSlider.on('update', function(value){
        var slideValue = parseFloat(value[0].replace('V', ''));
        var translateValue = (w / 796) * (slideValue * 8) / 3;
        $(".gadget4 #miroirNoir2").velocity({translateY: (-1) * (translateValue / 2) + "px", translateX: + (translateValue / 2) + "px"}, {duration: 1})
        $(".straight-line-bottom").velocity({translateY: (-1) * (translateValue) + "px"}, {duration: 1});
        var logObject = {
            "objectType": "slider",
            "displayName":"piezoVoltageSlider",
            "content": slideValue
        }
        if(actionLoggerReady) 
            actionLogger.logChange(logObject);
        sendActuatorData('piezo', [slideValue]);
    });

    $scope.camera1Clicked = function() {
        if (!camera1Active) {
            enableCamera1 = 1;
            camera1Active = 1;
            $('#camera1Span').hide();
            $("#camera1Image").glow({radius: "3", color: "green"});
        } else {
            enableCamera1 = 0;
            camera1Active = 0;
            $('#camera1Span').show();
            $("#camera1Image").glow({disable: true});
        }
    }

    $scope.camera2Clicked = function() {
        if (!camera2Active) {
            enableCamera2 = 1;
            camera2Active = 1;
            $('#camera2Span').hide();
            $("#camera2Image").glow({radius: "3", color: "green"});
        } else {
            enableCamera2 = 0;
            camera2Active = 0;
            $('#camera2Span').show();
            $("#camera2Image").glow({disable: true});
        }
    }

    $('input[type=radio][name=optradio]').change(function() {
        if ($('input[name=optradio]:checked').val() == 'quantitative') {
            quantitative = 1;
            if ($scope.laserIsOn)
                quantPath.style("fill", "green").style("stroke", "green");
            $('#chartContainer').css({'display':'block'});
            $('#video1').css({'display':'none'});
            $('.gadget4 #photodiode').css({'display':'block'});
            if (firstChange) {
                $('.gadget4 #arrowImage').show();
                firstChange = 0;
                var countBlinks = 0;
                var arrowInterval = setInterval(function() {
                    if (countBlinks > 3) {
                        setTimeout(function() {
                            $('.gadget4 #arrowImage').hide();
                        }, 1000);
                        clearInterval(arrowInterval);
                    }
                    $('.gadget4 #arrowImage').hide();
                    setTimeout(function() {
                        if (quantitative && countBlinks < 4)
                            $('.gadget4 #arrowImage').show();
                        countBlinks++;
                    }, 500);
                }, 2000);
            }
            chart.render();
            var logObject = {
                "objectType": "radioButton",
                "displayName":"quantitativeButton",
             }
             if (actionLoggerReady)
                actionLogger.logAccess(logObject);
        } else {
            quantitative = 0;
            $('.gadget4 #arrowImage').hide();
            quantPath.style("fill", "white").style("stroke", "white");
            $('#chartContainer').css({'display':'none'});
            $('#video1').css({'display':'block'});
            $('.gadget4 #photodiode').css({'display':'none'});
            var logObject = {
                "objectType": "radioButton",
                "displayName":"qualitativeButton",
            }
            if (actionLoggerReady)
                actionLogger.logAccess(logObject);   
        }
        $scope.$apply();
    });

    var dps = []; // dataPoints
    var chart;
    for (i = 0; i < 10; i += 0.1) {
        dps.push({
            x: i,
            y: undefined
        });
    }
    
    function createChart() {
        chart = new CanvasJS.Chart('chartContainer', {
            title : {
                'text': "",
                fontColor: "white",
                titleFont: "arial"
            },
            height: '254.13px',
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
        var xVal = 0,
            updateInterval = 100,
            dataLength = 100; // number of dataPoints visible at any point

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
        updateChart();
        setInterval(function() {
            if (graphFlag && quantitative)
                updateChart();
        }, updateInterval);
        $('#chartContainer').append('<button id="saveButton" class="btn-warning" ng-click="save()">' + $scope.saveText + '</button>');
    }
    
    $scope.pause = function() {
        graphFlag = (graphFlag==1?0:1);
        //Log Action
        if (graphFlag==1) {
            var logObject = {
                "objectType": "button",
                "displayName":"graphActivityButton"
            }
            if (actionLoggerReady)
                actionLogger.logStart(logObject);
        } else {
            var logObject = {
                "objectType": "button",
                "displayName":"graphActivityButton"
            }
            if (actionLoggerReady)
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
        if (actionLoggerReady)
            actionLogger.logSend(logObject);
        if (metadata) {
            ils.createResource('test', example_content, metadata,function(resource) {
                if (resource.error) return console.error(resource.error);
            });
        }
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

    window.onbeforeunload = function() {
        if (controller) 
            configureSD(0, 0, 0, 0, 0);
    }

    $(document).ready(function() {
        gadgets.window.adjustHeight();
        resize();
        createChart();
        FF=(navigator.userAgent.search("Firefox") >= 0);
        initializeSocket();
        initializeVideoSocket();
        initializeVideoIRSocket();
    });
}]);