// require dependencies
const babel  = require('@babel/core');
const config = require('config');

/**
 * Build email task class
 *
 * @task     emails
 * @priority 1
 */
class RiotTask {
  /**
   * Construct email task class
   *
   * @param {gulp} gulp
   */
  constructor(runner) {
    // Set private variables
    this._runner = runner;

    // set cache file
    this._cacheFile = `${global.appRoot}/.edenjs/.cache/riot-email.json`;
    this._cachePath = `${global.appRoot}/.edenjs/.riot-email`;

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
    // set opts
    const opts = {
      files,

      babel    : require.resolve('@babel/core'),
      include  : config.get('view.include') || {},
      compiler : require.resolve('@riotjs/compiler'),

      appRoot : global.appRoot,

      cachePath  : this._cachePath,
      cacheFile  : this._cacheFile,
      sourceMaps : config.get('environment') === 'dev' && !config.get('noSourcemaps'),
    };

    // return runner
    await this._runner.thread(this.thread, opts, false, async (c) => {
      // notice that buble.transform returns {code, map}
      c.code = (await babel.transform(c.code, {
        sourceMaps     : false,
        // notice that whitelines should be preserved
        retainLines    : true,
        presets        : [[
          '@babel/env',
          {
            targets : {
              esmodules : true,
            },
          },
        ]],
      })).code;

      // changed
      this._runner.emit('riot.hot', c);
    });
  }

  /**
   * Run riot task
   *
   * @return {Promise}
   */
  async thread(data, emitEvent) {
    // Require dependencies
    const fs   = require('fs-extra');
    const os   = require('os');
    const glob = require('@edenjs/glob');
    const path = require('path');

    // require dependencies
    const { compile } = require(data.compiler);

    // Create header
    let head          = ['// AUTOMATICALLY GENERATED EDENJS VIEW ENGINE //', '', 'const exporting = {};'];
    const { include } = data;

    // Loop include
    Object.keys(include).forEach((key) => {
      // push require head
      head.push(`const ${key} = require('${include[key]}');`);
    });

    // join head
    head = head.join(os.EOL);

    // await cache riot
    await fs.ensureDir(data.cachePath);

    // create map
    const parsedMap = await fs.exists(data.cacheFile) ? JSON.parse(await fs.readFile(data.cacheFile, 'utf8')) : {};
    const mappedFiles = await glob(data.files);

    // loop map
    mappedFiles.forEach((item) => {
      // add to parsed map
      let amended = item.replace(/\\/g, '/').split('bundles/');

      // stat sync
      const stat = fs.statSync(item);

      // Correct path
      amended = amended.pop();
      amended = amended.split('emails');
      amended.shift();
      amended = amended.join('emails');

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
      if (await fs.exists(`${data.cachePath}${item.id}`) && item.lmtime === item.mtime) {
        // return item
        return item.file;
      }

      // move to path
      await fs.copy(item.path, `${data.cachePath}${item.id}`);

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
          await fs.ensureDir(path.dirname(`${data.cachePath}${item.id}`));

          // remove old files
          await fs.remove(`${data.cachePath}${item.id}.js`);
          await fs.remove(`${data.cachePath}${item.id}.map`);

          // write compiled
          await fs.writeFile(`${data.cachePath}${item.id}.js`, code);
          await fs.writeFile(`${data.cachePath}${item.id}.map`, JSON.stringify(map));

          // split
          const split = code.split(os.EOL);

          // done
          const done = {
            orig : item.path,
            name : split[split.length - 2].split("'")[3], // todo this sucks
            file : `${data.cachePath}${item.id}.js`,
          };

          // done
          item.file = done;

          // set mtime
          item.lmtime = item.mtime;

          // return compiled
          return done;
        } catch (e) {
          // log error
          console.log(`Error compiling ${item.id}`);
          console.log(e);
        }
      } else {
        // set mtime
        item.lmtime = item.mtime;
      }

      // return null
      return null;
    }))).filter(f => f);

    // write file
    await fs.remove(`${data.appRoot}/.edenjs/.cache/email.backend.js`);

    // write files
    await fs.writeFile(`${data.appRoot}/.edenjs/.cache/email.backend.js`, [
      'const riot = require(\'@frontless/riot\');',
      'const exporting = {};',
      compiledFiles.map((file) => {
        // require original
        return `exporting['${file.name}'] = require('${file.file}'); riot.register('${file.name}', exporting['${file.name}']);`;
      }).join(os.EOL),
      'module.exports = exporting;',
    ].join(os.EOL));

    // write file
    await fs.writeFile(data.cacheFile, JSON.stringify(parsedMap));

    // return
    return true;
  }

  /**
   * Watch task
   *
   * @return {Array}
   */
  watch() {
    // Return files
    return ['emails/js/**/*', 'emails/**/*.riot'];
  }
}

/**
 * Export riot task
 *
 * @type {RiotTask}
 */
module.exports = RiotTask;
