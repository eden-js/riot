
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

    // check props
    if (this.props.layout) {
      this.props.layout(this);
    }

    // build view
    this.__buildView = this.__buildView.bind(this);

    // return build view
    return this.__buildView(...args, 'mount');
  }

  /**
   * on before mount
   */
  onBeforeHydrate(...args) {
    // run super
    super.onBeforeHydrate(...args);

    // check props
    if (this.props.layout) {
      this.props.layout(this);
    }

    // build view
    this.__buildView = this.__buildView.bind(this);

    // return build view
    return this.__buildView(...args, 'mount');
  }

  /**
   * set props
   *
   * @param {*} props
   */
  setProps(props) {
    // build  view
    this.__buildView(props, this.state, 'props');
  }

  /**
   * builds view
   *
   * @param {Object} props
   * @param {Object} state
   */
  __buildView(props, state, type) {
    // current view
    const currentView = this.state.view;

    // Reset opts if includes state
    const newState = props.state ? props.state : this.state;
    newState.view = props.mount.page;

    // complete setup
    const complete = () => {
      // set state
      Object.keys(newState).forEach((key) => {
        state[key] = newState[key];
      });

      // set state
      this.state = state;

      // update
      this.safeUpdate(this.state);
    };

    // check view
    if (!this.state.view || type === 'mount') {
      return complete();
    }

    // check view
    if (currentView !== newState.view) {
      return complete();
    }

    // set state loading
    this.state.view = 'loading-page';

    // update
    this.safeUpdate(this.state);

    // until next tick
    setTimeout(complete, 0);
  }
}

/**
 * layout struct
 */
module.exports = LayoutStruct;
