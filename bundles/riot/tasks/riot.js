
// Require dependencies
const fs         = require('fs-extra');
const os         = require('os');
const gulp       = require('gulp');
const gulpRename = require('gulp-rename');

// require dependencies
const glob        = require('@edenjs/glob');
const config      = require('config');
const { compile } = require('@riotjs/compiler');

/**
 * Build riot task class
 *
 * @task     riot
 * @after    javascript
 * @priority 1
 */
class RiotTask {
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

    // Bind private methods
    this._views = this._views.bind(this);
  }

  /**
   * Run riot task
   *
   * @return {Promise}
   */
  async run(files) {
    // Create header
    let head      = ['// AUTOMATICALLY GENERATED EDENJS VIEW ENGINE //', ''];
    const include = config.get('view.include') || {};

    // Loop include
    Object.keys(include).forEach((key) => {
      // push require head
      head.push(`const ${key} = require('${include[key]}');`);
    });

    // join head
    head = head.join(os.EOL);

    // Await views
    await this._views(files);

    // get files
    const entries = await glob([
      `${global.appRoot}/data/cache/riot/js/**/*.js`,
      `${global.appRoot}/data/cache/riot/**/*.riot`,
      `!${global.appRoot}/data/cache/riot/email/**/*.riot`,
    ]);

    // ems require
    // can be removed with --experimental-modules flag
    const esmRequire = require('esm')(module);

    // map files
    const compiledFiles = (await Promise.all(entries.map(async (entry) => {
      // compile if riot
      if (entry.includes('.riot')) {
        // read file
        const item = await fs.readFile(entry, 'utf8');

        // code/map
        const { code, map } = await compile(item, {
          file : entry,
        });

        // write compiled
        await fs.writeFile(`${entry}.js`, code);
        await fs.writeFile(`${entry}.map`, JSON.stringify(map));

        // return compiled
        return {
          orig : entry,
          name : esmRequire(`${entry}.js`).default.name, // todo this sucks
          file : `${entry}.js`,
        };
      }

      // return entry
      return null;
    }))).filter(e => e);

    // return backend
    const output = compiledFiles.map((entry) => {
      // entry name
      if (entry.name) {
        // return riot register
        return `riot.register('${entry.name}', require('${entry.file}').default);`;
      }

      // return require
      return `require('${entry.file}');`;
    }).join(os.EOL);

    // write file
    await fs.writeFile(`${global.appRoot}/data/cache/view.backend.js`, [
      "const createRegister = require('@riotjs/ssr/register');",
      'const exporting = {};',
      'const unregister = createRegister();',
      compiledFiles.map((file) => {
        // require original
        return `exporting['${file.name}'] = require('${file.orig}');`;
      }).join(os.EOL),
      'unregister();',
      'module.exports = exporting;',
    ].join(os.EOL));
    await fs.writeFile(`${global.appRoot}/data/cache/view.frontend.js`, `${head}${os.EOL}${os.EOL}${output}`);
  }

  /**
   * Watch task
   *
   * @return {Array}
   */
  watch() {
    // Return files
    return ['views/js/**/*', 'views/**/*.riot'];
  }

  /**
   * Run riot views
   *
   * @param {Array} files
   *
   * @return {Promise}
   * @private
   */
  async _views(files) {
    // Remove views cache directory
    await fs.remove(`${global.appRoot}/data/cache/riot`);

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

    // pipe to riot folder
    job = job.pipe(gulp.dest(`${global.appRoot}/data/cache/riot`));

    // Wait for job to end
    await new Promise((resolve, reject) => {
      job.once('end', resolve);
      job.once('error', reject);
    });
  }
}

/**
 * Export riot task
 *
 * @type {RiotTask}
 */
module.exports = RiotTask;
