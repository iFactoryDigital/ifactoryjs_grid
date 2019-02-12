// Require local class dependencies
const Helper = require('helper');

/**
 * Create Grid Helper class
 */
class GridHelper extends Helper {
  /**
   * Construct Grid Helper class
   *
   * @param {object} options
   */
  constructor(options) {
    // Run super
    super();

    // Bind public methods
    this.data = this.data.bind(this);
    this.type = this.type.bind(this);
    this.rows = this.rows.bind(this);
    this.live = this.live.bind(this);
    this.page = this.page.bind(this);
    this.post = this.post.bind(this);
    this.sort = this.sort.bind(this);
    this.model = this.model.bind(this);
    this.query = this.query.bind(this);
    this.route = this.route.bind(this);
    this.filter = this.filter.bind(this);
    this.render = this.render.bind(this);
    this.querySort = this.querySort.bind(this);

    // Bind private methods
    this._bind = this._bind.bind(this);

    // Set default options
    options = options || {};

    // Set private variables
    this._id = options.id || false;
    this._way = options.way || false;
    this._rows = options.rows || 20;
    this._type = options.type || 'columns';
    this._live = options.live || false;
    this._page = options.page || 1;
    this._sort = options.sort || false;
    this._model = options.model || false;
    this._where = options.where || this._model;
    this._route = options.route || '';
    this._filter = options.filter || {};
    this._filters = options.filters || {};
    this._columns = options.columns || {};

    // Run bind
    this._bind();
  }

  /**
   * Set model
   *
   * @param  {*} id
   *
   * @return {GridHelper}
   */
  id(id) {
    // Set model
    this._id = id;

    // Allow chainable
    return this;
  }

  /**
   * Set rows
   *
   * @param  {*} rows
   *
   * @return {GridHelper}
   */
  rows(rows) {
    // Set rows
    this._rows = rows;

    // Allow chainable
    return this;
  }

  /**
   * Set type
   *
   * @param  {*} type
   *
   * @return {GridHelper}
   */
  type(type) {
    // Set type
    this._type = type;

    // Allow chainable
    return this;
  }

  /**
   * Set live
   *
   * @param  {boolean} live
   *
   * @return {GridHelper}
   */
  live(live) {
    // Set live
    this._live = live;

    // Allow chainable
    return this;
  }

  /**
   * Set page
   *
   * @param  {*} page
   *
   * @return {GridHelper}
   */
  page(page) {
    // Set page
    this._page = page;

    // Allow chainable
    return this;
  }

  /**
   * Set sort
   *
   * @param  {string} sort
   * @param  {number} way
   *
   * @return {GridHelper}
   */
  sort(sort, way) {
    // Set way and sort
    this._way = way;
    this._sort = sort;

    // Allow chainable
    return this;
  }

  /**
   * Set model
   *
   * @param  {*} model
   *
   * @return {GridHelper}
   */
  model(model) {
    // Set model
    this._model = model;

    // Run model bind
    this._bind();

    // Allow chainable
    return this;
  }

  /**
   * Set model
   *
   * @param  {*} form
   *
   * @return {GridHelper}
   */
  form(form) {
    // Set model
    this._form = form;

    // Allow chainable
    return this;
  }

  /**
   * Set route
   *
   * @param  {string} route
   *
   * @return {GridHelper}
   */
  route(route) {
    // Set route
    this._route = route;

    // Allow chainable
    return this;
  }

  /**
   * Returns filtered query
   *
   * @return {Promise}
   *
   * @async
   */
  async query() {
    // Check filters
    await Promise.all(Object.keys(this._filter).map(async (filter) => {
      // Check filter exists
      if (!this._filters[filter]) {
        return;
      }

      // Check if filter has query
      if (this._filters[filter].query) {
        // Run query
        await this._filters[filter].query(this._filter[filter]);
      } else {
        // Run and
        this.where(filter, this._filter[filter]);
      }
    }));

    // Return this
    return this;
  }

  /**
   * Returns sorted query
   *
   * @return {Promise}
   *
   * @async
   */
  async querySort() {
    // Check sort
    if (this._sort && this._columns[this._sort] && this._columns[this._sort].sort && this._way !== false) {
      // Check type
      if (typeof this._columns[this._sort].sort === 'function') {
        // Set sort
        this._where = await this._columns[this._sort].sort(this._where, this._way);
      } else if (this._columns[this._sort].sort === true) {
        // Set sort directly
        this._where = this._where.sort(this._sort, this._way);
      }
    } else if (this._sort && this._way !== false) {
      // Set sort directly
      this._where = this._where.sort(this._sort, this._way);
    }

    // Allow chainable
    return this;
  }

  /**
   * Add filter
   *
   * @param  {string} key
   * @param  {*}      filter
   *
   * @return {GridHelper}
   */
  filter(key, filter) {
    // Set filter
    this._filters[key] = filter;

    // Allow chainable
    return this;
  }

  /**
   * Add column
   *
   * @param  {string} key
   * @param  {*}      column
   *
   * @return {GridHelper}
   */
  column(key, column) {
    // Set column
    this._columns[key] = column;

    // Allow chainable
    return this;
  }

  /**
   * Runs post request
   *
   * @param {Request}  req
   * @param {Response} res
   */
  async post(req, res) {
    // Check updates
    if (req.body.updates) {
      // do updates
      await this.updates(req.body.updates);
    }

    // Check rows
    if (req.body.rows) {
      // set rows
      this._rows = parseInt(req.body.rows, 10);
    }

    // Check page
    if (req.body.page) {
      // set page
      this._page = parseInt(req.body.page, 10);
    }

    // Check sort
    if (req.body.sort) {
      // set sort
      this._sort = req.body.sort;
    }

    // Set way
    this._way = req.body.way;

    // Check filter
    if (req.body.filter) {
      // create filter
      Object.keys(req.body.filter).forEach((key) => {
        // Check value
        if (!req.body.filter[key].length && !Object.keys(req.body.filter[key]).length) {
          return;
        }

        // Set filter
        this._filter[key] = req.body.filter[key];
      });
    }

    // Send result
    res.json(await this.render());
  }

  /**
   * Get updates
   *
   * @param  {Object} updates
   *
   * @return {Promise}
   */
  async updates(updates) {
    // Loop keys
    await Promise.all(Object.keys(updates).map(async (id) => {
      // Get id
      const row = await this._model.findById(id);

      // Loop columns
      await Promise.all(Object.keys(updates[id]).map(async (column) => {
        // Check columns
        if (!this._columns[column] || !this._columns[column].update) {
          return;
        }

        // Update
        await this._columns[column].update(row, updates[id][column]);
      }));
    }));
  }

  /**
   * Exports columns
   *
   * @param  {array}  rows
   * @param  {string} type
   *
   * @return {Promise}
   */
  data(rows, type) {
    // Check type
    if (this._type !== 'columns') {
      // Return sanitised
      return Promise.all(rows.map((row) => {
        return row.sanitise();
      }));
    }
    // Return map
    return Promise.all(rows.map(async (row) => {
      // Set sanitised
      const sanitised = {};

      // Loop columns
      await Promise.all(Object.keys(this._columns).map(async (column) => {
        // Check if column export
        if (typeof this._columns[column].type !== 'undefined' && type !== this._columns[column].type) return;

        // Load column
        let load = await row.get(column);

        // Check format
        if (this._columns[column].format) {
          // set load
          load = await this._columns[column].format(load, row, type);
        }

        // Set to sanitised
        sanitised[column] = (load || '').toString();
      }));

      // Set id row
      sanitised._id = row.get('_id').toString();

      // Return sanitised
      return sanitised;
    }));
  }

  /**
   * Runs post request
   *
   * @param  {Request}  req
   * @param  {string}   type
   *
   * @return {Promise}
   *
   * @async
   */
  async export(req, type) {
    // Check order
    if (req.body.sort) this._sort = req.body.sort;

    // Set way
    this._way = req.body.way;

    // Check where
    if (req.body.filter) {
      // create filter
      Object.keys(req.body.filter).forEach((key) => {
        // Set filter
        this._filter[key] = req.body.filter[key];
      });
    }

    // Run query
    await this.query();

    // Return result
    return await this.data(await this._where.find(), type);
  }

  /**
   * renders form changes
   *
   * @param  {Form}    form
   * @param  {Object}  response
   *
   * @return {Promise}
   */
  async formRender(form, response) {
    console.log(form.toString());
  }

  /**
   * Renders grid view
   *
   * @param {Request} req
   *
   * @return {*}
   *
   * @async
   */
  async render(req) {
    // set body
    const body = req ? (this._id && req.query[this._id] ? req.query[this._id] : req.query) : {};

    // Check rows
    if (body.rows) {
      // set rows
      this._rows = parseInt(body.rows, 10);
    }

    // Check page
    if (body.page) {
      // set page
      this._page = parseInt(body.page, 10);
    }

    // Check order
    if (body.sort) {
      // set sort
      this._sort = body.sort;
    }

    // Set way
    if (body.way) {
      // set way
      this._way = (body.way === 'false' ? false : parseInt(body.way, 10));
    }

    // Check filter
    if (body.filter) {
      // create filter
      Object.keys(body.filter).forEach((key) => {
        // Check value
        if (!body.filter[key].length || !Object.keys(body.filter[key]).length) {
          return;
        }

        // Set filter
        this._filter[key] = body.filter[key];
      });
    }

    // Set response
    const response = {
      data    : [],
      filter  : this._filter,
      filters : [],
      columns : [],
    };

    // Set standard vars
    response.id = this._id;
    response.way = this._way;
    response.page = this._page;
    response.rows = this._rows;
    response.sort = this._sort;
    response.live = this._live;
    response.type = this._type;
    response.route = this._route;

    // Do query
    await this.query();

    // Set total
    response.total = await this._where.count();

    // Do query
    await this.querySort();

    // get values
    if (this._form) {
      // do logic
      await this.formRender(this._form, response);
    }

    // Complete query
    const rows = await this._where.skip(this._rows * (this._page - 1)).limit(this._rows).find();

    // Get data
    response.data = await this.data(rows, false);

    // Check type columns
    if (this._type === 'columns') {
      // Loop columns
      Object.keys(this._columns).forEach((col) => {
        // Push into columns
        response.columns.push({
          id     : col,
          sort   : !!this._columns[col].sort,
          meta   : this._columns[col].meta,
          width  : this._columns[col].width || false,
          title  : this._columns[col].title,
          input  : this._columns[col].input,
          update : !!this._columns[col].update,
        });
      });
    }

    // Loop filters
    Object.keys(this._filters).forEach((filter) => {
      // Push into filters
      response.filters.push({
        id      : filter,
        type    : this._filters[filter].type,
        ajax    : this._filters[filter].ajax,
        title   : this._filters[filter].title,
        socket  : this._filters[filter].socket,
        options : this._filters[filter].options,
      });
    });

    // Return response
    return response;
  }

  /**
   * Binds model
   */
  _bind() {
    // Check model
    if (!this._model) return;

    // Check where
    if (!this._where) this._where = this._model;

    // Bind query methods
    ['where', 'match', 'eq', 'ne', 'or', 'and', 'elem', 'in', 'nin', 'gt', 'lt', 'gte', 'lte'].forEach((method) => {
      // Create new function
      this[method] = (...args) => {
        // Set where
        return this._where = this._where[method](...args);
      };
    });
  }
}

/**
 * Export new Grid Helper instance
 *
 * @type {GridHelper}
 */
exports = module.exports = GridHelper;
