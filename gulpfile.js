var gulp = require('gulp'),
  connect = require('gulp-connect'),
  watch = require('gulp-watch'),
  src = ['css/*.css', 'js/*.js' , './*.html'];

gulp.task('webserver', function () {
  connect.server({
    livereload: true,
    root: ['./'],
    port:8000
  });
});

gulp.task('livereload', function () {
  gulp.src(src)
    .pipe(watch(src))
    .pipe(connect.reload());
});

gulp.task('watch', function () {
  gulp.watch('js/*.js');
  gulp.watch('./*.js');
  gulp.watch('styles/*.css');
})

gulp.task('default', ['webserver', 'livereload', 'watch']);
