// import babel
const babel = require('@babel/core');

/**
 * Build riot task class
 *
 * @task     riot
 * @parent   javascript
 * @priority 1000
 */
export default class RiotTask {
  /**
   * Construct riot task class
   *
   * @param {gulp} gulp
   */
  constructor(cli) {
    // Set private variables
    this.cli = cli;

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
    // set opts
    const opts = {
      files      : files.reverse(),
      babel      : require.resolve('@babel/core'),
      appRoot    : global.appRoot,
      include    : this.cli.get('config.frontend.riot.include', []) || {},
      compiler   : require.resolve('@riotjs/compiler'),
      cachePath  : this._cachePath,
      cacheFile  : this._cacheFile,
      sourceMaps : this.cli.get('config.environment') === 'dev',
    };

    // return runner
    const count = await this.cli.thread(this.thread, opts, false, async (c) => {
      // changed
      if (this.cli.get('config.environment') === 'dev') {
        // notice that buble.transform returns {code, map}
        c.code = (await babel.transform(c.code, {
          sourceMaps  : false,
          retainLines : true,
          presets     : [[
            '@babel/env',
            {
              targets : {
                esmodules : true,
              },
            },
          ]],
        })).code;

        // emit hot reload
        this.cli.emit('hot', 'riot', c);
      }
    });

    // return counted
    return `${count.toLocaleString()} riot files compiled!`;
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
    const { camelCase } = require('lodash');

    // require dependencies
    const { compile } = require(data.compiler);

    // Create header
    let head          = ['// AUTOMATICALLY GENERATED EDENJS VIEW ENGINE //', '', 'const exporting = {};'];
    const { include } = data;

    // Loop include
    include.forEach((key) => {
      // push require head
      head.push(`import * as ${key} from '${key}';`);
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

          // push to changed
          emitEvent({
            code,
            ...done,
          });

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

    // return backend
    const output = [...(compiledFiles.map((entry) => {
      // import component
      return `import ${camelCase(entry.name)} from '${entry.file}';`;
    })), ...(compiledFiles.map((entry) => {
      // export tag
      return `exporting['${entry.name}'] = ${camelCase(entry.name)};`;
    })), ...(compiledFiles.map((entry) => {
      // register component
      return `riot.register('${entry.name}', ${camelCase(entry.name)});`;
    }))].join(os.EOL);

    // write file
    await fs.remove(`${data.appRoot}/.edenjs/.cache/view.backend.js`);
    await fs.remove(`${data.appRoot}/.edenjs/.cache/view.frontend.ts`);

    // write files
    await fs.writeFile(`${data.appRoot}/.edenjs/.cache/view.backend.js`, [
      'const riot = require(\'@frontless/riot\');',
      'const exporting = {};',
      compiledFiles.map((file) => {
        // require original
        return `exporting['${file.name}'] = require('${file.file}'); riot.register('${file.name}', exporting['${file.name}']);`;
      }).join(os.EOL),
      'module.exports = exporting;',
    ].join(os.EOL));
    await fs.writeFile(`${data.appRoot}/.edenjs/.cache/view.frontend.js`, `${head}${os.EOL}${output}${os.EOL}export default exporting;`);

    // write file
    await fs.writeFile(data.cacheFile, JSON.stringify(parsedMap));

    // return
    return compiledFiles.length;
  }

  /**
   * Watch task
   *
   * @return {Array}
   */
  watch () {
    // Return files
    return '/views/**/*.{riot,js,ts}';
  }
}