const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const runSequence = require('run-sequence');
const del = require('del');
const wiredep = require('wiredep').stream;
const mainBowerFiles = require('main-bower-files');
const browserSync = require('browser-sync').create();
let dev = true;

gulp.task('default', () => {
    runSequence('clean', 'bower', ['views', 'styles', 'scripts'], () => {
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

        gulp.watch('bower.json', ['wiredep', 'bower']);
        gulp.watch('src/**/*.html', ['views']);
        gulp.watch('src/styles/**/*.scss', ['styles']);
        gulp.watch('src/scripts/**/*.js', ['scripts']);
        gulp.watch(['src/images/**/*', 'src/fonts/**/*']).on('change', browserSync.reload);
    });
});

gulp.task('build', () => {
    return new Promise(resolve => {
        dev = false;
        runSequence('clean', ['minimization', 'images', 'fonts', 'extras'], resolve);
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

gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

gulp.task('wiredep', () => {
    gulp.src('src/**/*.html')
        .pipe(wiredep({ignorePath: /^(\.\.\/)*\.\./}))
        .pipe(gulp.dest('src/'));
});

gulp.task('bower', () => {
    gulp.src(mainBowerFiles(['**/*.{jpg,png,svg,gif,webp}', '!fonts/*'], function (err) {}))
        .pipe(gulp.dest('src/images'));

    gulp.src(mainBowerFiles('**/*.{eot,svg,otf,ttf,woff,woff2}', function (err) {}))
        .pipe(gulp.dest('src/fonts'));
});

gulp.task('minimization', ['views', 'styles', 'scripts'], () => {
    return gulp.src('.tmp/*.html')
        .pipe($.useref({searchPath: ['.tmp', 'src', '.']}))
        .pipe($.if(/\.css$/, $.cssnano({safe: true, autoprefixer: false})))
        .pipe($.if(/\.js$/, $.uglify({compress: {drop_console: true}})))
        .pipe(gulp.dest('dist'))
        .pipe($.size({title: 'minimization', showFiles: true}));
});

gulp.task('views', ['wiredep'], () => {
    gulp.src('src/*.html')
        .pipe($.fileInclude({prefix: '@@', basepath: 'src/views/'}))
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
    return gulp.src(mainBowerFiles(['**/*.{jpg,png,svg,gif,webp}', '!fonts/*'], function (err) {})
        .concat('src/images/**/*'))
        .pipe($.cache($.imagemin()))
        .pipe(gulp.dest('dist/images'))
        .pipe($.size({title: 'images', showFiles: true}));
});

gulp.task('fonts', () => {
    return gulp.src(mainBowerFiles('**/*.{eot,svg,ttf,woff,woff2}', function (err) {})
        .concat('src/fonts/**/*'))
        .pipe(gulp.dest('dist/fonts'))
        .pipe($.size({title: 'fonts'}));
});

gulp.task('extras', () => {
    return gulp.src([
        'src/*',
        '!src/*.html'
    ], {
        dot: true
    }).pipe(gulp.dest('dist'));
});
