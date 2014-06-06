var fs = require('fs');
var join = require('path').join;
var md5 = require('crypto').createHash('md5');
var msgpack = require('msgpack');
var debug = require('debug')('scorch:worker');
var rio = require("rio/lib/rio");

"use strict";


function getPlot(err, res) {
    if (!err) {
        io.emit('frame', res);
        redis.set('scorch:frame', res);
    } else {
        debug("Adding image failed");
    }
}



process.title = 'scorch-producer';

// redis
var redis = require('./redis')();
var sub = require('./redis')();
var io = require('socket.io-emitter')(redis);

// save interval
var saveInterval = process.env.SCORCH_SAVE_INTERVAL || 60000;
debug('save interval %d', saveInterval);

function load(){
  debug('loading R script');
  rio.sourceAndEval(__dirname + "/ex5.R", {
    entryPoint: "createDummyPlot",
    callback: getPlot
  });

 var hash ="$$$";

  redis.get('scorch:state:' + hash, function(err, state){
    if (err) throw err;
    if (state) {
      debug('init from state');
    } else {
      debug('init from rom');
    }
    //save();
  });

  function save(){
    debug('will save in %d', saveInterval);
    setTimeout(function(){
      var snap = emu.snapshot();
      if (snap) {
        debug('saving state');
        redis.set('scorch:state:' + hash, msgpack.pack(snap));
        save();
      }
    }, saveInterval);
  }
}

sub.subscribe('scorch:move');
sub.on('message', function(channel, move){
  if ('scorch:move' != channel) return;
  //emu.move(move.toString());
});

load();
