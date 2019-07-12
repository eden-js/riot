
// import events
const Events = require('events');
const dotProp = require('dot-prop');
const EdenStore = require('default/public/js/store');

/**
 * export default layout struct
 */
class EdenBaseStruct extends Events {
  /**
   * construct default layout struct
   */
  constructor() {
    // run super
    super();

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
      backend  : (typeof window === 'undefined'),
      frontend : (typeof window !== 'undefined'),
    };
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
    // check frontend
    if (typeof window === 'undefined') {
      // get props
      return dotProp.get(this.__root().props, key);
    }

    // Return value
    return EdenStore.get(key);
  }

  /**
   * Eden Get
   *
   * @param {String} key 
   * @param {*} value
   */
  edenSet(key, value) {
    // check frontend
    if (typeof window === 'undefined') {
      // get props
      return dotProp.set(this.__root().props, key, value);
    }

    // Return value
    return EdenStore.set(key, value);
  }
}

/**
 * layout struct
 */
module.exports = EdenBaseStruct;
