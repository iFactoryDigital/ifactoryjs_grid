<grid>
  <div class={ 'grid' : true, 'loading' : grid.isLoading(), 'aaa' : true }>
    <!-- filters -->
    <div class={ getClass('filters', 'grid-filters') }>
      <div class="row" if={ getVisibleFilters().length }>
        <div class="col-md-3 filter" each={ filter, i in getVisibleFilters() }>
          <div data-is="grid-filter-{ filter.type || 'text' }" filter={ filter } data-value={ grid.state.get('filter.' + filter.id) } grid={ grid } on-filter={ onFilter } />
        </div>
      </div>
    </div>
    <!-- / filters -->

    <!-- settings -->
    <div class={ getClass('settings', 'grid-settings mb-3') } if={ grid.get('bar') }>
      <div class="row row-eq-height">
        <div class="col-md-6 d-flex align-items-center">
          <div class="w-100">
            <yield from="settings-left" />

            <div class="dropright d-inline-block">
              <button class="btn btn-secondary no-caret dropdown-toggle" type="button" id="{ this.uuid }-export" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <i class="fa fa-download" />
              </button>
              <div class="dropdown-menu dropdown-menu-right dropdown-grid-export" aria-labelledby="{ this.uuid }-export">
                <button each={ type, i in this.exports } class={ 'dropdown-item' : true, 'active' : type === this.exporting } onclick={ onExport }>
                  { type }
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="col-md-6 d-flex align-items-center">
          <div class="w-100 text-md-right">
            <yield from="settings-right" />

            <div class="dropdown d-inline-block mr-2">
              <button class="btn btn-secondary dropdown-toggle { 'disabled' : grid.isLoading() }" disabled={ grid.isLoading() } type="button" id="{ this.uuid }-limit" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                Showing: { grid.state.get('limit') }
              </button>
              <div class="dropdown-menu dropdown-menu-right" aria-labelledby="{ this.uuid }-limit">
                <button each={ limit, i in this.limits } class={ 'dropdown-item' : true, 'active' : limit === grid.state.get('limit') } onclick={ onLimit }>
                  { limit }
                </button>
              </div>
            </div>

            <button class="btn btn-secondary mr-2 { 'disabled' : grid.isLoading() }" disabled={ grid.isLoading() } onclick={ grid.update }>
              <i class="fa fa-sync { 'fa-spin' : grid.isLoading() }" />
            </button>

            <div class="dropleft d-inline-block">
              <button class="btn btn-secondary no-caret dropdown-toggle { 'disabled' : grid.isLoading() }" disabled={ grid.isLoading() } type="button" id="{ this.uuid }-settings" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                <i class="fa fa-cog" />
              </button>
              <div class="dropdown-menu dropdown-menu-right dropdown-grid-settings" aria-labelledby="{ this.uuid }-settings">
                <div class="card-body">
                  <b class="d-block">
                    Table Settings
                  </b>
                  <p>
                    <small>Use drag and drop to sort items</small>
                  </p>
                  <hr />
                  <div class="list-group" ref="reorder">
                    <button type="button" each={ column, i in getAllColumns() } class={ 'list-group-item list-group-item-action' : true, 'list-group-item-primary' : !column.hidden } data-column={ column.id } onclick={ onToggleColumn }>
                      { this.t(column.title) }
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    <!-- / settings -->

    <!-- body -->
    <div class={ getClass('body', 'grid-body') }>
      <div if={ grid.get('row') } class={ getClass('rows', 'grid-rows') }>
        <div data-is={ grid.get('row') } each={ row, i in grid.rows() } row={ row } grid={ grid } />
      </div>
      <table if={ !grid.get('row') } class={ getClass('table', 'table table-striped') }>
        <thead>
          <tr>
            <th each={ column, i in getVisibleColumns() } data-column={ i } width={ column.width } no-reorder>
              <a href="#" if={ column.sort } class={ 'pull-right sort' : true, 'text-primary' : isSort(column), 'text-muted' : !isSort(column) } onclick={ onSort }>
                <i class={ 'fa mr-2' : true, 'fa-sort' : !grid.state.get('sort.way') || !isSort(column), 'fa-sort-up' : grid.state.get('sort.way') === 1 && isSort(column), 'fa-sort-down' : grid.state.get('sort.way') === -1 && isSort(column) } />
              </a>
              { this.t(column.title) }
            </th>
          </tr>
        </thead>
        <tbody>
          <tr each={ row, i in grid.rows() } no-reorder>
            <td each={ column, a in getVisibleColumns() } data-row={ grid.get('model') ? row.get('_id') : row._id } data-column={ column.id } onclick={ column.update ? onShouldUpdate : null } class={ 'grid-update' : column.update, 'grid-updating' : isUpdating(row, column) } no-reorder>
              <div if={ isUpdating(row, column) } data-is={ column.update } on-save={ onSave } column={ column } row={ row } column={ column } data-value={ grid.get('model') ? row.get(column.id.split('__').join('.')) : row[column.id.split('__').join('.')] } />

              <div if={ column.tag && !isUpdating(row, column) } class="d-inline-block" data-is={ column.tag } row={ row } column={ column } data-value={ grid.get('model') ? row.get(column.id.split('__').join('.')) : row[column.id.split('__').join('.')] } />
              <raw if={ !column.tag && !isUpdating(row, column) } data={ { 'html' : grid.get('model') ? row.get(column.id.split('__').join('.')) : row[column.id.split('__').join('.')] } } />

              <span if={ column.update && !isUpdating(row, column) } class="grid-update-item float-right">
                <i class="fa fa-ellipsis-h" />
              </span>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <!-- / body -->

    <!-- pagination -->
    <div class={ getClass('pagination', 'grid-pagination') }>
      <div class="row">
        <div class="col-sm-6 d-flex align-items-center">
          <small class="pagination-stats text-muted w-100">
            { this.t('Showing') } { (grid.state.get('page') - 1) * grid.state.get('limit') } - { (grid.state.get('page') * grid.state.get('limit')) > grid.state.get('count') ? grid.state.get('count') : (grid.state.get('page') * grid.state.get('limit')) } { this.t('of') } { grid.state.get('count') }
          </small>
        </div>
        <div class="col-sm-6 d-flex align-items-center">
          <div class="w-100">
            <nav aria-label="Page navigation" class="float-sm-right">
              <div class="btn-group btn-group-sm">
                <a class={ 'btn' : true, 'btn-secondary disabled' : !hasPrev(), 'btn-primary' : hasPrev() } href="#!" aria-label={ this.t('First') } onclick={ onFirst }>
                  { this.t('First') }
                </a>
                <a class={ 'btn' : true, 'btn-secondary disabled' : !hasPrev(), 'btn-primary' : hasPrev() } href="#!" aria-label={ this.t('Previous') } onclick={ onPrev }>
                  { this.t('Previous') }
                </a>
                <a each={ p, i in grid.pages() } class={ 'btn btn-primary' : true, 'active' : grid.state.get('page') === p } href="#!" data-page={ p } onclick={ onPage }>
                  { p }
                </a>
                <a class={ 'btn' : true, 'btn-secondary disabled' : !hasNext(), 'btn-primary' : hasNext() } href="#!" aria-label={ this.t ('Next') } onclick={ onNext }>
                  { this.t('Next') }
                </a>
                <a class={ 'btn' : true, 'btn-secondary disabled' : !hasNext(), 'btn-primary' : hasNext() } href="#!" aria-label={ this.t ('Last') } onclick={ onLast }>
                  { this.t('Last') }
                </a>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </div>
    <!-- / pagination -->
  </div>

  <script>
    // Add mixins
    this.mixin('i18n');
    this.mixin('grid');
    this.mixin('model');

    // require uuid
    const uuid = require('uuid');

    // set updating
    this.uuid       = uuid();
    this.limits     = [20, 40, 60, 80, 100];
    this.exports    = ['CSV', 'XLSX'];
    this.__updating = new Map();

    /**
     * gets class
     *
     * @param  {String} type
     * @param  {*}      d
     *
     * @return {*}
     */
    getClass(type, d) {
      // return opts or default
      return opts[`${type}Class`] || d;
    }

    /**
     * gets visible column
     *
     * @return {Array}
     */
    getVisibleColumns() {
      // return visible column
      return Object.values(this.grid.get('column')).filter((col) => !col.hidden && col.title).sort((a, b) => parseInt(b.priority || 0) - parseInt(a.priority || 0));
    }

    /**
     * gets all column
     *
     * @return {Array}
     */
    getAllColumns() {
      // return visible column
      return Object.values(this.grid.get('column')).filter((col) => col.title).sort((a, b) => parseInt(b.priority || 0) - parseInt(a.priority || 0));
    }

    /**
     * gets visible column
     *
     * @return {Array}
     */
    getVisibleFilters() {
      // return visible column
      return Object.values(this.grid.get('filter')).filter((col) => !col.hidden).sort((a, b) => parseInt(b.priority || 0) - parseInt(a.priority || 0));
    }

    /**
     * gets all column
     *
     * @return {Array}
     */
    getAllFilters() {
      // return visible column
      return Object.values(this.grid.get('filter')).sort((a, b) => parseInt(b.priority || 0) - parseInt(a.priority || 0));
    }

    /**
     * Return is column currently sorted
     *
     * @return {boolean}
     */
    isSort(column) {
      // Return boolean
      return !!(this.grid.state.get('sort.sort') === column.id);
    }

    /**
     * returns is loading
     *
     * @param  {Object}  column
     * @param  {Object}  row
     *
     * @return {Boolean}
     */
    isUpdating(row, column) {
      // return has
      return this.__updating.has((this.grid.get('model') ? row.get('_id') : row._id) + ':' + column.id);
    }

    /**
     * Return has previous page
     *
     * @return {boolean}
     */
    hasPrev() {
      // return page greater
      return this.grid.state.get('page') > 1;
    }

    /**
     * Return has next page
     *
     * @return {boolean}
     */
    hasNext() {
      // return page less
      return this.grid.state.get('page') < (Math.floor(this.grid.state.get('count') / this.grid.state.get('limit')) + 1);
    }

    /**
     * init dragula
     */
    initDragula () {
      // require dragula
      const dragula = require('dragula');

      // do dragula
      this.dragula = dragula([this.refs.reorder]).on('drop', (el, target, source, sibling) => {
        // child nodes total
        const total = this.refs.reorder.childNodes.length;

        // get order
        this.refs.reorder.childNodes.forEach((child, i) => {
          // check get attribute
          if (!child || !child.getAttribute) return;

          // get column
          const id = child.getAttribute('data-column');

          // find column
          this.grid.alter.set(`data.column.${id}.priority`, total - i);
        });

        // set alter
        Object.values(this.grid.get('column')).forEach((col) => {
          // set priority
          col.priority = this.grid.alter.get(`data.column.${col.id}.priority`);
        });

        // update grid
        this.grid.update();
      });

      // on update
      this.on('updated', () => {
        // set containers
        this.dragula.containers = [this.refs.reorder];
      });
    }

    /**
     * on hide column
     *
     * @param  {Event} e
     *
     * @return {*}
     */
    onToggleColumn(e) {
      // prevent scrolling to top
      e.preventDefault();
      e.stopPropagation();

      // toggle column hidden
      e.item.column.hidden = !e.item.column.hidden;

      // set in grid
      this.grid.alter.set(`data.column.${e.item.column.id}`, {
        hidden : e.item.column.hidden
      });

      // update grid
      this.grid.update();
    }

    /**
     * on limit
     *
     * @param  {Event} e
     *
     * @return {*}
     */
    onLimit(e) {
      // prevent scrolling to top
      e.preventDefault();
      e.stopPropagation();

      // set limit
      this.grid.state.set('limit', e.item.limit);

      // log
      this.grid.update();
    }

    /**
     * on limit
     *
     * @param  {Event} e
     *
     * @return {*}
     */
    async onExport(e) {
      // prevent scrolling to top
      e.preventDefault();
      e.stopPropagation();

      // set loading
      this.exporting = e.item.type;

      // update
      this.update();

      // export
      await this.grid.export(this.exporting);

      // set loading
      this.exporting = null;

      // log
      this.update();
    }

    /**
     * on save
     *
     * @param  {Object} row
     * @param  {Object} column
     * @param  {*}      value
     *
     * @return {*}
     */
    async onSave(row, column, value) {
      // set updates
      this.grid.include.set('updates', `${(this.grid.get('model') ? row.get('_id') : row._id)}.${column.id}`, value);

      // log
      await this.grid.update();

      // remove state loading
      this.shouldntUpdate(row, column);
    }

    /**
     * on should update
     *
     * @param  {Event} e
     */
    onShouldUpdate(e) {
      // get th
      const td = jQuery(e.target).is('td') ? jQuery(e.target) : jQuery(e.target).closest('td');

      // get column
      const column = this.grid.get(`column.${td.attr('data-column')}`);

      // return true
      if (!column.update) return true;

      // prevent scrolling to top
      e.preventDefault();
      e.stopPropagation();

      // set updating
      this.__updating.set(td.attr('data-row') + ':' + column.id, true);

      // update
      this.update();
    }

    /**
     * on should update
     *
     * @param  {Event} e
     */
    shouldntUpdate(row, column) {
      // set updating
      this.__updating.delete((this.grid.get('model') ? row.get('_id') : row._id) + ':' + column.id);

      // update
      this.update();
    }

    /**
     * on sort function
     *
     * @param {Event} e
     */
    onSort(e) {
      // prevent scrolling to top
      e.preventDefault();
      e.stopPropagation();

      // get link
      const sort = this.grid.state.get('sort');
      const column = e.item.column;

      // check for id
      if (column.id === sort.sort) {
        // set asc or desc
        sort.way = sort.way === false ? -1 : (sort.way === -1 ? 1 : false);
      } else {
        // set sort
        sort.way = -1;
      }

      // set sort
      sort.sort = column.id;

      // sort grid
      this.grid.set('sort', sort);
      this.grid.update();
    }

    /**
     * on filter function
     *
     * @param  {Event} e
     */
    onFilter(filter, value) {
      // set filter
      this.grid.state.set(`filter.${filter.id}`, value);

      // update view
      this.grid.update();
    }

    /**
     * on pagination click function
     *
     * @param  {Event} e
     */
    onPage(e) {
      // prevent scrolling to top
      e.preventDefault();
      e.stopPropagation();

      // get page
      this.grid.state.set('page', e.target.dataset.page);

      // update view
      this.grid.update();
    }

    /**
     * on next click function
     */
    onLast(e) {
      // prevent scrolling to top
      e.preventDefault();
      e.stopPropagation();

      // get page
      this.grid.state.set('page', Math.floor(this.grid.state.get('count') / this.grid.state.get('limit')) + 1);

      // update view
      this.grid.update();
    }

    /**
     * on previous click function
     */
    onFirst(e) {
      // prevent scrolling to top
      e.preventDefault();
      e.stopPropagation();

      // get page
      this.grid.state.set('page', 1);

      // update view
      this.grid.update();
    }

    /**
     * on next click function
     */
    onNext(e) {
      // prevent scrolling to top
      e.preventDefault();
      e.stopPropagation();

      // get page
      this.grid.state.set('page', this.hasNext() ? (this.grid.state.get('page') + 1) : this.grid.state.get('page'));

      // update view
      this.grid.update();
    }

    /**
     * on previous click function
     */
    onPrev(e) {
      // prevent scrolling to top
      e.preventDefault();
      e.stopPropagation();

      // get page
      this.grid.state.set('page', this.hasPrev() ? (this.grid.state.get('page') - 1) : 1);

      // update view
      this.grid.update();
    }

    /**
     * on mount function
     */
    this.on('mount', () => {
      // check frontend
      if (!this.eden.frontend) return;

      // init dragula
      this.initDragula();
    });

  </script>
</grid>
