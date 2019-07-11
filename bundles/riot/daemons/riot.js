
// Require dependencies
const path   = require('path');
const render = require('@riotjs/ssr');
const Daemon = require('daemon');


/**
 * Build riot dameon class
 */
class RiotDaemon extends Daemon {
  /**
   * Construct riot daemon class
   *
   * @param {eden} eden
   */
  constructor() {
    // Run super
    super();

    // bind methods
    this.email = this.email.bind(this);
    this.render = this.render.bind(this);

    console.log(render);

    // Require tags
    //require('cache/emails'); // eslint-disable-line global-require

    // On render
    if (this.eden.router) {
      // require tags for router threads
      this.components = require('cache/view.backend.js'); // eslint-disable-line global-require

      // add pre for router only threads
      this.eden.pre('view.compile', (r) => {
        // Alter mount page
        // eslint-disable-next-line no-param-reassign
        r.mount.page = r.mount.page.includes('views') ? `${r.mount.page.split('views')[1].substr(path.sep.length).split(path.sep).join('-').trim()
          .replace('.tag', '')}-page` : r.mount.page;

        // Alter mount layout
        // eslint-disable-next-line no-param-reassign
        r.mount.layout = r.mount.layout.includes('-layout') ? r.mount.layout : `${r.mount.layout}-layout`;
      });

      // set view for router threads
      this.eden.view = this.render;
    }

    // Set eden view
    this.eden.email = this.email;
  }

  /**
   * Renders page view
   *
   * @param {Options} opts
   *
   * @return {String}
   */
  async render(opts) {
    // Render page
    return await render.default(opts.mount.layout, this.components[opts.mount.layout].default, opts);
  }

  /**
   * Render email template
   *
   * @param  {String} template
   * @param  {Options} options
   *
   * @return Promise
   */
  async email(template, opts) {
    // Return render
    return await render.default(`${template}-email`, this.components[`${template}-email`].default, opts);
  }
}

/**
 * Export riot daemon class
 *
 * @type {RiotDaemon}
 */
module.exports = RiotDaemon;
