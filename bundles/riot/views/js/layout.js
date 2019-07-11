
// import events
const Events = require('events');

/**
 * export default layout struct
 */
class LayoutStruct extends Events {
  /**
   * construct default layout struct
   */
  constructor() {
    // run super
    super();

    // bind before mount
    this.onBeforeMount = this.onBeforeMount.bind(this);
    this.onBeforeHydrate = this.onBeforeHydrate.bind(this);
  }

  /**
   * on before mount
   */
  onBeforeMount(props, state) {
    // Reset opts if includes state
    const newState = props.state ? props.state : this.state;
    newState.view = props.mount.page;

    // set state
    Object.keys(newState).forEach((key) => {
      state[key] = newState[key];
    });
  }

  /**
   * on before mount
   */
  onBeforeHydrate(props, state) {
    // Reset opts if includes state
    const newState = props.state ? props.state : this.state;
    newState.view = props.mount.page;

    // set state
    Object.keys(newState).forEach((key) => {
      state[key] = newState[key];
    });
  }
}

/**
 * layout struct
 */
module.exports = LayoutStruct;
