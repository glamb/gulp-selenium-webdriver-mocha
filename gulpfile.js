'user strict';
var gulp = require('gulp')
  , webdriver = require('./index');

gulp.task('test:local', function() {
  return gulp.src('test/*.js', {
    read: false
  }).pipe(webdriver({
    browserName: 'chrome',
    usingServer: 'localhost',
    seleniumInstallOptions: {
      version: '2.46.0',
      baseURL: 'http://selenium-release.storage.googleapis.com',
      drivers: {
        chrome: {
          version: '2.16',
          baseURL: 'http://chromedriver.storage.googleapis.com'
        }
      }
    },
    reporter: 'dot'
  }));
});
