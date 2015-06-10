'use strict';

app.controller('WebsocketClient',
function ($scope, Spaces) {

    $scope.infoMsg = true;
    $scope.errorMsg = false;
    $scope.labStatus = false;
    $scope.voltageReadingStatus = false;
    $scope.windSourceStatus = false;
    $scope.activateGraph = false;

    var cyclicPlotBuffer = [];
    var elements = 0;
    var currentPointer = -1;

    // Establish WebSocket connection with BBB.
    $scope.connectToLab = function(host) {
        var port = '8081';
        var ws = new WebSocket('ws://' + host + ':' + port);
        // if(ws.readyState == 0 || ws.readyState == 1) {
        //     ws.close();
        // }
        // ws = new WebSocket('ws://' + host.ip + ':' + port);

        ws.onerror = function(event) {
          $scope.labStatus = false;
          $scope.infoMsg = true;
          $scope.errorMsg = false;
        }

        // Receive incoming messages from the WS connection with Lab and display.
        ws.onmessage = function (event) {
            $scope.$apply(function () {
                var msg = JSON.parse(event.data);
                if(msg.messageType == "voltageReading") {
                    // $scope.message = "Voltage data accurate as of: "+msg.dateValid;
                    $scope.voltageAmplitudeValue = msg.payload.amplitude;
                    $scope.voltageFrequency = msg.payload.frequency;
                    $scope.numSamples = msg.payload.numOfValues;
                    var jqp = $.jqplot('chartdiv', [msg.payload.valuesArray], {});
                    jqp.destroy();
                    $.jqplot('chartdiv', [msg.payload.valuesArray], {
                        redraw: true,
                        title: 'Voltage waveform as at: '+msg.dateValid,
                        axes: { yaxis:{min:0, max:1.8}, 
                                xaxis:{ min: 0, 
                                        max: msg.payload.numOfValues, 
                                        show: false, 
                                        showTicks: false, 
                                        showTickMarks: false}},
                        series:[{color:'#5FAB78', showMarker: false}]
                    });

                    osapi.context.get().execute(function(context){
                        var dataString = msg.payload.valuesArray.toString();
                        var params = {
                            "document": {
                                "parentType": context.contextType,
                                "parentSpaceId": context.contextId,
                                "mimeType": "txt",
                                "fileName": "voltageReading-"+msg.dateValid,
                                "content": dataString,
                                "metadata": "metadata"
                                }
                        };
                        osapi.documents.create(params).execute(function(response){
                            ;
                        });
                    });

                    $scope.activateGraph = true;
                    if(elements != 20) {
                        cyclicPlotBuffer.push({
                            payloadData: msg.payload,
                            dataDate: msg.dateValid
                        });
                        elements++;
                        currentPointer = (++currentPointer) % elements;
                    } else {
                        cyclicPlotBuffer.shift();
                        cyclicPlotBuffer.push(msg.payload);
                    }
                }
                else if(msg.messageType == "genericMessage") {
                    if(msg.payload == "Lab connected!")
                        $scope.labStatus = true;
                    $scope.infoMsg = true;
                    $scope.errorMsg = false;
                }
                else if(msg.messageType == "errorMessage") {
                    $scope.errMessage = msg.payload;
                    $scope.infoMsg = false;
                    $scope.errorMsg = true;
                }
                else if(msg.messageType == "commandResponse") {
                    if(msg.payload == "voltageReadingInProgress") {
                        $scope.voltageReadingStatus = true;
                    } else if(msg.payload == "voltageReadingNotInProgress") {
                        $scope.voltageReadingStatus = false;
                    } else if(msg.payload == "windSourceOn") {
                        $scope.windSourceStatus = true;
                    } else if(msg.payload == "windSourceOff") {
                        $scope.windSourceStatus = false;
                    }
                    $scope.infoMsg = true;
                    $scope.errorMsg = false;
                }
                else {
                    $scope.errMessage = "Unknown message received: "+event.data;
                    $scope.infoMsg = false;
                    $scope.errorMsg = true;
                }
            })
        };

        // Run button click.
        $scope.runReading = function () {
            ws.send("startReadingVoltage");
        };

        // Stop button click.
        $scope.stopReading = function () {
            ws.send("stopReadingVoltage");

        }

        //Turn On button click for wind source
        $scope.turnOnWind = function () {
            ws.send("turnOnWind");
        }

        //Turn Off button click for wind source
        $scope.turnOffWind = function () {
            ws.send("turnOffWind");
        }
    }

    $scope.graphScrollLeft = function () {
        if(currentPointer == 0) {
            currentPointer = elements-1;
        } else {
            currentPointer--;
        }

        $scope.voltageAmplitudeValue = cyclicPlotBuffer[currentPointer].payloadData.amplitude;
        $scope.voltageFrequency = cyclicPlotBuffer[currentPointer].payloadData.frequency;
        $scope.numSamples = cyclicPlotBuffer[currentPointer].payloadData.numOfValues;
        var jqp = $.jqplot('chartdiv', [cyclicPlotBuffer[currentPointer].payloadData.valuesArray], {});
        jqp.destroy();
        $.jqplot('chartdiv', [cyclicPlotBuffer[currentPointer].payloadData.valuesArray], {
            redraw: true,
            title: 'Voltage waveform as at: '+cyclicPlotBuffer[currentPointer].dataDate,
            axes: { yaxis:{min:0, max:1.8}, 
                    xaxis:{ min: 0, 
                            max: cyclicPlotBuffer[currentPointer].payloadData.numOfValues, 
                            show: false, 
                            showTicks: false, 
                            showTickMarks: false}},
            series:[{color:'#5FAB78', showMarker: false}]
        });
    }

    $scope.graphScrollRight = function () {
        currentPointer = (++currentPointer) % elements;

        $scope.voltageAmplitudeValue = cyclicPlotBuffer[currentPointer].payloadData.amplitude;
        $scope.voltageFrequency = cyclicPlotBuffer[currentPointer].payloadData.frequency;
        $scope.numSamples = cyclicPlotBuffer[currentPointer].payloadData.numOfValues;
        var jqp = $.jqplot('chartdiv', [cyclicPlotBuffer[currentPointer].payloadData.valuesArray], {});
        jqp.destroy();
        $.jqplot('chartdiv', [cyclicPlotBuffer[currentPointer].payloadData.valuesArray], {
            redraw: true,
            title: 'Voltage waveform as at: '+cyclicPlotBuffer[currentPointer].dataDate,
            axes: { yaxis:{min:0, max:1.8}, 
                    xaxis:{ min: 0, 
                            max: cyclicPlotBuffer[currentPointer].payloadData.numOfValues, 
                            show: false, 
                            showTicks: false, 
                            showTickMarks: false}},
            series:[{color:'#5FAB78', showMarker: false}]
        });
    }


});

