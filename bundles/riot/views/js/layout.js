
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

    console.log('sup');
  }
}

/**
 * layout struct
 */
module.exports = LayoutStruct;
