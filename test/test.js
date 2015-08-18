var assert = require('assert');
var selenium = require('../');
var test = require('selenium-webdriver/testing');

test.describe('gulp-selenium-mocha test', function() {
  test.it('should have a driver object', function() {
    assert.ok(driver);
  });

  test.it('should execute a google search with driver object', function(done) {
    driver.get('http://www.google.com/ncr');
    driver.findElement(By.name('q')).sendKeys('webdriver');
    driver.findElement(By.name('btnG')).click();
    driver.wait(until.titleIs('webdriver - Google Search'), 1000)
      .then(function(bool) {
        assert.strictEqual(bool, true);
      });
    driver.quit();
    done();
  });
});
