
// import events
const Base = require('./base');

/**
 * export default layout struct
 */
class LayoutStruct extends Base {
  /**
   * on before mount
   */
  onBeforeMount(...args) {
    // run super
    super.onBeforeMount(...args);

    // return build view
    return this.__buildView(...args);
  }

  /**
   * on before mount
   */
  onBeforeHydrate(...args) {
    // run super
    super.onBeforeHydrate(...args);

    // return build view
    return this.__buildView(...args);
  }

  /**
   * set props
   *
   * @param {*} props 
   */
  setProps(props) {
    // build  view
    this.__buildView(props, this.state);

    // do update
    this.update(this.state);
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

    // return true
    return true;
  }
}

/**
 * layout struct
 */
module.exports = LayoutStruct;
