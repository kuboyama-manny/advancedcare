var gulp = require('gulp');
var less = require('gulp-less');
var sourcemaps = require('gulp-sourcemaps');
var browserSync = require('browser-sync').create();

var LessPluginCleanCSS = require('less-plugin-clean-css'),
  cleanCSSPlugin = new LessPluginCleanCSS({ advanced: true, compatibility: 'ie8' });

/* = = = = = = = = = = = = = = = = = = = = = = = = =
* LESS SECTION
* = = = = = = = = = = = = = = = = = = = = = = = = = */

/* Compile less */
gulp.task('less', function() {
  gulp.src([
    './assets/less/main.less'
  ])
    .pipe(sourcemaps.init())
    .pipe(less({
      plugins: [cleanCSSPlugin]
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./assets/css/'))
    .pipe(browserSync.stream());
});

gulp.task('less-pages', function() {
  gulp.src('./assets/less/pages/**/*.less')
    .pipe(sourcemaps.init())
    .pipe(less({
      plugins: [cleanCSSPlugin]
    }))
    .pipe(sourcemaps.write())
    .pipe(gulp.dest('./assets/css/pages/'))
    .pipe(browserSync.stream());
});

/* = = = = = = = = = = = = = = = = = = = = = = = = =
* SERVE FILES
* = = = = = = = = = = = = = = = = = = = = = = = = = */
gulp.task('serve', function() {
  browserSync.init({
    server: { baseDir: "." },
    port: 8000,
    open: true
  });

  gulp.watch([
    './assets/less/**/*.less',
    '!./assets/less/pages/**/*.less'
  ], ['less']);

  gulp.watch([
    "./assets/less/pages/**/*.less"
  ], ['less-pages']);

  gulp.watch([
    "./assets/**/*.html",
    "./assets/**/*.js"
  ]).on("change", browserSync.reload);
});

/* Task when running `gulp` from terminal */
gulp.task('default', ['serve']);