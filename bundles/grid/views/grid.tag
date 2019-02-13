<grid>
  <div class={ 'grid' : true, 'loading' : grid.isLoading() }>
    <div class="row filters" if={ grid.get('filters').length }>
      <div class="col-md-3 filter form-group" each={ filter, i in grid.get('filters') }>
        <div data-is="grid-filter-{ filter.type || 'text' }" filter={ filter } data-value={ grid.state.get('filter.' + filter.id) } grid={ grid } on-filter={ onFilter } />
      </div>
    </div>
    <div if={ grid.get('row') } class={ getClass('rows', 'grid-rows') }>
      <div data-is={ grid.get('row') } each={ row, i in grid.rows() } row={ row } grid={ grid } />
    </div>
    <table if={ !grid.get('row') } class={ getClass('table', 'table table-striped') }>
      <thead>
        <tr>
          <th each={ column, i in grid.get('columns') } data-column={ i } width={ column.width } no-reorder>
            <a href="#" if={ column.sort } class={ 'pull-right sort' : true, 'text-primary' : isSort(column), 'text-muted' : !isSort(column) } onclick={ onSort }>
              <i class={ 'fa mr-2' : true, 'fa-sort' : !grid.state.get('sort.way') || !isSort(column), 'fa-sort-up' : grid.state.get('sort.way') === 1 && isSort(column), 'fa-sort-down' : grid.state.get('sort.way') === -1 && isSort(column) } />
            </a>
            { this.t(column.title) }
          </th>
        </tr>
      </thead>
      <tbody>
        <tr each={ row, i in grid.rows() } no-reorder>
          <td each={ column, a in grid.get('columns') } data-index={ i } data-column={ column.id } onclick={ onOpenUpdate } class={ 'grid-update' : column.update } no-reorder>
            <div if={ column.tag } data-is={ column.tag } row={ row } column={ column } data-value={ grid.get('model') ? row.get(column.id) : row[column.id] } />
            <raw if={ !column.tag } data={ { 'html' : grid.get('model') ? row.get(column.id) : row[column.id] } } />
          </td>
        </tr>
      </tbody>
    </table>
    <div class="row">
      <div class="col-sm-6">
        <small class="pagination-stats text-muted">
          { this.t('Showing') } { (grid.state.get('page') - 1) * grid.state.get('limit') } - { (grid.state.get('page') * grid.state.get('limit')) > grid.state.get('total') ? grid.state.get('total') : (grid.state.get('page') * grid.state.get('limit')) } { this.t('of') } { grid.state.get('total') }
        </small>
      </div>
      <div class="col-sm-6">
        <nav aria-label="Page navigation" class="float-sm-right">
          <ul class="pagination pagination-sm">
            <li class={ 'page-item' : true, 'disabled' : !hasPrev() }>
              <a class="page-link" href="#!" aria-label={ this.t('First') } onclick={ onFirst }>
                { this.t('First') }
              </a>
            </li>

            <li class={ 'page-item' : true, 'disabled' : !hasPrev() }>
              <a class="page-link" href="#!" aria-label={ this.t('Previous') } onclick={ onPrev }>
                { this.t('Previous') }
              </a>
            </li>

            <li each={ p, i in this.pages } class={ 'page-item' : true, 'active' : grid.state.get('page') === p }>
              <a class="page-link" href="#!" data-page={ p } onclick={ onPage }>{ p }</a>
            </li>

            <li class={ 'page-item' : true, 'disabled' : !hasNext() }>
              <a class="page-link" href="#!" aria-label={ this.t ('Next') } onclick={ onNext }>
                { this.t('Next') }
              </a>
            </li>

            <li class={ 'page-item' : true, 'disabled' : !hasNext() }>
              <a class="page-link" href="#!" aria-label={ this.t ('Last') } onclick={ onLast }>
                { this.t('Last') }
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  </div>

  <script>
    // Add mixins
    this.mixin('i18n');
    this.mixin('grid');
    this.mixin('model');
    
    // set grid
    if (this.eden.frontend) window.builtGrid = this.grid;
    
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
     * Return is column currently sorted
     *
     * @return {boolean}
     */
    isSort(column) {
      // Return boolean
      return !!(this.grid.state.get('sort.sort') === column.id);
    }
    
    /**
     * Return has previous page
     *
     * @return {boolean}
     */
    hasPrev () {
      // return page greater
      return this.grid.state.get('page') > 1;
    }

    /**
     * Return has next page
     *
     * @return {boolean}
     */
    hasNext () {
      // return page less
      return this.grid.state.get('page') < (Math.floor(this.grid.state.get('total') / this.grid.state.get('limit')) + 1);
    }

    /**
     * on sort function
     *
     * @param {Event} e
     */
    onSort (e) {
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
      this.grid.state.set('page', Math.floor(this.grid.state.get('total') / this.grid.state.get('limit')) + 1);

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
    
  </script>
</grid>
