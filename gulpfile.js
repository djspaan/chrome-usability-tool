var gulp = require("gulp");
var babel = require("gulp-babel");
var browserify = require("browserify");
var babelify = require("babelify");
var source = require("vinyl-source-stream");
var buffer = require("vinyl-buffer");

gulp.task('watch', function() {
    gulp.watch('./popup/control.js', ['js']);
});

gulp.task("jspopup", function () {
    ['./popup/control.js'].map(function(entry) {
        return browserify({
            entries: [entry]
        })
            .transform(babelify, {presets: ['env']})
            .bundle()
            .pipe(source(entry))
            .pipe(buffer())
            .pipe(gulp.dest('./popup/dist'))
    });
});

gulp.task("jsease", function () {
    ['./ease.js'].map(function(entry) {
        return browserify({
            entries: [entry]
        })
            .transform(babelify, {presets: ['env']})
            .bundle()
            .pipe(source(entry))
            .pipe(buffer())
            .pipe(gulp.dest('./dist'))
    });
});