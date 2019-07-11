
// Require local dependencies
const riot   = require('riot');
const store  = require('default/public/js/store');
const events = require('events');

// Add riot to window
window.riot = riot;

// Require tags
require('cache/view.frontend.js');

/**
 * Build riot frontend class
 */
class RiotFrontend extends events {
  /**
   * Construct riot frontend
   */
  constructor(...args) {
    // Run super
    super(...args);

    // Bind methods
    this._mount = this._mount.bind(this);
    this._layout = this._layout.bind(this);

    // Frontend hooks
    store.on('layout', this._layout);
    store.on('initialize', this._mount);
  }

  /**
   * Mounts frontend
   *
   * @param {Object} state
   */
  _mount(state) {
    // Mount riot tag
    [this._mounted] = riot.mount(document.querySelector('body').children[0], state, document.querySelector('body').children[0].tagName.toLowerCase());
  }

  /**
   * Checks for correct layout
   *
   * @param  {Object} state
   *
   * @private
   * @return {Boolean}
   */
  _layout(state) {
    // Set layout variable
    const layout = (state.mount.layout || 'main-layout');

    // Get current layout
    const current = document.querySelector('body').children[0];

    // Check if layout needs replacing
    if (current.tagName.toLowerCase() === layout.toLowerCase()) {
      return false;
    }

    // Unmount tag
    this._mounted.unmount(true);

    // Replace with
    jQuery(current).replaceWith(document.createElement(layout));

    // Add class
    jQuery(document.querySelector('body').children[0]).addClass('eden-layout');

    // Mount new tag
    [this._mounted] = riot.mount(document.querySelector('body').children[0], state);

    // Mounted true
    state.mounted = true; // eslint-disable-line no-param-reassign

    // Return null
    return null;
  }
}

/**
 * Export new riot frontend function
 *
 * @return {RiotFrontend}
 */
window.eden.riot = new RiotFrontend();
module.exports = window.eden.riot;
