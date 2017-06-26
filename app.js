/**
 * app.js
 *
 * Use `app.js` to run your app without `sails lift`.
 * To start the server, run: `node app.js`.
 *
 * This is handy in situations where the sails CLI is not relevant or useful.
 *
 * For example:
 *   => `node app.js`
 *   => `forever start app.js`
 *   => `node debug app.js`
 *   => `modulus deploy`
 *   => `heroku scale`
 *
 *
 * The same command-line arguments are supported, e.g.:
 * `node app.js --silent --port=80 --prod`
 */

// Ensure we're in the project directory, so relative paths work as expected
// no matter where we actually lift from.

process.chdir(__dirname);
var mongoose;
mongoose = require('mongoose');

global.database = "htbt";
mongoose.Promise = global.Promise;
console.log(process.env.name);
if (process.env.name == "HTBT Development - 8090") {
    console.log("Testing is Connected");
    global["env"] = require("./config/env/testing.js");
    mongoose.connect('mongodb://localhost:27017/' + "htbtDevelopment", function (err, data) {
        if (err) {
            console.log(err);
        } else {
            console.log("Database Connected to Testing HTBT");
        }
    });
} else if (process.env.name == "HTBT - 8080") {
    global["env"] = require("./config/env/production.js");
    mongoose.connect('mongodb://localhost:27017/' + database, function (err, data) {
        if (err) {
            console.log(err);
        } else {
            console.log("Database Connected to HTBT");
        }
    });
} else {
    global["env"] = require("./config/env/development.js");
    mongoose.connect('mongodb://localhost:27017/' + database, function (err, data) {
        if (err) {
            console.log(err);
        } else {
            console.log("Database Connected to HTBT Development");
        }
    });
}


// Ensure a "sails" can be located:
(function () {
    var sails;
    try {
        sails = require('sails');
    } catch (e) {
        console.error('To run an app using `node app.js`, you usually need to have a version of `sails` installed in the same directory as your app.');
        console.error('To do that, run `npm install sails`');
        console.error('');
        console.error('Alternatively, if you have sails installed globally (i.e. you did `npm install -g sails`), you can use `sails lift`.');
        console.error('When you run `sails lift`, your app will still use a local `./node_modules/sails` dependency if it exists,');
        console.error('but if it doesn\'t, the app will run with the global sails instead!');
        return;
    }

    // Try to get `rc` dependency
    var rc;
    try {
        rc = require('rc');
    } catch (e0) {
        try {
            rc = require('sails/node_modules/rc');
        } catch (e1) {
            console.error('Could not find dependency: `rc`.');
            console.error('Your `.sailsrc` file(s) will be ignored.');
            console.error('To resolve this, run:');
            console.error('npm install rc --save');
            rc = function () {
                return {};
            };
        }
    }

    // Start server
    sails.lift(rc('sails'));
})();