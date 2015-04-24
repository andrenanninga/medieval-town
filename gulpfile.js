'use strict';

var gulp        = require('gulp');
var connect     = require('gulp-connect');
var plumber     = require('gulp-plumber');
var browserify  = require('gulp-browserify');
var runSequence = require('run-sequence');
var ghPages     = require('gulp-gh-pages');

gulp.task('webserver', function() {
  connect.server({
    root: 'build',
    livereload: true
  });
});

gulp.task('scripts', function() {
  return gulp.src('./src/js/app.js')
    .pipe(plumber())
    .pipe(browserify())
    .pipe(gulp.dest('./build/js'));
});

gulp.task('html', function() {
  return gulp.src('src/html/index.html')
    .pipe(plumber())
    .pipe(gulp.dest('./build'));
});

gulp.task('reload', function() {
  return gulp.src('build/*.*')
    .pipe(plumber())
    .pipe(connect.reload());
});

gulp.task('watch', function() {
  gulp.watch('src/**/*.*', ['build']);
});

gulp.task('assets', function() {
  return gulp.src('assets/**/*.*')
    .pipe(plumber())
    .pipe(gulp.dest('./build/assets'));
});

gulp.task('build', function() {
  return runSequence(
    'html',
    'scripts',
    'reload'
  );
});

gulp.task('deploy', ['assets', 'build'], function() {
  return gulp.src('./build/**/*')
    .pipe(ghPages());
});

gulp.task('default', ['assets', 'build', 'webserver', 'watch']);