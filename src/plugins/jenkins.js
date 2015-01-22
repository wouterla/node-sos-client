
var request = require('request');

(function (PollResultStatus) {
    PollResultStatus[PollResultStatus["SUCCESS"] = 0] = "SUCCESS";

    PollResultStatus[PollResultStatus["FAILURE"] = 1] = "FAILURE";
})(exports.PollResultStatus || (exports.PollResultStatus = {}));

var PollResultStatus = exports.PollResultStatus;

var Jenkins = (function () {

    Jenkins.prototype.poll = function (config, callback) {
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

            // console.log(resp.body);

            var jenkinsResp = JSON.parse(resp.body);

            var overallStatus = "blue";

            jenkinsResp.jobs.forEach(function (job) {
                state = _this.toPollResultStatus(job.color);
                if (state == 1 /* FAILURE */) {
                    overallStatus = "red";
                }
            });
            return callback(null, {
                status: _this.toPollResultStatus(overallStatus),
                id: "1"
            });
        });
    };

    Jenkins.prototype.toPollResultStatus = function (state) {
        state = state.toLowerCase();
        console.error("jenkins state:", state);
        if (state.indexOf('blue') == 0 || state.indexOf('disabled') == 0 || state.indexOf('aborted') == 0) {
            return 0 /* SUCCESS */;
        }
        return 1 /* FAILURE */;
    };
    return Jenkins;
})(PluginBase.PluginBase);
exports.Jenkins = Jenkins;
