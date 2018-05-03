const gulp = require('gulp');

var del = require('del');
var notify = require("gulp-notify");
var watch = require('gulp-watch');

gulp.task('stylesheets', function() {
    return gulp.src('./node_modules/cds-webkit/dist/assets/css/*.css')
        .pipe(gulp.dest('./pulse/static/assets/css/'));
});

gulp.task('clean', function () {
    return del([
        'dist/**/*',
    ]);
});

gulp.task('images', function () {
    return gulp.src('./node_modules/cds-webkit/src/images/*')
        .pipe(gulp.dest('./pulse/static/assets/images/'));
});

gulp.task('build', gulp.series('clean', 'stylesheets', 'images'));

gulp.task('default', gulp.parallel('build'));