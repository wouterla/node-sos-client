/// <reference path="../external-ts-definitions/request.d.ts" />
var __extends = this.__extends || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    __.prototype = b.prototype;
    d.prototype = new __();
};
var request = require('request');
var PluginBase = require('../plugin');
var Jenkins = (function (_super) {
    __extends(Jenkins, _super);
    function Jenkins() {
        _super.apply(this, arguments);
    }
    Jenkins.prototype.poll = function (config, callback) {
        var _this = this;
        var opts = {
            auth: {
                username: config.username,
                password: config.password
            },
            rejectUnauthorized: false,
            requestCert: true,
            agent: false
        };
        request.get(config.url, opts, function (err, resp) {
            if (err) {
                return callback(err);
            }
            console.log(resp.body);
            var jenkinsResp = JSON.parse(resp.body);
            var status = "blue";
            jenkinsResp.jobs.forEach(function (job) {
                state = _this.toPollResultStatus(job.color);
                if (state == 1 /* FAILURE */) {
                    status = "red";
                }
                //
                //                if (job.color == "red") {
                //                    status = "red"
                //                }
                // original:
                //                if (job.color != "blue") {
                //                    status = job.color;
                //                }
            });
            return callback(null, {
                status: _this.toPollResultStatus(status),
                id: "1"
            });
        });
    };
    Jenkins.prototype.toPollResultStatus = function (state) {
        state = state.toLowerCase();
        console.error("jenkins state:", state);
        if (state.indexOf('blue') == 0 || state.indexOf('disabled') == 0 ||
            state.indexOf('aborted') == 0 || state.indexOf('notbuilt')
        ) {
            return 0 /* SUCCESS */;
        }
        return 1 /* FAILURE */;
    };
    return Jenkins;
})(PluginBase.PluginBase);
exports.Jenkins = Jenkins;
