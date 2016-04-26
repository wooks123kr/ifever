var debug = require('debug')('HTS');
var util = require('util');
var HEALTH_TEMPERATURE_MEASUREMENT_SERVICE = '1809';
var MEASUREMENT_UUID = '2a1c';

function HealthTemperatureService(){
}

HealthTemperatureService.prototype.notifyMeasurement = function(callback){
  debug('notifyMeasurement');
  this.onMeasurementChangeBinded = this.onMeasurementChange.bind(this);
  this.notifyCharacteristic(HEALTH_TEMPERATURE_MEASUREMENT_SERVICE, MEASUREMENT_UUID, true, this.onMeasurementChangeBinded, callback );
};

HealthTemperatureService.prototype.unnotifyMeasurement = function(callback){
  this.notifyCharacteristic(HEALTH_TEMPERATURE_MEASUREMENT_SERVICE, MEASUREMENT_UUID, false, this.onMeasurementChangeBinded, callback);
};

HealthTemperatureService.prototype.onMeasurementChange = function(data){
  debug('onMeasurementChange');
  this.convertMeasurement(data, function(temperature){
    this.emit('measurementChange', temperature);
  }.bind(this));
};

HealthTemperatureService.prototype.convertMeasurement = function(data, callback){
  debug('convertMeasurement: ' + util.inspect(data));
  var length = data.readUInt8(0);
  var mantissa = data.readUInt16LE(1);
  var exponent = data.readUInt8(4);
  if ((exponent & 0x80) > 0 ){
    exponent = exponent - 0x100;
  }
  //callback(data.readFloatLE(1)); // NOT work
  callback(mantissa * Math.pow(10, exponent));
};

module.exports = HealthTemperatureService;
