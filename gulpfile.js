'use strict';
var gulp = require('gulp');
var tsc = require('gulp-typescript');
var del = require('del');
var sourcemaps = require('gulp-sourcemaps');
var path = require('path');
var spawn = require('child_process').spawn;
var runSequence = require('run-sequence');
var flatten = require('gulp-flatten');
var shell = require('gulp-shell');

// Node process
var node = null;

var tsProject = tsc.createProject('tsconfig.json');

gulp.task('clean', (cb) => {
  return del('dist', cb);
});

gulp.task('compile', () => {
  var tsResult = gulp
    .src(['app/**/*.ts'])
    .pipe(sourcemaps.init())
    .pipe(tsProject());
  return tsResult.js
    .pipe(
      sourcemaps.write('.', {
        sourceRoot: (file) => {
          return file.cwd + '/app';
        },
      })
    )
    .pipe(gulp.dest('dist'));
});

gulp.task('copy-views', () => {
  return gulp.src('app/views/**').pipe(gulp.dest('dist/views/'));
});

gulp.task('copy-locales', () => {
  return gulp.src('app/locales/**').pipe(gulp.dest('dist/locales/'));
});

gulp.task('serve', gulp.series('compile', () => {
  if (node) node.kill();
  node = spawn(
    'node',
    ['--inspect=0.0.0.0:9229', '--require', 'source-map-support/register', 'dist/main.js'],
    { stdio: 'inherit' }
  );
  node.on('close', (code) => {
    if (code === 8) {
      gulp.log('Error detected, waiting for changes...');
    }
  });

  return Promise.resolve();
}));

gulp.task('clean-serve', gulp.series('clean', 'copy-views', 'copy-locales', 'serve'));

gulp.task('build', gulp.series('clean', 'compile', 'copy-views', 'copy-locales'));

// first time cleans and compiles, subsecuent times only compiles
gulp.task('watch', gulp.series('clean-serve', () => {
  gulp.watch('app/**/*.ts', gulp.series('serve'));
}));

gulp.task('production', gulp.series('build'));

gulp.task('default', gulp.series('production'));

// clean up if an error goes unhandled.
process.on('exit', () => {
  if (node) node.kill();
});
