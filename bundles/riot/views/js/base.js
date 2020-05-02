
// import events
const Events = require('events');
const dotProp = require('dot-prop');
const EdenStore = require('core/public/js/store');

// add to window
if (typeof window !== 'undefined') {
  // set store
  window.eden = EdenStore;
}

/**
 * export default layout struct
 */
class EdenBaseStruct extends Events {
  onMounted() {
    // check mounted
    this.mounted = true;

    // unmount
    this.emit('mount', true);

    // props ref
    if (this.props.ref && typeof this.props.ref === 'function') {
      // set ref
      this.props.ref(this);
    }

    // do refs
    this.$$('[ref]').forEach((ref) => {
      // set to refs
      if (!ref.getAttribute('ref').includes('that.refs')) this.refs[ref.getAttribute('ref')] = ref;
    });
  }

  onUpdated() {
    // unmount
    this.emit('update', true);

    // do refs
    this.$$('[ref]').forEach((ref) => {
      // set to refs
      if (!ref.getAttribute('ref').includes('that.refs')) this.refs[ref.getAttribute('ref')] = ref;
    });
  }

  onBeforeHydrate() {}

  onBeforeUnmount() {
    // check mounted
    this.mounted = false;

    // unmount
    this.emit('unmount', true);
  }

  /**
   * on before mount
   */
  onBeforeMount(props = {}, state = {}) {
    // check props
    if (props.isBackend) {
      // set
      Object.keys(props).forEach((prop) => {
        // set
        EdenStore.set(prop, props[prop]);
      });

      // helpers
      if (props.helpers) {
        // helper
        Object.keys(props.helpers).forEach((helper) => {
          // set
          EdenStore.set(helper, props.helpers[helper]);
        });
      }
    }

    // replace update
    this.safeUpdate = (...args) => {
      if (this.mounted) this.update(...args);
    };
    this.safeUpdate = this.safeUpdate.bind(this);

    // setup eden
    this.eden = {
      on   : this.edenOn.bind(this),
      get  : this.edenGet.bind(this),
      set  : this.edenSet.bind(this),
      root : this.edenRoot.bind(this),
      
      /**
       * remove
       */
      removeListener         : this.edenRemoveListener.bind(this),
      edenRemoveAllListeners : this.edenRemoveAllListeners.bind(this),

      /**
       * Helper methods
       */
      user  : this.edenGet('user'),
      page  : this.edenGet('page'),
      mount : this.edenGet('mount'),

      /**
       * Sets eden store
       */
      store : EdenStore,

      /**
       * Sets frontend/backend value
       */
      backend  : !!this.edenGet('isBackend'),
      frontend : !this.edenGet('isBackend'),
    };

    // bind all default methods
    this.ref = this.ref.bind(this);
    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
    this.loading = this.loading.bind(this);

    // set refs
    this.refs = this.refs || {};

    // props
    this.state = state;

    // create loading
    this.__loading = new Map();

    // props ref
    if (props.ref && typeof props.ref === 'function') {
      // set ref
      props.ref(this);
    }
  }

  /**
   * on before mount
   */
  onBeforeUpdate(props, state) {
    // props
    this.state = state;

    // props ref
    if (props.ref && typeof props.ref === 'function') {
      // set ref
      props.ref(this);
    }
  }

  // HELPER METHODS

  /**
   * Create ref callback function
   *
   * @param {String} type
   */
  ref(type) {
    // that
    const that = this;

    // return created fucntion
    return (ref) => {
      // set ref
      that.refs[type] = ref;
    };
  }

  /**
   * Get method
   *
   * @param {String} key
   * @param {*} default
   */
  get(key, def) {
    // gets from props
    let got = dotProp.get(this.props, key);

    // check state now
    if (typeof got === 'undefined') got = dotProp.get(this.state, key);

    // check default
    if (typeof got === 'undefined' && typeof def !== 'undefined') {
      // set
      return this.set(key, def, true);
    }

    // return got value
    return got;
  }

  /**
   * Get method
   *
   * @param {String} key
   * @param {*} value
   */
  set(key, value, noUpdate) {
    // gets from props
    this.state = dotProp.set(this.state, key, value);

    // update view
    if (!noUpdate) this.update();

    // return value
    return value;
  }

  /**
   * classes
   *
   * @param {Object} classes
   */
  classes(classes) {
    // entries
    return Object.entries(classes).reduce((acc, item) => {
      // key/value
      const [key, value] = item;

      // check value
      if (value) return [...acc, key];

      // return accumulated
      return acc;
    }, []).join(' ');
  }

  /**
   * classes
   *
   * @param {Object} classes
   */
  attributes(attributes) {
    // entries
    return Object.entries(attributes).reduce((acc, item) => {
      // key/value
      const [key, value] = item;

      // check value
      if (value) acc[key] = value;

      // return accumulated
      return acc;
    }, {});
  }

  /**
   * does loading
   *
   * @param {String} type
   * @param {Boolean} way
   */
  loading(type, way) {
    // return loading size
    if (!type && !way) return this.__loading.size;
    if (typeof way === 'undefined') return this.__loading.get(type);

    // set loading
    if (way) {
      this.__loading.set(type, way);
    } else {
      this.__loading.delete(type);
    }

    // do update
    this.update();

    // return new loading state
    return this.__loading.get(type);
  }

  // EDEN METHODS

  /**
   * Returns parent
   *
   * @private
   */
  edenRoot() {
    // Check parent
    if (this.__root) return this.__root;

    // Get main parent
    let parent  = this;
    let nparent = this.parent;

    // Loop for main parent
    while (nparent) {
      parent = nparent;
      nparent = parent.parent;
    }

    // Set root
    this.__root = parent;

    // Return parent
    return parent;
  }

  /**
   * Eden Get
   */
  edenOn(...args) {
    // Return value
    return EdenStore.on(...args);
  }

  /**
   * Eden Get
   */
  edenGet(...args) {
    // Return value
    return EdenStore.get(...args);
  }

  /**
   * Eden Set
   */
  edenSet(...args) {
    // Return value
    return EdenStore.set(...args);
  }

  /**
   * Eden Set
   */
  edenRemoveListener(...args) {
    // Return value
    return EdenStore.removeListener(...args);
  }

  /**
   * Eden Set
   */
  edenRemoveAllListeners(...args) {
    // Return value
    return EdenStore.removeAllListeners(...args);
  }
}

/**
 * layout struct
 */
module.exports = EdenBaseStruct;
