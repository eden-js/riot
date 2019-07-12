
// import events
const Events = require('events');
const dotProp = require('dot-prop');
const EdenStore = require('default/public/js/store');

/**
 * export default layout struct
 */
class EdenBaseStruct extends Events {
  
  /**
   * on before mount
   */
  onBeforeMount() {
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
    // store
    if ((this.eden || {}).store) {
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
    if ((this.eden || {}).store) {
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
