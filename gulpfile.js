// Подключение плагинов
const gulp = require('gulp');
const $ = require('gulp-load-plugins')();
const runSequence = require('run-sequence');
const del = require('del');
const wiredep = require('wiredep').stream;
const browserSync = require('browser-sync').create();
const reload = browserSync.reload;
var dev = true;

// Задача по умолчанию (gulp)
gulp.task('default', () => {
	return new Promise(resolve => {
		dev = true;
		runSequence(['clean', 'wiredep'], 'serve', resolve);
	});
});

// Очистка места сборки
gulp.task('clean', del.bind(null, ['.tmp', 'dist']));

// Интеграция библиотек
gulp.task('wiredep', () => {
	gulp.src('src/**/*.html')
		.pipe(wiredep({
			exclude: 'bower_components/jquery/',
			ignorePath: /^(\.\.\/)*\.\./
		}))
		.pipe(gulp.dest('src'));

	gulp.src('src/styles/*.scss')
		.pipe($.filter(file => file.stat && file.stat.size))
		.pipe(wiredep({
			ignorePath: /^(\.\.\/)+/
		}))
		.pipe(gulp.dest('src/styles'));

	gulp.src(require('main-bower-files')('**/*.{eot,svg,otf,ttf,woff,woff2}', function (err) {
	}))
		.pipe(gulp.dest('src/fonts'));

	gulp.src(require('main-bower-files')(['**/*.{jpg,png,svg,gif,webp}', '!fonts/*'], function (err) {
	}))
		.pipe(gulp.dest('src/images'));
});

// Интеграция шаблонов
gulp.task('fileinclude', () => {
	return gulp.src('src/**/*.html')
		.pipe($.fileInclude({prefix: '@@', basepath: 'src/views/'}))
		.pipe(gulp.dest('.tmp'))
		.pipe(reload({stream: true}));
});

// Начать верстку в "прямом эфире"
gulp.task('serve', () => {
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
gulp.task('build', ['wiredep', 'lint', 'html', 'images', 'fonts', 'extras'], () => {
	return gulp.src('dist/**/*').pipe($.size({title: 'build', gzip: true}));
});

// Обзор собранной верстки
gulp.task('serve:dist', () => {
	browserSync.init({
		notify: false,
		port: 9000,
		server: {
			baseDir: ['dist']
		}
	});
});

// Минификация и Конкатинация скриптов и стилей, сборка HTML
gulp.task('html', ['styles', 'scripts'], () => {
	return gulp.src('.tmp/**/*.html')
		.pipe($.useref({searchPath: ['.tmp', 'src', '.']}))
		//.pipe($.if('*.html', $.htmlmin({collapseWhitespace: true})))
		.pipe($.if('*.html', $.fileInclude({prefix: '@@', basepath: 'src/views/'})))
		.pipe($.if('*.css', $.cssnano({safe: true, autoprefixer: false})))
		.pipe($.if('*.js', $.uglify()))
		.pipe(gulp.dest('dist'));
});

// Компиляция SASS и автопрефикс
gulp.task('styles', () => {
	return gulp.src('src/styles/*.scss')
		.pipe($.plumber())
		.pipe($.sourcemaps.init())
		.pipe($.sass.sync({
			outputStyle: 'expanded',
			precision: 10,
			includePaths: ['.']
		}).on('error', $.sass.logError))
		.pipe($.autoprefixer({browsers: ['> 1%', 'last 2 versions', 'Firefox ESR']}))
		.pipe($.sourcemaps.write())
		.pipe(gulp.dest('.tmp/styles'))
		.pipe(reload({stream: true}));
});

// Компиляция Babel (ECMAScript 2015)
gulp.task('scripts', () => {
	return gulp.src('src/scripts/**/*.js')
	//.pipe($.plumber())
	//.pipe($.sourcemaps.init())
	//.pipe($.babel())
	//.pipe($.sourcemaps.write('.'))
		.pipe(gulp.dest('.tmp/scripts'))
		.pipe(reload({stream: true}));
});

// Оптимизация картинок
gulp.task('images', () => {
	return gulp.src('src/images/**/*')
		.pipe($.cache($.imagemin()))
		.pipe(gulp.dest('dist/images'));
});

// Сборка шрифтов
gulp.task('fonts', () => {
	return gulp.src(require('main-bower-files')('**/*.{eot,svg,otf,ttf,woff,woff2}', function (err) {
	})
		.concat('src/fonts/**/*'))
		.pipe($.if(dev, gulp.dest('.tmp/fonts'), gulp.dest('dist/fonts')));
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

// Валидация скриптов
function lint(files, options) {
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
