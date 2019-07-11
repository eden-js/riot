
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

    this.onBeforeMount = this.onBeforeMount.bind(this);
  }

  /**
   * on before mount
   */
  onBeforeMount(props, state) {
    // Reset opts if includes state
    this.state = props.state ? props.state : this.state;

    // set view
    this.state.view = props.mount.page;
  }
}

/**
 * layout struct
 */
module.exports = LayoutStruct;
