
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
    this.buildTag = this.buildTag.bind(this);
    this.buildMount = this.buildMount.bind(this);
    this.buildLayout = this.buildLayout.bind(this);

    // set tags
    this.tags = tags;

    // loop tags
    Object.keys(this.tags).forEach((key) => {
      // register
      riot.register(key, this.tags[key].default || this.tags[key]);
    });

    // Frontend hooks
    store.on('layout', this.buildLayout);
    store.on('initialize', this.buildMount);

    // check environment
    if (store.get('config.environment') !== 'dev') return;

    // Dev hooks
    socket.on('dev:riot', this.buildTag);
  }

  /**
   * Hot reload riot
   *
   * @param {*} data
   */
  buildTag(data) {
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
  buildMount(state) {
    // Replace with
    $(document.querySelector('body').children[0]).replaceWith(document.createElement(document.querySelector('body').children[0].tagName.toLowerCase()));

    // Mount new tag
    riot.mount(document.querySelector('body').children[0], {
      ...state,

      layout : (ref) => {
        this.layout = ref;
      },
    });
  }

  /**
   * Checks for correct layout
   *
   * @param  {Object} state
   *
   * @private
   * @return {Boolean}
   */
  buildLayout(state) {
    // Set layout variable
    const layout = (state.mount.layout || 'main-layout');

    // Get current layout
    const current = document.querySelector('body').children[0];

    // Check if layout needs replacing
    if (this.layout && current.tagName.toLowerCase() === layout.toLowerCase()) {
      // just update mounted
      return this.layout.setProps(state);
    }

    // Unmount tag
    this.layout.unmount(true);

    // Replace with
    $(current).replaceWith(document.createElement(layout));

    // Add class
    $(document.querySelector('body').children[0]).addClass('eden-layout');

    // Mount new tag
    riot.mount(document.querySelector('body').children[0], {
      ...state,

      layout : (ref) => {
        this.layout = ref;
      },
    });

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
