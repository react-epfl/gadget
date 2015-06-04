'use strict';

function WebSocketController($scope) {

    //$scope.servoValue = 1500;

    // BBB static IP on the Internet
    //var host = '10.10.3.43';
    
    //localhost
    //var host = '127.0.0.1';

    //BBB static IP on the EPFL network
    //var host = '169.254.95.88';

    //BBB static IP on the local network created with the connected machine
    var host = '192.168.7.2';
    
    var port = '8081';

    // Establish WebSocket connection with BBB.
    var ws= new WebSocket('ws://' + host + ':' + port);


    // Receive incoming messages from the WS connection with Lab and display.
    ws.onmessage = function (event) {
        $scope.$apply(function () {
        	var msg = JSON.parse(event.data);
            if(msg.messageType == "voltageReading") {
                $scope.message = "Voltage data accurate as of: "+msg.dateValid;
                $scope.voltageAmplitudeValue = msg.payload.amplitude;
                $.jqplot('chartdiv', [msg.payload.valuesArray], {
                    title: 'Generated Voltage Waveform',
                    axes: { yaxis:{min:0, max:1.8}, 
                            xaxis:{ min: 0, 
                                    max: msg.payload.numOfValues, 
                                    show: false, 
                                    showTicks: false, 
                                    showTickMarks: false}},
                    series:[{color:'#5FAB78', showMarker: false}]
                });
            }
            else if(msg.messageType == "genericMessage") {
                $scope.message = msg.payload;
            }
            else {
                $scope.message = "Unknown message received: "+event.data;
            }
        })
    };
   
    var voltageReadInt, windReadInt;
    
    // Run button click.
    $scope.runReading = function () {
        ws.send("startReadingVoltage");
    };

    // Stop button click.
    $scope.stopReading = function () {
        ws.send("stopReadingVoltage")
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