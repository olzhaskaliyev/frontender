const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const runSequence = require('run-sequence');
const del = require('del');
const wiredep = require('wiredep').stream;
const mainBowerFiles = require('main-bower-files');
const browserSync = require('browser-sync').create();
let dev = true;

gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

gulp.task('wiredep', () => {
  gulp.src('src/**/*.pug')
    .pipe($.filter(file => file.stat && file.stat.size))
    .pipe(wiredep({
      ignorePath: /^(\.\.\/)*\.\./,
      fileTypes: {
        pug: {
          block: /(([ \t]*)\/\/-?\s*bower:*(\S*))(\n|\r|.)*?(\/\/-?\s*endbower)/gi,
          detect: {
            js: /script\(.*src=['"]([^'"]+)/gi,
            css: /link\(.*href=['"]([^'"]+)/gi
          },
          replace: {
            js: 'script(src=\'{{filePath}}\')',
            css: 'link(rel=\'stylesheet\', href=\'{{filePath}}\')'
          }
        }
      }
    }))
    .pipe(gulp.dest('src/'));
});

gulp.task('default', () => {
  runSequence('clean', 'wiredep', ['templates:cache', 'styles', 'scripts'], () => {
    browserSync.init({
      notify: false,
      port: 9000,
      server: {
        baseDir: ['.tmp', 'src'],
        routes: {
          '/bower_components': 'bower_components'
        }
      }
    });
    gulp.watch([
      'src/*.html',
      'src/images/**/*',
      'src/fonts/**/*'
    ]).on('change', browserSync.reload);

    gulp.watch('bower.json', ['wiredep']);
    gulp.watch('src/*.pug', ['templates:cache']);
    gulp.watch('src/templates/**/*.pug', ['templates', browserSync.reload]);
    gulp.watch('src/styles/**/*.scss', ['styles']);
    gulp.watch('src/scripts/**/*.js', ['scripts']);
  });
});

gulp.task('build', () => {
  return new Promise(resolve => {
    dev = false;
    runSequence('clean', 'wiredep', ['minimization', 'images', 'fonts', 'extras'], resolve);
  });
});

gulp.task('serve:dist', ['build'], () => {
  browserSync.init({
    notify: false,
    port: 9000,
    server: {
      baseDir: ['dist']
    }
  });
});

gulp.task('minimization', ['templates', 'styles', 'scripts'], () => {
  return gulp.src(['src/*.html', '.tmp/*.html'])
    .pipe($.useref({searchPath: ['.tmp', 'src', '.']}))
    .pipe($.if(/\.css$/, $.cache($.cssnano({safe: true, autoprefixer: false}))))
    .pipe($.if(/\.js$/, $.cache($.uglify({compress: {drop_console: true}}))))
    .pipe(gulp.dest('dist'))
    .pipe($.size({title: 'minimized', showFiles: true}));
});

gulp.task('templates', () => {
  return gulp.src('src/*.pug')
    .pipe($.plumber())
    .pipe($.pug())
    .pipe($.htmlBeautify())
    .pipe(gulp.dest('.tmp'));
});

gulp.task('templates:cache', () => {
  return gulp.src('src/*.pug')
    .pipe($.plumber())
    .pipe($.cached())
    .pipe($.pug())
    .pipe($.htmlBeautify())
    .pipe(gulp.dest('.tmp'))
    .pipe(browserSync.reload({stream: true}));
});

gulp.task('styles', () => {
  return gulp.src('src/styles/*.scss')
    .pipe($.plumber())
    .pipe($.if(dev, $.sourcemaps.init()))
    .pipe($.sass.sync({
      outputStyle: 'expanded',
      precision: 10,
      includePaths: ['.']
    }).on('error', $.sass.logError))
    .pipe($.autoprefixer({browsers: ['> 1%', 'last 2 versions', 'Firefox ESR']}))
    .pipe($.if(dev, $.sourcemaps.write()))
    .pipe(gulp.dest('.tmp/styles'))
    .pipe(browserSync.reload({stream: true}));
});

gulp.task('scripts', () => {
  return gulp.src('src/scripts/**/*.js')
    .pipe($.plumber())
    .pipe($.if(dev, $.sourcemaps.init()))
    .pipe($.babel())
    .pipe($.if(dev, $.sourcemaps.write('.')))
    .pipe(gulp.dest('.tmp/scripts'))
    .pipe(browserSync.reload({stream: true}));
});

gulp.task('images', () => {
  return gulp.src(mainBowerFiles(['**/*.{jpg,png,svg,gif,webp}', '!fonts/*'])
    .concat('src/images/**/*'))
    .pipe($.cache($.imagemin()))
    .pipe(gulp.dest('dist/images'))
    .pipe($.size({title: 'images', showFiles: true}));
});

gulp.task('fonts', () => {
  return gulp.src(mainBowerFiles('**/*.{eot,svg,ttf,woff,woff2}')
    .concat('src/fonts/**/*'))
    .pipe(gulp.dest('dist/fonts'))
    .pipe($.size({title: 'fonts'}));
});

gulp.task('extras', () => {
  return gulp.src(['src/*', '!src/*.html', '!src/*.pug'], {dot: true})
    .pipe(gulp.dest('dist'));
});
