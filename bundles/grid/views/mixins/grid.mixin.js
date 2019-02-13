
// create mixin
riot.mixin('grid', {
  /**
   * on init function
   */
  init() {
    // set this store
    const Grid = require('grid/public/js/grid');

    // on update
    this.grid = new Grid(this.opts.grid, this.eden.frontend);

    // on update
    this.grid.on('update', this.update);
  },
});
