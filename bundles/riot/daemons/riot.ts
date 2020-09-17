
// Require dependencies
import riot      from '@frontless/riot';
import Daemon    from 'daemon';
import { JSDOM } from 'jsdom';
import mjml2html from 'mjml';


/**
 * Build riot dameon class
 * 
 * @cluster all
 */
export default class RiotDaemon extends Daemon {
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

    // Require tags
    // require('cache/emails'); // eslint-disable-line global-require

    // On render
    if (this.eden.router) {
      // require tags for router threads
      this.emails = require(`.edenjs/.cache/email.backend.js`); // eslint-disable-line global-require
      this.components = require(`.edenjs/.cache/view.backend.js`); // eslint-disable-line global-require

      // add pre for router only threads
      this.eden.pre('view.compile', ({ render }) => {
        // Alter mount page
        // eslint-disable-next-line no-param-reassign
        render.mount.page = `${render.mount.page}-page`.split('/').join('-');

        // Alter mount layout
        // eslint-disable-next-line no-param-reassign
        render.mount.layout = (render.mount.layout.includes('-layout') ? render.mount.layout : `${render.mount.layout}-layout`).split('/').join('-');
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
    // view name
    const viewName = opts.mount.layout || 'main-layout';

    // create window
    const { document, Node } = new JSDOM().window;

    // create root
    const root = document.createElement(viewName);

    // return result
    await riot.di({ document, Node }).mount(root, Object.assign({}, {
      isBackend : true,
    }, opts), viewName);

    // return html
    return root.outerHTML;
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
    // base
    let base = await this.render(Object.assign({}, {
      mount : {
        layout : `${template}-email`,
      },
      isBackend : true,
    }, opts));

    // remove all tags
    ['div', ...(Object.keys(this.emails)), ...(Object.keys(this.components))].forEach((key) => {
      // split/join
      base = base.split(`<${key}>`).join('').split(`</${key}>`).join('');
    });

    // rendered
    const rendered = mjml2html(`<mjml>${base}</mjml>`, {
      validationLevel : 'strict',
    });

    // Return render
    return rendered.html;
  }
}