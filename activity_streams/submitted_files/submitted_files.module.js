var app = angular.module('submittedFilesGadget', ['ngResource', 'angularMoment']);

if (location.hostname === 'localhost' && location.port === '8080') {
  var hostToConnect = 'http://localhost:9091';
} else {
  var hostToConnect = 'http://graasp.eu';
}

var socket = io.connect(hostToConnect);

