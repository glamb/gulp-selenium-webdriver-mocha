'user strict';
var gulp = require('gulp')
  , webdriver = require('./index');

gulp.task('test', function() {
  return gulp.src('test/*.js', {
    read: false
  }).pipe(webdriver({
    browserName: 'Chrome',
    usingServer: 'localhost'
  }));
});
