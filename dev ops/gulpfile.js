var gulp = require('gulp');
var winInstaller = require('electron-windows-installer');

var gulp = require('gulp');
gulp.task('default', function () { console.log('Hello Gulp!') });
 
gulp.task('create-windows-installer', function(done) {
  winInstaller({
    appDirectory: '../',
    outputDirectory: './distribution',
    iconUrl: '../app/build_resources/logo.ico',
    setupIcon:'../app/build_resources/logo.ico',
    arch: 'ia32'
  }).then(done).catch(done);
});

