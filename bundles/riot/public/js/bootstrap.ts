
// Require local dependencies
import store from 'core/public/js/store';
import socket from 'socket/public/js/bootstrap';
import reload from '@riotjs/hot-reload';
import hydrate from '@riotjs/hydrate';
import * as riot from 'riot';
import { EventEmitter } from 'events';

// import shims
import shimBase from '.edenjs/.riot/js/base';
import shimUser from '.edenjs/.riot/js/user';
import shimModel from '.edenjs/.riot/js/model';
import shimLayout from '.edenjs/.riot/js/layout';

// Require tags
import tags from '.edenjs/.cache/view.frontend';

// shim required
const shimRequired = {};

// require default bases
shimRequired['/js/base'] = shimBase;
shimRequired['/js/user'] = shimUser;
shimRequired['/js/model'] = shimModel;
shimRequired['/js/layout'] = shimLayout;

// Add riot to window
window.riot = riot;

/**
 * Build riot frontend class
 */
class RiotFrontend extends EventEmitter {
  /**
   * Construct riot frontend
   */
  constructor(...args) {
    // Run super
    super(...args);

    // Bind methods
    this._hot = this._hot.bind(this);
    this._mount = this._mount.bind(this);
    this._layout = this._layout.bind(this);

    // set tags
    this._tags = tags;

    // loop tags
    Object.keys(tags).forEach((key) => {
      // register
      riot.register(key, tags[key].default || tags[key]);
    });

    // Frontend hooks
    store.on('layout', this._layout);
    store.on('initialize', this._mount);

    // check environment
    if (store.get('config.environment') !== 'dev') return;

    // Dev hooks
    socket.on('dev:riot', this._hot);
  }

  /**
   * Hot reload riot
   *
   * @param {*} data
   */
  _hot(data) {
    // check change
    eden.alert.info(`Reloading ${data.file}`);

    // try/catch
    try {
      // replace require
      window.shimRequire = (str) => {
        // try/catch
        try {
          // return require
          return require(str);
        } catch (e) {}

        // check str
        if (Object.keys(shimRequired).find((s) => str.includes(s))) {
          // return shimmed
          return shimRequired[Object.keys(shimRequired).find((s) => str.includes(s))];
        }

        // throw error
        throw new Error('cannot find shim file to require');
      };

      // eval component
      const Component = eval(data.code.split('require(').join('shimRequire('));

      // reload component
      reload.default(Component);

      // check change
      eden.alert.success(`Reloaded ${data.file}`);
    } catch (e) {
      // log error
      console.log(e);

      // check change
      eden.alert.error('Refreshing with change');

      // can't reload automatically
      setTimeout(() => window.location.reload(), 5000);
    }
  }

  /**
   * Mounts frontend
   *
   * @param {Object} state
   */
  _mount(state) {
    // base
    const base = tags[document.querySelector('body').children[0].tagName.toLowerCase()];
    
    // create hydrated
    const createHydrated = hydrate(base.default || base);

    // Mount riot tag
    this._mounted = createHydrated(document.querySelector('body').children[0], state);
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
      // just update mounted
      return this._mounted.setProps(state);
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

// export default
export default window.eden.riot;
