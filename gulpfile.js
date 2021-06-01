const gulp = require('gulp');
const sass = require('gulp-sass');
const concat = require('gulp-concat');
const rename = require('gulp-rename');
const minify = require('gulp-clean-css');
const browserSync = require('browser-sync').create();

gulp.task('sass', function() {
  return gulp.src('src/scss/app.scss')
    .pipe(sass().on('error', sass.logError))
    .pipe(gulp.dest('./dist/css'))
    .pipe(rename('app.min.css'))
    .pipe(minify())
    .pipe(gulp.dest('./dist/css'))
    .pipe(browserSync.stream())
});

gulp.task('combine', function() {
  return gulp.src([
	  'src/scss/components/_accordion.scss',
	  'src/scss/components/_alert.scss',
	  'src/scss/components/_align.scss',
	  'src/scss/components/_animation.scss',
	  'src/scss/components/_article.scss',
	  'src/scss/components/_background.scss',
	  'src/scss/components/_badge.scss',
	  'src/scss/components/_base.scss',
	  'src/scss/components/_breadcrumb.scss',
	  'src/scss/components/_button.scss',
	  'src/scss/components/_card.scss',
	  'src/scss/components/_close.scss',
	  'src/scss/components/_column.scss',
	  'src/scss/components/_comment.scss',
	  'src/scss/components/_container.scss',
	  'src/scss/components/_countdown.scss',
	  'src/scss/components/_cover.scss',
	  'src/scss/components/_description-list.scss',
	  'src/scss/components/_divider.scss',
	  'src/scss/components/_dotnav.scss',
	  'src/scss/components/_drop.scss',
	  'src/scss/components/_dropdown.scss',
	  'src/scss/components/_flex.scss',
	  'src/scss/components/_form-range.scss',
	  'src/scss/components/_form.scss',
	  'src/scss/components/_grid-masonry.scss',
	  'src/scss/components/_grid.scss',
	  'src/scss/components/_heading.scss',
	  'src/scss/components/_icon.scss',
	  'src/scss/components/_iconnav.scss',
	  'src/scss/components/_inverse.scss',
	  'src/scss/components/_label.scss',
	  'src/scss/components/_leader.scss',
	  'src/scss/components/_lightbox.scss',
	  'src/scss/components/_link.scss',
	  'src/scss/components/_list.scss',
	  'src/scss/components/_margin.scss',
	  'src/scss/components/_marker.scss',
	  'src/scss/components/_mixin.scss',
	  'src/scss/components/_modal.scss',
	  'src/scss/components/_nav.scss',
	  'src/scss/components/_navbar.scss',
	  'src/scss/components/_notification.scss',
	  'src/scss/components/_offcanvas.scss',
	  'src/scss/components/_overlay.scss',
	  'src/scss/components/_padding.scss',
	  'src/scss/components/_pagination.scss',
	  'src/scss/components/_placeholder.scss',
	  'src/scss/components/_position.scss',
	  'src/scss/components/_print.scss',
	  'src/scss/components/_progress.scss',
	  'src/scss/components/_search.scss',
	  'src/scss/components/_section.scss',
	  'src/scss/components/_slidenav.scss',
	  'src/scss/components/_slider.scss',
	  'src/scss/components/_slideshow.scss',
	  'src/scss/components/_sortable.scss',
	  'src/scss/components/_sortable.scss',
	  'src/scss/components/_spinner.scss',
	  'src/scss/components/_sticky.scss',
	  'src/scss/components/_subnav.scss',
	  'src/scss/components/_svg.scss',
	  'src/scss/components/_switcher.scss',
	  'src/scss/components/_tab.scss',
	  'src/scss/components/_table.scss',
	  'src/scss/components/_text.scss',
	  'src/scss/components/_thumbnav.scss',
	  'src/scss/components/_tile.scss',
	  'src/scss/components/_tooltip.scss',
	  'src/scss/components/_totop.scss',
	  'src/scss/components/_transition.scss',
	  'src/scss/components/_utility.scss',
	  'src/scss/components/_variables.scss',
	  'src/scss/components/_visibility.scss',
	  'src/scss/components/_width.scss'
  ])
    .pipe(concat('app.scss'))
    .pipe(gulp.dest('./src/examples/scss'))
});

gulp.task('html', function() {
  return gulp.src('./src/pages/*.html')
    .pipe(gulp.dest('./dist/'))
    .pipe(browserSync.stream())
});

function serve() {
  browserSync.init({
    server: {
      baseDir: './dist'
    }
  })
}

gulp.task('watch', function() {
  gulp.watch(['src/scss/**/*.scss', 'src/scss/components/*.scss', 'src/pages/*.html'], gulp.series('sass', 'combine', 'html')).on('change', browserSync.reload);
});

gulp.task('default', gulp.parallel('sass', 'combine', 'watch', 'html', serve));