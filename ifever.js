var readline = require('readline');
var debug = require('debug')('iFever');
var util = require('util');
var Monitor = require('./lib/monitor');
var rl = readline.createInterface({
  input : process.stdin,
  output : process.stdout
  });

var bands = [
  {address : 'fe65c3487edf'},
  {address:  'fdefegegfgef'}
];


var decodeTemperature = function(data){
  debug('data.length '+ data.length);
  var i = 0;
  var length = data.readUInt8(i++);
  debug('length '+ length);
  var temperature = data.readFloatLE(i);
  i += 4;
  return temperature;
};

var printArrayIncludeIndex = function(array){
  var fmtString = '';
  array.forEach(function(ele, idx){
    fmtString += util.format('%d : %s \n', idx + 1,  ele.address);
  });
  return fmtString;
};

var str = printArrayIncludeIndex(bands);
rl.setPrompt('Select site from the list\n' + str);
rl.prompt();
rl.on('line', function(line) {
  line = line.trim();
  var num = Number(line);
  if (isNaN(num)){
    debug('type is correct, Enter number');
    rl.prompt();
    return;
  }
  if (num <= 0 || num > bands.length){
    debug('Invalid Number Enter number');
    rl.prompt();
    return;
  }
  debug('Thanks for select site: ' + bands[num - 1].address);
  startMonitoring(bands[num - 1].address);
  rl.close();
  // save the result 다시 입력을 받지 않기 위해서 
});

var startMonitoring = function(id){
  Monitor.discoverById(id, function(device){
    debug('discovered: ' + device);
    device.on('disconnect', function(){
      debug('disconnected');
      this.emit('disconnected');
    });

    device.on('measurementChange', function(data){
      console.log('temperature: ' + data);
    });
    
    device.connectAndSetUp(function(){
      debug('connectAndSetUp');
      device.readBatteryLevel(function(err, level){
        if (err){
          debug('ERROR ' + err );
          return;
        }
        debug('level : ' + level);
      });
      /*
      device._peripheral.readHandle('0x15', function(err, level){
        if (err){
          debug('ERROR ' );
          return;
        }
        debug('level: ' + level);
      });
      */
    
      device.notifyMeasurement(function(){
        console.log('notifyMeasurement: ');
      });
    });
  });
};

rl.on('close', function(){
  debug('close');
});


