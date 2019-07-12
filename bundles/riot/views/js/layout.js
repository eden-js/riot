
// import events
const Base = require('./base');

/**
 * export default layout struct
 */
class LayoutStruct extends Base {
  /**
   * construct default layout struct
   */
  constructor() {
    // run super
    super();

  }

  /**
   * on before mount
   */
  onBeforeMount(...args) {
    // return build view
    return this.__buildView(...args);
  }

  /**
   * on before mount
   */
  onBeforeUpdate(...args) {
    // return build view
    return this.__buildView(...args);
  }

  /**
   * on before mount
   */
  onBeforeHydrate(...args) {
    // return build view
    return this.__buildView(...args);
  }

  /**
   * builds view
   *
   * @param {Object} props 
   * @param {Object} state 
   */
  __buildView(props, state) {
    // Reset opts if includes state
    const newState = props.state ? props.state : this.state;
    newState.view = props.mount.page;

    // set state
    Object.keys(newState).forEach((key) => {
      state[key] = newState[key];
    });

    // set state
    this.state = state;
    this.props = props;
  }
}

/**
 * layout struct
 */
module.exports = LayoutStruct;
