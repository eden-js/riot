
// Create mixin
riot.mixin('layout', {
  /**
   * On init function
   */
  init() {
    // Set private variables
    this.__init = this.__init || {};

    // Set store
    this.__store = this.__store || require('default/public/js/store'); // eslint-disable-line global-require

    // Clear if not frontend
    if (typeof window === 'undefined' && Object.keys(this.opts).length) this.__store.clear();

    // Check opts
    if (this.opts.state) {
      // Set init
      this.__init = this.opts;

      // Init store
      this.__store.init(this.__init);
    }

    // On mount
    this.on('mount', () => {
      // Check frontend
      if (this.eden.frontend) {
        // Add c;ass
        jQuery(document.querySelector('body').children[0]).addClass('eden-layout');
      }

      // Run route
      this.__route(this.opts);
    });

    // Check for window
    if (!this.eden.frontend) return;

    // Add riotStore listeners
    this.eden.store.on('route', this.__route);

    // On mount
    this.on('unmount', () => {
      // Remove riotStore listeners
      this.eden.store.removeListener('route', this.__route);
    });
  },

  /**
   * On route function
   *
   * @param {Object} opts
   */
  __route(opts) {
    // Reset opts if includes state
    this.state = opts.state ? opts.state : this.state;

    // Check mount
    if (!opts.mount) return this.update();

    // set view
    this.view = 'loading-page';

    // update
    this.update();

    // Set page
    this.view = opts.mount.page;

    // Update view
    return this.update();
  },
});
