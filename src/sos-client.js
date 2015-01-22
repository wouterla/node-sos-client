var fs = require('fs');
var async = require('async');
var sos = require('sos-device');
var Jenkins = require("./plugins/jenkins");
var Player = require('player');

var useMockDevice = false;

function run(callback) {
    async.auto({
        config: readConfig,
        sosDevice: connectToDevice,
        sosDeviceInfo: ['sosDevice', getSosDeviceInfo],
        poll: ['config', 'sosDeviceInfo', poll]
    }, callback);
}

function poll(callback, startupData) {
    var nameId = 0;
    startupData.config.builds.forEach(function (build) {
        build.interval = build.interval || 30000;
        build.name = build.name || (build.type + (nameId++));
        build.lastPollResult = build.lastPollResult || {
            status: PluginBase.PollResultStatus.SUCCESS,
            id: 0
        };
        build.plugin = new Jenkins.Jenkins();

        // Reset Siren
        updateSiren(startupData.sosDevice, startupData.sosDeviceInfo, { status: PluginBase.PollResultStatus.SUCCESS });

        process.nextTick(pollBuild.bind(null, build, startupData));
    });
    return callback();
}

function pollBuild(build, startupData) {
    build.plugin.poll(build.config, function (err, pollResult) {
        if (err) {
            console.error('Failed to poll: ' + build.name, err);
        }
        if (pollResult) {
            if (pollResult.status != build.lastPollResult.status || pollResult.id != build.lastPollResult.id) {
                build.lastPollResult = pollResult;
                //console.log('New poll results:', pollResult, build.lastPollResult);
                updateSiren(startupData.sosDevice, startupData.sosDeviceInfo, build.lastPollResult);
            }
        }
        setTimeout(pollBuild.bind(null, build, startupData), build.interval);
    });
}

function playSound(filename) {
    var player = new Player(filename);
    player.play();
}

function switchSiren(audioMode, audioDuration, ledMode, ledDuration) {
    var controlPacket = {
        audioMode: audioMode,
        audioPlayDuration: audioDuration,
        ledMode: sosDeviceInfo.ledPatterns[ledMode].id,
        ledPlayDuration: ledDuration
    };
    sosDevice.sendControlPacket(controlPacket, function (err) {
        if (err) {
            console.error("Could not send SoS control packet", err);
        }
    });
}

function updateSiren(sosDevice, sosDeviceInfo, pollResult) {
    console.log("Updating Sirent, Status: " + pollResult.status);
    if (pollResult.status == Jenkins.PollResultStatus.FAILURE) {
        switchSiren(0, 0, 2, 250000);
        playSound('/home/dash/sounds/failed.mp3');
    } else if (pollResult.status == Jenkins.PollResultStatus.SUCCESS) {
        switchSiren(0, 0, 0, 500);
        playSound('/home/dash/sounds/fixed.mp3');
    }
}

function readConfig(callback) {
    fs.readFile('./config.json', 'utf8', function (err, data) {
        if (err) {
            return callback(err);
        }
        var config = JSON.parse(data);
        return callback(null, config);
    });
}

function connectToDevice(callback) {
    return sos.connect(function (err, sosDevice) {
        if (err) {
            return callback(err);
        }
        return callback(null, sosDevice);
    });
}

function getSosDeviceInfo(callback, startupData) {
    return startupData.sosDevice.readAllInfo(function (err, deviceInfo) {
        if (err) {
            return callback(err);
        }
        console.log("deviceInfo:", deviceInfo);
        return callback(null, deviceInfo);
    });
}

run(function (err) {
    if (err) {
        console.error(err);
        return process.exit(-1);
    }
    console.log("startup successful");
});

