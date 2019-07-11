
// Require dependencies
const fs             = require('fs-extra');
const gulp           = require('gulp');
const gulpRiot       = require('gulp-riot');
const gulpConcat     = require('gulp-concat');
const gulpHeader     = require('gulp-header');
const gulpRename     = require('gulp-rename');
const gulpSourcemaps = require('gulp-sourcemaps');

// Require local dependencies
const config = require('config');

/**
 * Build riot task class
 *
 * @task emails
 */
class EmailTask {
  /**
   * Construct riot task class
   *
   * @param {gulp} gulp
   */
  constructor(runner) {
    // Set private variables
    this._runner = runner;

    // Bind methods
    this.run = this.run.bind(this);
    this.watch = this.watch.bind(this);
  }

  /**
   * Run riot task
   *
   * @return {Promise}
   */
  async run(files) {
    // Create header
    let head      = '';
    const include = config.get('view.include') || {};

    // Loop include
    for (const key of Object.keys(include)) {
      head += `const ${key} = require ("${include[key]}");`;
    }

    await this._views(files);

    // Return promise
    let job = gulp.src([
      `${global.appRoot}/data/cache/emails/**/*.tag`,
    ]);

    if (config.get('environment') === 'dev' && !config.get('noSourcemaps')) {
      job = job.pipe(gulpSourcemaps.init());
    }

    job = job
      .pipe(gulpRiot({
        compact    : true,
        whitespace : false,
      }))
      .pipe(gulpConcat('emails.js'))
      .pipe(gulpHeader('const riot = require ("riot");'))
      .pipe(gulp.dest(`${global.appRoot}/data/cache`))
      .pipe(gulpHeader(head))
      .pipe(gulpRename('emails.min.js'));

    if (config.get('environment') === 'dev' && !config.get('noSourcemaps')) {
      job = job.pipe(gulpSourcemaps.write('.'));
    }

    job = job.pipe(gulp.dest(`${global.appRoot}/data/cache`));

    // Wait for job to end
    await new Promise((resolve, reject) => {
      job.once('end', resolve);
      job.once('error', reject);
    });
  }

  /**
   * Watch task
   *
   * @return {Array}
   */
  watch() {
    // Return files
    return 'emails/**/*.tag';
  }

  /**
   * Run riot views
   *
   * @return {Promise}
   * @private
   */
  async _views(files) {
    // Remove emails cache directory
    await fs.remove(`${global.appRoot}/data/cache/emails`);

    // Run gulp
    let job = gulp.src(files);

    // pipe rename
    job = job.pipe(gulpRename((filePath) => {
      // Get amended
      let amended = filePath.dirname.replace(/\\/g, '/').split('bundles/');

      // Correct path
      amended = amended.pop();
      amended = amended.split('views');
      amended.shift();
      amended = amended.join('views');

      // Alter amended
      filePath.dirname = amended; // eslint-disable-line no-param-reassign
    }));

    // put in emails cache
    job = job.pipe(gulp.dest(`${global.appRoot}/data/cache/emails`));

    // Wait for job to end
    await new Promise((resolve, reject) => {
      job.once('end', resolve);
      job.once('error', reject);
    });
  }
}

/**
 * Export email task
 *
 * @type {EmailTask}
 */
module.exports = EmailTask;
