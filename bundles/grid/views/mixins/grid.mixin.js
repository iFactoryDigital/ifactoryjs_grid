
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

    // check frontend
    if (!this.eden.frontend) return;

    // on update
    this.grid.on('update', this.update);

    // on unmount
    this.on('unmount', () => {
      // remove grid listener
      this.grid.removeListener('update', this.update);

      // destroy grid
      this.grid.destroy();
    });
  },
});
