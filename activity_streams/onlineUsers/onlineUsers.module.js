var app = angular.module('onlineUsersGadget', ['ngResource']);

if (location.hostname === 'localhost' && location.port === '8080') {
  var hostToConnect = 'http://localhost:9091';
} else {
  var hostToConnect = 'https://graasp.eu';
}

var socket = io.connect(hostToConnect);
