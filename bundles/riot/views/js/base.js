
// import events
const Events = require('events');
const dotProp = require('dot-prop');
const EdenStore = require('default/public/js/store');

/**
 * export default layout struct
 */
class EdenBaseStruct extends Events {
  onMounted() {}

  onUpdated() {}

  onBeforeHydrate() {}

  onBeforeUnmount() {}

  /**
   * on before mount
   */
  onBeforeMount(props, state) {
    // setup eden
    this.eden = {
      get  : this.edenGet.bind(this),
      set  : this.edenSet.bind(this),
      root : this.edenRoot.bind(this),

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
      backend  : props.isBackend,
      frontend : !props.isBackend,
    };

    // bind all default methods
    this.ref = this.ref.bind(this);
    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
    this.loading = this.loading.bind(this);

    // set refs
    this.refs = new Map();

    // props
    this.props = props;
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
    this.props = props;
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
    // return created fucntion
    return (ref) => {
      // set ref
      this.refs[type] = ref;
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
   *
   * @param {String} key
   */
  edenGet(key) {
    // store
    if ((this.eden || {}).frontend) {
      // Return value
      return this.eden.store.get(key);
    }

    // get props
    return dotProp.get(this.edenRoot().props, key);
  }

  /**
   * Eden Get
   *
   * @param {String} key
   * @param {*} value
   */
  edenSet(key, value) {
    // check frontend
    if ((this.eden || {}).frontend) {
      // Return value
      return this.eden.store.set(key, value);
    }

    // get props
    return dotProp.set(this.edenRoot().props, key, value);
  }
}

/**
 * layout struct
 */
module.exports = EdenBaseStruct;
