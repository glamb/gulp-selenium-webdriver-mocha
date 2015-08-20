'use strict';

var through = require('through2')
  , gutil = require('gulp-util')
  , Mocha = require('mocha')
  , merge = require('deepmerge')
  , request = require('request')
  , selenium = require('selenium-standalone')
  , Webdriver = require('selenium-webdriver')
  , async = require('async')
  , isSeleniumRunning = false
  , seleniumServer = null
  , driver = null;

var GulpSelWebMo = function(args) {

  var options = args || {}
    , sessionID = null
    , seleniumInstallOptions = options.seleniumInstallOptions || {}
    , seleniumOptions = options.seleniumOptions || {};

  GLOBAL.driver = new Webdriver.Builder()
    .withCapabilities(options)
    .build();

  var mocha = new Mocha(merge({
    reporter: 'spec',
    ui: 'bdd',
    grep: null,
    timeout: 10000
  },options));

  /**
 * helper function for asyncjs
 */
  var next = function(cb, param) {
    return function() {
      var args = Array.prototype.slice.call(arguments, 1);
      if(typeof param !== 'undefined') {
        args.unshift(param);
      } else if (arguments.length === 1) {
        args.unshift(arguments[0]);
      }
      args.unshift(null);
      cb.apply(null, args);
    };
  };

  // Check is the selenium hub is running.
  // if selenium is running set isSeleniumRunning to true
  // if selenium is not running set isSeleniumRunning to false
  var checkSeleniumServer = function(cb) {
    var host = options.host || 'http://127.0.0.1'
      , port = options.port || 4444
      , path = '/wd/hub/status';
    // create the selenium server url we are expecting it to be running
    var url = host+':'+port+path;

    request.get(url, function(err, res, body) {
      if (err) {
        gutil.log(err);
        gutil.log('Selenium server is NOT running at: ' + url);
        isSeleniumRunning = false;
        return cb(null);
      } else {
        isSeleniumRunning = true;
        gutil.log('Selenium server running at: ' + url);
        return cb(null);
      }
    });
  };

  // Install selenium using selenium-standalone
  // if selenium is running jump out of method
  // if selenium is not running install base selenium or use config
  var installSeleniumServer = function(cb) {
    if (isSeleniumRunning) {
      return cb(null);
    }

    selenium.install(seleniumInstallOptions, function(err) {
      if (err) return cb(err);

      gutil.log('Installing Selenium Server with the following options:\n' +
        JSON.stringify(seleniumInstallOptions));
      return cb(null);
    });
  };

  // Start the selenium server
  // if selenium is running skip method
  var startSeleniumServer = function(cb) {
    if (!isSeleniumRunning) {
      gutil.log('Starting Selenium server');
      selenium.start(seleniumOptions, function(err, child) {
        if (err) return cb(err);

        gutil.log('Selenium server started successfully');
        seleniumServer = child;
        isSeleniumRunning = true;
        return cb(null);
      });
    } else {
      gutil.log('Selenium server is already running');
      return cb(null);
    }
  };

  var runMocha = function(cb) {
    gutil.log('run mocha tests');
    /**
     * save session ID
     */
    GLOBAL.driver.getSession()
      .then(function(data) {
        sessionID = data.id_;
      });
    return mocha.run(next(cb));
  };

  var checkMochaResults = function(result, cb) {
    if(result !== 0) {
        this.emit('error', new gutil.PluginError('gulp-webdriver', result + ' ' + (result === 1 ? 'test' : 'tests') + ' failed.', {
            showStack: false
        }));
    }

    return cb(null, result);
  };

  var killDriver = function(cb) {
    gutil.log('killDriver');
    GLOBAL.driver.quit();
    cb(null);
  };

  // Kill the selenium server
  var killSeleniumServer = function(cb) {
    if (seleniumServer) {
      gutil.log('Shutting down Selenium Server');
      seleniumServer.kill();
      isSeleniumRunning = false
      return cb(null);
    } else {
      return cb(null);
    }
  };

  var runWebdriver = function(cb) {
    var stream = this;
    var task = [
      checkSeleniumServer.bind(stream),
      installSeleniumServer.bind(stream),
      startSeleniumServer.bind(stream),
      checkSeleniumServer.bind(stream),
      runMocha.bind(stream),
      checkMochaResults.bind(stream)
    ];

    async.waterfall(task, function(err) {
      if (err) {
        stream.emit('error', new gutil.PluginError('gulp-selenium-webdriver-mocha', err));
      }

      async.waterfall([
        killDriver.bind(stream),
        killSeleniumServer.bind(stream)
      ], cb);
    });
  };

  return through.obj(function(file, enc, cb) {
    this.push(file);
    gutil.log(file);
    mocha.addFile(file.path);
    cb();
  }, runWebdriver);
};

module.exports = GulpSelWebMo;
