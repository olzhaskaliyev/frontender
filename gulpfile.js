// Подключение плагинов
const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const runSequence = require('run-sequence');
const del = require('del');
const wiredep = require('wiredep').stream;
const browserSync = require('browser-sync').create();
const reload = browserSync.reload;
var dev = true;

// Очистка места сборки
gulp.task('clean', del.bind(null, ['.tmp', 'build']));

// Интеграция библиотек
gulp.task('wiredep', () => {
    gulp.src('src/**/*.html')
        .pipe(wiredep({
            ignorePath: /^(\.\.\/)*\.\./
        }))
        .pipe(gulp.dest('src'));

    gulp.src('src/styles/*.scss')
        .pipe($.filter(file => file.stat && file.stat.size))
        .pipe(wiredep({
            ignorePath: /^(\.\.\/)+/
        }))
        .pipe(gulp.dest('src/styles'));

    gulp.src(require('main-bower-files')(['**/*.{jpg,png,svg,gif,webp}', '!fonts/*'], function (err) {
    }))
        .pipe(gulp.dest('src/images'));

    gulp.src(require('main-bower-files')('**/*.{eot,svg,otf,ttf,woff,woff2}', function (err) {
    }))
        .pipe(gulp.dest('src/fonts'));
});

// Задача по умолчанию (gulp)
gulp.task('default', () => {
    runSequence(['clean', 'wiredep'], ['fileinclude', 'styles', 'scripts', 'fonts'], () => {
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
            'src/**/*.html',
            'src/images/**/*',
            '.tmp/fonts/**/*'
        ]).on('change', reload);

        gulp.watch('src/**/*.html', ['fileinclude']);
        gulp.watch('src/styles/**/*.scss', ['styles']);
        gulp.watch('src/scripts/**/*.js', ['scripts']);
        gulp.watch('src/fonts/**/*', ['fonts']);
        gulp.watch('bower.json', ['wiredep', 'fonts']);
    });
});

// Сборка верстки
gulp.task('build', ['lint', 'html', 'images', 'fonts', 'extras'], () => {
    return gulp.src('build/**/*').pipe($.size({title: 'build', gzip: true}));
});

gulp.task('build-production', () => {
    return new Promise(resolve => {
        dev = false;
        runSequence(['clean', 'wiredep'], 'build', resolve);
    });
});

// Обзор собранной верстки
gulp.task('serve:build', ['build-production'], () => {
    browserSync.init({
        notify: false,
        port: 9000,
        server: {
            baseDir: ['build']
        }
    });
});

// Интеграция шаблонов
gulp.task('fileinclude', () => {
    return gulp.src('src/**/*.html')
        .pipe($.fileInclude({prefix: '@@', basepath: 'src/views/'}))
        .pipe(gulp.dest('.tmp'))
        .pipe(reload({stream: true}));
});

// Минификация и Конкатинация скриптов и стилей, сборка HTML
gulp.task('html', ['fileinclude', 'styles', 'scripts'], () => {
    return gulp.src('.tmp/**/*.html')
        .pipe($.useref({searchPath: ['.tmp', 'src', '.']}))
        //.pipe($.if('*.html', $.htmlmin({collapseWhitespace: true})))
        .pipe($.if(/\.html$/, $.fileInclude({prefix: '@@', basepath: 'src/views/'})))
        .pipe($.if(/\.css$/, $.cssnano({safe: true, autoprefixer: false})))
        .pipe($.if(/\.js$/, $.uglify({compress: {drop_console: true}})))
        .pipe(gulp.dest('build'));
});

// Компиляция SASS и автопрефикс
gulp.task('styles', () => {
    return gulp.src('src/styles/**/*.scss')
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
        .pipe(reload({stream: true}));
});

// Компиляция Babel (ECMAScript 2015)
gulp.task('scripts', () => {
    return gulp.src('src/scripts/**/*.js')
        .pipe($.plumber())
        .pipe($.if(dev, $.sourcemaps.init()))
        .pipe($.babel())
        .pipe($.if(dev, $.sourcemaps.write('.')))
        .pipe(gulp.dest('.tmp/scripts'))
        .pipe(reload({stream: true}));
});

// Оптимизация картинок
gulp.task('images', () => {
    return gulp.src('src/images/**/*')
        .pipe($.cache($.imagemin()))
        .pipe(gulp.dest('build/images'));
});

// Сборка шрифтов
gulp.task('fonts', () => {
    return gulp.src(require('main-bower-files')('**/*.{eot,svg,otf,ttf,woff,woff2}', function (err) {
    })
        .concat('src/fonts/**/*'))
        .pipe(gulp.dest('.tmp/fonts'))
        .pipe(gulp.dest('build/fonts'));
});

// Сборка разного в корне (favicon, robots, etc.)
gulp.task('extras', () => {
    return gulp.src([
        'src/*',
        '!src/*.html'
    ], {
        dot: true
    }).pipe(gulp.dest('build'));
});

// Валидация скриптов
function lint(files) {
    return gulp.src(files)
        .pipe($.eslint({fix: true}))
        .pipe(reload({stream: true, once: true}))
        .pipe($.eslint.format())
        .pipe($.if(!browserSync.active, $.eslint.failAfterError()));
}
gulp.task('lint', () => {
    return lint('src/scripts/**/*.js')
        .pipe(gulp.dest('src/scripts'));
});
gulp.task('lint:test', () => {
    return lint('test/spec/**/*.js')
        .pipe(gulp.dest('test/spec'));
});

// Обзор тестов
gulp.task('serve:test', ['scripts'], () => {
    browserSync.init({
        notify: false,
        port: 9000,
        ui: false,
        server: {
            baseDir: 'test',
            routes: {
                '/scripts': '.tmp/scripts',
                '/bower_components': 'bower_components'
            }
        }
    });

    gulp.watch('src/scripts/**/*.js', ['scripts']);
    gulp.watch(['test/spec/**/*.js', 'test/index.html']).on('change', reload);
    gulp.watch('test/spec/**/*.js', ['lint:test']);
});
