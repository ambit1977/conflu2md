// gulpfile.js
import gulp from 'gulp';
import zip from 'gulp-zip';
import del from 'del';
import newer from 'gulp-newer';

// コピー対象のすべてのリソースを指定します。
const paths = {
  resources: [
    'manifest.json',
    'popup.html',
    'style.css',
    'background.js',
    'popup.js',
    'src/**/*',
    'icons/**/*',
    '_locales/**/*'
  ]
};

// 以前のリリースパッケージと dist/ フォルダを削除するタスク
export const clean = () => del(['release.zip', 'dist']);

// 更新があったリソースのみを dist/ フォルダにコピーするタスク
export const copy = () => {
  return gulp.src(paths.resources, { base: '.' })
    .pipe(newer('dist'))
    .pipe(gulp.dest('dist'));
};

// dist/ フォルダ内のすべてのファイルを ZIP 化して release.zip を生成するタスク
export const zipTask = () => {
  return gulp.src('dist/**/*')
    .pipe(zip('release.zip'))
    .pipe(gulp.dest('.'));
};

// デフォルトタスク: clean -> copy -> zipTask の順に実行
export default gulp.series(clean, copy, zipTask);
