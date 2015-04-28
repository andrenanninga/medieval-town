'use strict';

var gulp        = require('gulp');
var connect     = require('gulp-connect');
var plumber     = require('gulp-plumber');
var browserify  = require('gulp-browserify');
var ghPages     = require('gulp-gh-pages');
var replace     = require('gulp-replace');
var runSequence = require('run-sequence');

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

gulp.task('css', function() {
  return gulp.src('src/css/*.css')
    .pipe(plumber())
    .pipe(gulp.dest('./build/css'));
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
  return runSequence(
    'copy-assets',
    'clean-models-mtl',
    'clean-models-obj'
  );
});

gulp.task('copy-assets', function() {
  return gulp.src('assets/**/*.*')
    .pipe(plumber())
    .pipe(gulp.dest('./build/assets'));
});

gulp.task('clean-models-mtl', function() {
  return gulp.src('build/assets/models/*.mtl', { base: './' })
    .pipe(replace(/^newmtl ([A-Za-z_]*)\.[0-9]*$/gm, 'newmtl $1'))
    .pipe(gulp.dest('./'));
});

gulp.task('clean-models-obj', function() {
  return gulp.src('build/assets/models/*.obj', { base: './' })
    .pipe(replace(/^usemtl ([A-Za-z_]*)\.[0-9]*$/gm, 'usemtl $1'))
    .pipe(gulp.dest('./'));
});

gulp.task('build', function() {
  return runSequence(
    'html',
    'css',
    'scripts',
    'reload'
  );
});

gulp.task('deploy', ['assets', 'build'], function() {
  return gulp.src('./build/**/*')
    .pipe(ghPages());
});

gulp.task('default', ['assets', 'build', 'webserver', 'watch']);