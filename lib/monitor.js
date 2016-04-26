var Promise = require('bluebird'),
EventEmitter = require('events').EventEmitter,
_ = require('lodash');
var NobleDevice = require('noble-device');
var HealthTemperatureService = require('./health-temperature-service.js');
var util = require('util');
var debug = require('debug')('monitor');

var Monitor = function(peripheral){
  NobleDevice.call(this, peripheral);
  EventEmitter.call(this);
};

Monitor.SCAN_UUIDS = ['1809'];
//Monitor.SCAN_DUPLICATES = true;

NobleDevice.Util.inherits(Monitor, NobleDevice);
NobleDevice.Util.mixin(Monitor, NobleDevice.BatteryService);
NobleDevice.Util.mixin(Monitor, HealthTemperatureService);

module.exports = Monitor;
