var ngComponentScriptBuilder = require('ng-component-script-builder');
var cwd = require('path').resolve(__dirname, 'src');

var filepath = ngComponentScriptBuilder.write({
  cwd: cwd,
  stripPrefix: cwd + '/'
});

module.exports = [filepath];
