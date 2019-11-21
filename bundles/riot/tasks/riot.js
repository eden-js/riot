
// Require dependencies
const fs   = require('fs-extra');
const os   = require('os');
const path = require('path');

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

    // set cache file
    this._cacheFile = `${global.appRoot}/.edenjs/.cache/riot.json`;
    this._cachePath = `${global.appRoot}/.edenjs/.riot`;

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
    let head      = ['// AUTOMATICALLY GENERATED EDENJS VIEW ENGINE //', ''];
    const include = config.get('view.include') || {};

    // Loop include
    Object.keys(include).forEach((key) => {
      // push require head
      head.push(`const ${key} = require('${include[key]}');`);
    });

    // join head
    head = head.join(os.EOL);

    // await cache riot
    await fs.ensureDir(this._cachePath);

    // create map
    const map = await glob(files);
    const parsedMap = await fs.exists(this._cacheFile) ? JSON.parse(await fs.readFile(this._cacheFile, 'utf8')) : {};

    // loop map
    map.forEach((item) => {
      // add to parsed map
      let amended = item.replace(/\\/g, '/').split('bundles/');

      // stat sync
      const stat = fs.statSync(item);

      // Correct path
      amended = amended.pop();
      amended = amended.split('views');
      amended.shift();
      amended = amended.join('views');

      // set id
      const id = amended;

      // add to parsed map
      if (!parsedMap[id]) parsedMap[id] = {};

      // set fields
      parsedMap[id].id = id;
      parsedMap[id].path = item;
      parsedMap[id].mtime = new Date(stat.mtime).getTime();
    });

    // loop parsed map
    const compiledFiles = (await Promise.all(Object.values(parsedMap).map(async (item) => {
      // remove unwanted
      if (!item.path) {
        // delete
        delete parsedMap[item.id];

        // return
        return;
      }

      // check mtime
      if (await fs.exists(`${this._cachePath}${item.id}`) && item.lmtime === item.mtime) {
        // return item
        return item.file;
      }

      // move to path
      await fs.copy(item.path, `${this._cachePath}${item.id}`);

      // compile riot
      if (item.path.includes('.riot')) {
        // log
        try {
          // code/map
          const { code, map } = await compile(await fs.readFile(item.path, 'utf8'), {
            file : item.path,
          });

          // set code/map
          item.map = map;
          item.code = code;

          // ensure dir
          await fs.ensureDir(path.dirname(`${this._cachePath}${item.id}`));

          // remove old files
          await fs.remove(`${this._cachePath}${item.id}.js`);
          await fs.remove(`${this._cachePath}${item.id}.map`);

          // write compiled
          await fs.writeFile(`${this._cachePath}${item.id}.js`, code);
          await fs.writeFile(`${this._cachePath}${item.id}.map`, JSON.stringify(map));

          // split
          const split = code.split(os.EOL);

          // done
          const done = {
            orig : item.path,
            name : split[split.length - 2].split("'")[3], // todo this sucks
            file : `${this._cachePath}${item.id}.js`,
          };

          // done
          item.file = done;

          // set mtime
          item.lmtime = item.mtime;

          // return compiled
          return done;
        } catch (e) {
          // log error
          console.log(`Error compiling ${entry}`);
          console.log(e);
        }
      } else {
        // set mtime
        item.lmtime = item.mtime;
      }

      // return null
      return null;
    }))).filter((f) => f);

    // return backend
    const output = compiledFiles.map((entry) => {
      // return riot register
      return `exporting['${entry.name}'] = require('${entry.file}').default; if (exporting['${entry.name}']) { riot.register('${entry.name}', exporting['${entry.name}']); }`;
    }).join(os.EOL);

    // write file
    await fs.remove(`${global.appRoot}/.edenjs/.cache/view.backend.js`);
    await fs.remove(`${global.appRoot}/.edenjs/.cache/view.frontend.js`);

    // write files
    await fs.writeFile(`${global.appRoot}/.edenjs/.cache/view.backend.js`, [
      `const riot = require('@frontless/riot');`,
      'const exporting = {};',
      compiledFiles.map((file) => {
        // require original
        return `exporting['${file.name}'] = require('${file.file}'); riot.register('${file.name}', exporting['${file.name}']);`;
      }).join(os.EOL),
      'module.exports = exporting;',
    ].join(os.EOL));
    await fs.writeFile(`${global.appRoot}/.edenjs/.cache/view.frontend.js`, `${head}${os.EOL}const exporting = {};${os.EOL}${output}${os.EOL}module.exports = exporting;`);

    // write file
    await fs.writeFile(this._cacheFile, JSON.stringify(parsedMap));
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
}

/**
 * Export riot task
 *
 * @type {RiotTask}
 */
module.exports = RiotTask;
