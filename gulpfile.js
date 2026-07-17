const { src, dest, series, parallel, watch } = require('gulp');
const sass = require('gulp-sass')(require('sass'));
const cleanCSS = require('gulp-clean-css');
const autoprefixer = require('gulp-autoprefixer');
const sourcemaps = require('gulp-sourcemaps');
const terser = require('gulp-terser');
const imagemin = require('gulp-imagemin');
const fileInclude = require('gulp-file-include');
const browserSync = require('browser-sync').create();
const del = require('del');
const plumber = require('gulp-plumber');
const notify = require('gulp-notify');
const fs = require('fs');
const path = require('path');

const isProd = process.argv.includes('--prod');

const paths = {
  html: { src: 'src/*.html', dest: 'dist/' },
  scss: { src: 'src/scss/main.scss', dest: 'dist/css/', watch: 'src/scss/**/*.scss' },
  js: { src: 'src/js/**/*.js', dest: 'dist/js/' },
  images: { src: 'src/images/**/*', dest: 'dist/images/' },
  fonts: { src: 'src/fonts/**/*.*', dest: 'dist/fonts/' }
};

function clean() { return del(['dist/**', '!dist']); }

function html() {
  return src(paths.html.src)
    .pipe(plumber({ errorHandler: notify.onError('Error: <%= error.message %>') }))
    .pipe(fileInclude({ prefix: '@@', basepath: '@file' }))
    .pipe(dest(paths.html.dest))
    .pipe(browserSync.stream());
}

function styles() {
  return src(paths.scss.src)
    .pipe(plumber({ errorHandler: notify.onError('Error: <%= error.message %>') }))
    .pipe(sourcemaps.init())
    .pipe(sass().on('error', sass.logError))
    .pipe(autoprefixer({ overrideBrowserslist: ['last 2 versions'], cascade: false }))
    .pipe(isProd ? cleanCSS() : sourcemaps.write('.'))
    .pipe(dest(paths.scss.dest))
    .pipe(browserSync.stream());
}

function scripts() {
  return src(paths.js.src)
    .pipe(plumber({ errorHandler: notify.onError('Error: <%= error.message %>') }))
    .pipe(isProd ? terser() : sourcemaps.init())
    .pipe(isProd ? dest(paths.js.dest) : sourcemaps.write('.'))
    .pipe(dest(paths.js.dest))
    .pipe(browserSync.stream());
}

// БЫСТРОЕ копирование для разработки (без сжатия, работает мгновенно)
function imagesDev() {
  return src(paths.images.src).pipe(dest(paths.images.dest));
}

// ТЯЖЕЛОЕ сжатие только для финальной сборки (build)
function imagesProd() {
  return src(paths.images.src)
    .pipe(plumber({ errorHandler: notify.onError('Error: <%= error.message %>') }))
    .pipe(imagemin([
      imagemin.mozjpeg({ quality: 80 }),
      imagemin.optipng({ optimizationLevel: 5 }),
      imagemin.svgo({ plugins: [{ removeViewBox: true }] })
    ]))
    .pipe(dest(paths.images.dest));
}

function fonts() {
  return src(paths.fonts.src).pipe(dest(paths.fonts.dest));
}

function generateFontsCSS() {
  const fontsDir = 'src/fonts';
  let cssContent = '/* Auto-generated fonts */\n\n';
  if (fs.existsSync(fontsDir)) {
    const fontFiles = fs.readdirSync(fontsDir);
    const fontGroups = {};
    fontFiles.forEach(file => {
      if (file.match(/\.(woff2?|ttf|otf|eot)$/i)) {
        const fontName = path.basename(file, path.extname(file));
        const ext = path.extname(file).toLowerCase();
        if (!fontGroups[fontName]) fontGroups[fontName] = [];
        fontGroups[fontName].push({ name: file, ext });
      }
    });
    Object.keys(fontGroups).forEach(fontName => {
      let srcList = fontGroups[fontName].map(f => {
        const mime = f.ext === '.woff2' ? 'woff2' : f.ext === '.woff' ? 'woff' : f.ext === '.ttf' ? 'truetype' : 'opentype';
        return `url('../fonts/${f.name}') format('${mime}')`;
      });
      cssContent += `@font-face { font-family: '${fontName}'; src: ${srcList.join(', ')}; font-weight: normal; font-style: normal; font-display: swap; }\n\n`;
    });
  }
  fs.writeFileSync('src/scss/_fonts.scss', cssContent);
  return Promise.resolve();
}

function serve() {
  browserSync.init({
    server: { baseDir: 'dist' },
    port: 3000,
    open: true
  });

  watch('src/*.html', html);
  watch(paths.scss.watch, styles);
  watch(paths.js.src, scripts);
  watch(paths.images.src, imagesDev); // Следим и быстро копируем
  watch(paths.fonts.src, fonts);
}

// РАЗРАБОТКА: быстрый пайплайн (картинки просто копируются)
const dev = series(
  clean, 
  generateFontsCSS, 
  parallel(html, styles, scripts, imagesDev, fonts), 
  serve
);

// ПРОДАКШЕН: полный пайплайн (картинки сжимаются)
const buildProd = series(
  clean, 
  generateFontsCSS, 
  parallel(html, styles, scripts, imagesProd, fonts)
);

exports.clean = clean;
exports.build = buildProd;
exports.default = dev;
