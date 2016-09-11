var gulp = require("gulp");
var path = require('path');
var concat = require("gulp-concat");
var uglify = require("gulp-uglify");
var rename = require("gulp-rename");
var pump = require('pump');

gulp.task("concat-client", function() {
    gulp.src(["./public/javascripts/module.js", "./public/javascripts/**/*.js"])
        .pipe(concat("app.js"))
        .pipe(gulp.dest("./public"))
});

gulp.task("minify-client", function() {
    gulp.src(["./public/app.js"])
        .pipe(uglify())
        .pipe(rename({suffix: ".min"}))
        .pipe(gulp.dest("./public"))
});

gulp.task("concat-libs", function() {
    gulp.src(["./public/lib/jquery.min.js", "./public/lib/angular.min.js", "./public/lib/*.js", "./public/lib/bootstrap/js/bootstrap.min.js", "./public/app.min.js"])
        .pipe(concat("applibs.js"))
        .pipe(gulp.dest("./public"))
});

gulp.task("default", ['concat-client', 'minify-client', 'concat-libs']);