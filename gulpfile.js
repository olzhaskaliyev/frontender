// Подключение плагинов
const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const runSequence = require('run-sequence');
const del = require('del');
const wiredep = require('wiredep').stream;
const mainBowerFiles = require('main-bower-files');
const browserSync = require('browser-sync').create();
let dev = true;

// Интеграция библиотек
gulp.task('vendors', () => {
    gulp.src('src/views/*.html')
        .pipe(wiredep({ignorePath: /^(\.\.\/)*\.\./}))
        .pipe(gulp.dest('src/views'));

    gulp.src(mainBowerFiles(['**/*.{jpg,png,svg,gif,webp}', '!fonts/*'], function (err) {
    }))
        .pipe(gulp.dest('src/images'));

    gulp.src(mainBowerFiles('**/*.{eot,svg,otf,ttf,woff,woff2}', function (err) {
    }))
        .pipe(gulp.dest('src/fonts'));
});

// Оптимизация картинок
gulp.task('images', () => {
    return gulp.src('src/images/**/*')
        .pipe($.cache($.imagemin()))
        .pipe(gulp.dest('dist/images'));
});

// Сборка шрифтов
gulp.task('fonts', () => {
    return gulp.src('src/fonts/**/*')
        .pipe(gulp.dest('dist/fonts'));
});

// Минификация и Конкатинация скриптов и стилей, сборка HTML
gulp.task('views', ['templates', 'styles', 'scripts'], () => {
    return gulp.src('.tmp/**/*.html')
        .pipe($.useref({searchPath: ['.tmp', 'src', '.']}))
        //.pipe($.if('*.html', $.htmlmin({collapseWhitespace: true})))
        .pipe($.if(/\.html$/, $.fileInclude({prefix: '@@', basepath: 'src/views/'})))
        .pipe($.if(/\.css$/, $.cssnano({safe: true, autoprefixer: false})))
        .pipe($.if(/\.js$/, $.uglify({compress: {drop_console: true}})))
        .pipe(gulp.dest('dist'));
});

// Интеграция шаблонов
gulp.task('templates', () => {
    return gulp.src('src/*.html')
        .pipe($.fileInclude({prefix: '@@', basepath: 'src/views/'}))
        .pipe(gulp.dest('.tmp'))
        .pipe(browserSync.reload({stream: true}));
});

// Задача по умолчанию (gulp)
gulp.task('default', () => {
    runSequence('clean', 'vendors', ['templates', 'styles', 'scripts'], () => {
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

        gulp.watch('bower.json', ['vendors']);
        gulp.watch('src/**/*.html', ['templates']);
        gulp.watch('src/styles/**/*.scss', ['styles']);
        gulp.watch('src/scripts/**/*.js', ['scripts']);
        gulp.watch('src/fonts/**/*', ['fonts']);
        gulp.watch(['src/images/**/*', 'src/fonts/**/*']).on('change', browserSync.reload);
    });
});

gulp.task('build', () => {
    return new Promise(resolve => {
        dev = false;
        runSequence('clean', 'vendors', ['views', 'images', 'fonts', 'extras'], resolve);
    });
});

// Обзор собранной верстки
gulp.task('serve:dist', ['build'], () => {
    browserSync.init({
        notify: false,
        port: 9000,
        server: {
            baseDir: ['dist']
        }
    });
});

// Очистка места сборки
gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

// Компиляция SASS и автопрефикс
gulp.task('styles', () => {
    return gulp.src('src/styles/main.scss')
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

// Компиляция Babel (ECMAScript 2015)
gulp.task('scripts', () => {
    return gulp.src('src/scripts/**/*.js')
        .pipe($.plumber())
        .pipe($.if(dev, $.sourcemaps.init()))
        .pipe($.babel())
        .pipe($.if(dev, $.sourcemaps.write('.')))
        .pipe(gulp.dest('.tmp/scripts'))
        .pipe(browserSync.reload({stream: true}));
});

// Сборка разного в корне (favicon, robots, etc.)
gulp.task('extras', () => {
    return gulp.src([
        'src/*',
        '!src/*.html'
    ], {
        dot: true
    }).pipe(gulp.dest('dist'));
});
