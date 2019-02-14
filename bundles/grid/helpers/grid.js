// Require local class dependencies
const Helper  = require('helper');
const dotProp = require('dot-prop');

// require models
const Grid = model('grid');

/**
 * Create Grid Helper class
 */
class GridHelper extends Helper {
  /**
   * Construct Grid Helper class
   *
   * @param {Object} opts
   */
  constructor(opts) {
    // Run super
    super();

    // set data
    this.__data = opts || {};
    this.__state = {
      sort   : {},
      filter : {},
    };
    this.__include = {};

    // bind methods
    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
    this.post = this.post.bind(this);
    this.build = this.build.bind(this);
    this.render = this.render.bind(this);

    // create normal methods
    ['id', 'row', 'limit', 'page', 'model', 'route', 'models'].forEach((method) => {
      // do methods
      this[method] = (item) => {
        // set data method
        this.__data[method] = item;

        // set model
        if (method === 'model') this.building = this.build();

        // return this
        return this;
      };
    });

    // set sort
    this.sort = (sort, way) => {
      // add sort
      this.state.set('sort.sort', sort);
      this.state.set('sort.way', way);

      // return this
      return this;
    };

    // set include
    this.include = (obj) => {
      // assign
      this.__include = Object.assign(this.__include, obj);

      // return this
      return this;
    };

    // create map methods
    ['column', 'filter'].forEach((method) => {
      // do methods
      this[method] = (key, item) => {
        // set data method
        if (!this.__data[method]) {
          // set map
          this.__data[method] = new Map();
        }

        // set in map
        this.__data[method].set(key, item);

        // return this
        return this;
      };
    });

    // create query
    this.state = {};

    // loop query methods
    ['Set', 'Get'].forEach((method) => {
      // set in query
      this.state[method.toLowerCase()] = this[`state${method}`].bind(this);
    });

    // create query
    this.query = {};

    // loop query methods
    ['Filter', 'Sort', 'Execute'].forEach((method) => {
      // set in query
      this.query[method.toLowerCase()] = this[`query${method}`].bind(this);
    });

    // build
    if (this.__data.model) this.building = this.build();
  }

  // ////////////////////////////////////////////////////////////////////////////
  //
  // Build Methods
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * build logic
   *
   * @return {*}
   */
  build() {
    // Check model
    if (this.__data.model) {
      // set where
      this.__query = this.__data.model;

      // Bind query methods
      ['where', 'match', 'eq', 'ne', 'or', 'and', 'elem', 'in', 'nin', 'gt', 'lt', 'gte', 'lte'].forEach((method) => {
        // Create new function
        this[method] = (...args) => {
          // Set where
          return this.__query = this.__query[method](...args);
        };
      });
    }
  }

  // ////////////////////////////////////////////////////////////////////////////
  //
  // Get/Set methods
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * get value
   *
   * @param  {String} key
   *
   * @return {*}
   */
  get(key) {
    // gets key
    if (!key) return this.__data;

    // get key from data
    return dotProp.get(this.__data, key);
  }

  /**
   * get value
   *
   * @param  {String} key
   * @param  {*}      value
   *
   * @return {*}
   */
  set(key, value) {
    // get key from data
    dotProp.set(this.__data, key, value);

    // emit event
    this.emit(key, value);

    // check contains parent key
    if (key.includes('.')) {
      // emit parent key
      this.emit(key.split('.')[0], this.get(key.split('.')[0]));
    }

    // return this
    return this;
  }

  // ////////////////////////////////////////////////////////////////////////////
  //
  // State methods
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * get value
   *
   * @param  {String}  key
   * @param  {Boolean} backup
   *
   * @return {*}
   */
  stateGet(key, backup) {
    // gets key
    if (!key) return this.__state;

    // get key from data
    return dotProp.get(this.__state, key) || (backup ? this.get(key) : undefined);
  }

  /**
   * get value
   *
   * @param  {String} key
   * @param  {*}      value
   *
   * @return {*}
   */
  stateSet(key, value) {
    // get key from data
    dotProp.set(this.__state, key, value);

    // emit event
    this.emit(key, value);

    // check contains parent key
    if (key.includes('.')) {
      // emit parent key
      this.emit(key.split('.')[0], this.get(key.split('.')[0]));
    }

    // return this
    return this;
  }

  // ////////////////////////////////////////////////////////////////////////////
  //
  // Query methods
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * Returns filtered query
   *
   * @returns {GridHelper}
   */
  async queryFilter() {
    // await query
    if (!this.__data.filter) {
      // set map
      this.__data.filter = new Map();
    }

    // loop while
    for (const [key, value] of this.__data.filter) {
      // check value
      if (!value) continue;

      // do filter
      if (!this.state.get(`filter.${key}`)) continue;

      // if query
      if (value.query) {
        // do query
        await value.query(this.state.get(`filter.${key}`));
      } else {
        // Run and
        this.where(key, this.state.get(`filter.${key}`));
      }
    }
  }

  /**
   * Returns sorted query
   *
   * @return {Promise}
   */
  async querySort() {
    // await query
    if (!this.__data.column) {
      // set map
      this.__data.column = new Map();
    }

    // loop while
    const way = this.state.get('sort.way') === 'false' || this.state.get('sort').way === false ? false : parseInt((this.state.get('sort.way', true) || -1), 10);
    const sort = this.state.get('sort.sort', true) ? this.state.get('sort.sort', true) : false;

    // set sort
    if (sort && way !== false) {
      // check column has sort function
      if (this.get('column').get(sort)) {
        // check column
        if (this.get('column').get(sort).sort === true) {
          // sort
          this.__query = this.__query.sort(sort, way);
        } else {
          // await sort function
          await this.get('column').get(sort).sort(this.__query, way);
        }
      } else {
        // do normal sort
        this.__query = this.__query.sort(sort, way);
      }
    }

    // Allow chainable
    return {
      way,
      sort,
    };
  }

  /**
   * Returns queried rows
   *
   * @return {Promise}
   */
  async queryExecute() {
    // await filter and sort
    await this.query.filter();
    const sort = await this.query.sort();

    // create result
    const result = {
      sort,
      count : await this.__query.count(),
    };

    // add extra result logic
    result.limit = parseInt((this.state.get('limit', 20) || 20), 10);
    result.page = parseInt((this.state.get('page', true) || 1), 10);
    result.skip = result.limit * (result.page - 1);

    // add rows
    result.rows = await this.__query.skip(result.skip).limit(result.limit).find();

    // return rows
    return result;
  }

  // ////////////////////////////////////////////////////////////////////////////
  //
  // Render methods
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * renders page
   *
   * @param  {Request} req
   *
   * @return {*}
   */
  async render(req) {
    // create state
    const state = { ...(req.query || {}), ...(req.body || {}) };

    // set state
    Object.keys(state).forEach(key => this.state.set(key, state[key]));

    // check for digested updates
    if (state.update) {
      // do updates
      await Promise.all(Object.keys(state.update).map(async (id) => {
        // get row
        const row = await this.get('model').findById(id);

        // Loop columns
        await Promise.all(Object.keys(state.update[id]).map(async (column) => {
          // Check columns
          if (!this.get('column').get(column) || !this.get('column').get(column).update) return;

          // Update
          await this.get('column').get(column).update.submit(req, row, state.update[id][column]);
        }));
      }));
    }

    // get grid element
    const hash = this.get('id') ? this.get('id') : `${req.user ? req.user.get('_id').toString() : req.sessionID}:${this.get('route')}`;
    const grid = await Grid.findOne({
      key : hash
    }) || new Grid({
      key : hash
    });

    // check alters
    if (state.alter) {
      // set alters
      grid.set('alter', state.alter);

      // save grid if usr
      if (req.user) {
        // save grid
        await grid.save();
      }
    }

    // execute query
    const {
      page,
      rows,
      sort,
      limit,
      count,
    } = await this.query.execute();

    // get model
    const FormModel = this.get('model');

    // create response object
    const response = {
      state : Object.assign({}, this.state.get(), {
        page,
        sort,
        limit,
        count,
        rows : await Promise.all(rows.map(async (row) => {
          // sanitise row
          if (this.get('models')) {
            // return sanitised model
            return Object.assign(await row.sanitise(), {
              _id : row.get('_id').toString()
            });
          }

          // set result
          const result = {
            _id : row.get('_id').toString(),
          };

          // loop columns
          for (const [key, value] of this.get('column')) {
            // check column
            if (!this.get('column').has(key)) continue;

            // get column
            let element = await row.get(key);

            // check format
            if (value.format) element = await value.format(element, row);

            // return element
            result[key] = (element || '').toString();
          }

          // return done row
          return result;
        })),
      }),
      data : {
        id     : this.get('id'),
        row    : this.get('row'),
        model  : this.get('models') ? (new FormModel()).constructor.name.toLowerCase() : undefined,
        route  : this.get('route'),
        column : {},
        filter : {},
      },
      alter : grid.get('alter') || {},
    };

    // get models
    for (const [key, value] of this.get('column')) {
      // push column
      response.data.column[key] = {
        id       : key,
        tag      : value.tag,
        sort     : !!value.sort,
        meta     : value.meta,
        width    : value.width || false,
        title    : value.title,
        input    : value.input,
        update   : (value.update || {}).tag,
        priority : value.priority || 0,
      };
    }

    // add filters
    for (const [key, value] of this.get('filter')) {
      // push column
      response.data.filter[key] = {
        id       : key,
        type     : value.type,
        title    : value.title,
        options  : value.options,
        priority : value.priority || 0,
      };
    }

    // is object
    const isObject = (item) => {
      // returns true if object
      return (item && typeof item === 'object' && !Array.isArray(item));
    };

    // merge
    const mergeDeep = (target, source) => {
      // check object
      if (isObject(target) && isObject(source)) {
        // loop source keys
        Object.keys(source).forEach((key) => {
          // check is object
          if (isObject(source[key])) {
            // assign empty to target
            if (!target[key]) Object.assign(target, { [key] : {} });

            // merge deep
            mergeDeep(target[key], source[key]);
          } else {
            // assign shallow
            Object.assign(target, { [key] : source[key] });
          }
        });
      }
    };

    // get alters
    mergeDeep(response, response.alter);

    // add include
    Object.keys(this.__include).forEach((key) => {
      // add to include
      response[key] = this.__include[key];
    });

    // return response
    return response;
  }


  /**
   * Runs post request
   *
   * @param {Request}  req
   * @param {Response} res
   */
  async post(req, res) {
    // return json
    res.json(await this.render(req, res));
  }
}

/**
 * Export new Grid Helper instance
 *
 * @type {GridHelper}
 */
exports = module.exports = GridHelper;
