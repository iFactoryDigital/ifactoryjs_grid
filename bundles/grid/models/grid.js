
// import dependencies
const Model = require('model');

/**
 * create user class
 */
class Grid extends Model {
  /**
   * sanitises placement
   *
   * @return {Promise}
   */
  async sanitise() {
    // return placement
    return {
      id : this.get('_id') ? this.get('_id').toString() : null,
    };
  }
}

/**
 * export user class
 * @type {user}
 */
module.exports = Grid;
