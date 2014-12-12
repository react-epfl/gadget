var app = angular.module('onlineUsersGadget', ['ngResource']);

if (location.hostname === 'localhost' && location.port === '8080') {
  var usedPort = '9091';
} else if (location.port) {
  var usedPort = location.port;
}

var origin = location.protocol + '//' + location.hostname + (usedPort ? ':' + usedPort : '');

var socket = io.connect(origin);
