// Require local class dependencies
const xl       = require('excel4node');
const uuid     = require('uuid');
const Helper   = require('helper');
const moment   = require('moment');
const toText   = require('html-to-text');
const dotProp  = require('dot-prop');
const json2csv = require('json2csv');


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

    // bind export methods
    this._export = this._export.bind(this);
    this._exportCSV = this._exportCSV.bind(this);
    this._exportXLSX = this._exportXLSX.bind(this);

    // create normal methods
    ['id', 'row', 'bar', 'limit', 'page', 'model', 'route', 'models', 'export'].forEach((method) => {
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
        this.__data[method].set(key, Object.assign(item, {
          id       : key,
          priority : item.priority || (100 - (this.get(method) || new Map()).size),
        }));

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
    for (let [key, value] of this.__data.filter) {
      // check value
      if (!value) continue;

      // set key
      key = key.split('__').join('.');

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
    const sort = this.state.get('sort.sort', true) ? this.state.get('sort.sort', true).split('__').join('.') : false;

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
          // set column
          column = column.split('__').join('.');

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
      key : hash,
    }) || new Grid({
      key : hash,
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
              _id : row.get('_id').toString(),
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
        bar    : this.get('bar') !== false,
        row    : this.get('row'),
        model  : this.get('models') ? (new FormModel()).constructor.name.toLowerCase() : undefined,
        route  : this.get('route'),
        column : {},
        filter : {},
      },
      alter : grid.get('alter') || {},
    };

    // get models
    for (let [key, value] of this.get('column')) {
      // set key
      key = key.split('.').join('__');

      // push column
      response.data.column[key] = {
        id       : key,
        tag      : value.tag,
        sort     : !!value.sort,
        meta     : value.meta,
        width    : value.width || false,
        title    : value.title,
        input    : value.input,
        hidden   : value.hidden,
        update   : (value.update || {}).tag,
        priority : value.priority || 0,
      };
    }

    // add filters
    for (let [key, value] of this.get('filter')) {
      // set key
      key = key.split('.').join('__');

      // push column
      response.data.filter[key] = {
        id       : key,
        type     : value.type,
        title    : value.title,
        options  : value.options,
        priority : value.priority || 0,
      };
    }

    // get alters
    this.__merge(response, response.alter);

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
    // check export
    if (req.query.export) {
      // export
      return this._export(req, res, req.query.export.toLowerCase());
    }

    // return json
    res.json(await this.render(req, res));
  }

  // ////////////////////////////////////////////////////////////////////////////
  //
  // Export methods
  //
  // ////////////////////////////////////////////////////////////////////////////


  /**
   * export action
   *
   * @param  {Request}  req
   * @param  {Response} res
   * @param  {String}   type
   *
   * @return {*}
   */
  async _export(req, res, type) {
    // create state
    const state = { ...(req.query || {}), ...(req.body || {}) };

    // get grid element
    const hash = this.get('id') ? this.get('id') : `${req.user ? req.user.get('_id').toString() : req.sessionID}:${this.get('route')}`;
    const grid = await Grid.findOne({
      key : hash,
    }) || new Grid({
      key : hash,
    });

    // await filter and sort
    await this.query.filter();
    await this.query.sort();

    // setup faux response
    const response = {
      data : {
        column : {},
      },
      alter : grid.get('alter') || {},
    };

    // get models
    for (const [key, value] of this.get('column')) {
      // push column
      response.data.column[key] = {
        id       : key,
        hidden   : value.hidden,
        export   : value.export,
        priority : value.priority || 0,
      };
    }

    // get alters
    this.__merge(response, response.alter);

    // get ordered columns
    const orderedColumns = Object.values(response.data.column).sort((a, b) => parseInt(b.priority || 0, 10) - parseInt(a.priority || 0, 10)).filter(col => col.hidden !== true && col.export !== false).map((col) => {
      // return got column
      return this.get('column').get(col.id);
    })
      .filter(col => col);

    // set rows
    const rows = await Promise.all((await this.__query.find()).map(async (row) => {
      // sanitise row
      if (this.get('models')) {
        // return sanitised model
        return Object.assign(await row.sanitise(), {
          _id : row.get('_id').toString(),
        });
      }

      // set result
      const result = {
        _id : row.get('_id').toString(),
      };

      // loop columns
      for (const column of orderedColumns) {
        // get column
        let element = await row.get(column.id);

        // check format
        if (column.export) {
          // set element
          element = await column.export(element, row);
        } else if (column.format) {
          // set element
          element = await column.format(element, row);
        }

        // remove html
        element = toText.fromString(element);

        // return element
        result[column.title] = (element || '').toString();
      }

      // return done row
      return result;
    }));

    // locals
    if (this.get(`export.${type}`)) {
      // add export
      return await this.get(`export.${type}`)(req, res, rows);
    }

    // do actual export
    if (type === 'csv') return this._exportCSV(req, res, rows);
    if (type === 'xlsx') return this._exportXLSX(req, res, rows);

    // return json
    return res.json(await this.render(req, res));
  }

  /**
   * Export CSV
   *
   * @param {Request}  req
   * @param {Response} res
   * @param {Array}    rows
   */
  async _exportCSV(req, res, rows) {
    // create parser
    const Json2csvParser = json2csv.Parser;
    const fields = Object.keys(rows[0]);

    // create new parser
    const json2csvParser = new Json2csvParser({
      fields,
    });
    const csv = json2csvParser.parse(rows);

    // get model
    const FormModel = this.get('model');

    // download csv
    res.set('Content-Type', 'text/csv');
    res.set('Content-Disposition', `attachment; filename=${this.get('id') || (new FormModel()).constructor.name}-${moment().format('DD-MM-YYYY')}.csv`);
    res.status(200);

    // send response
    res.end(csv);
  }

  /**
   * Export XLSX
   *
   * @param {Request}  req
   * @param {Response} res
   * @param {Array}    rows
   */
  async _exportXLSX(req, res, rows) {
    // get model
    const FormModel = this.get('model');

    // create workbook
    const wb = new xl.Workbook();
    const ws = wb.addWorksheet(`${this.get('id') || (new FormModel()).constructor.name}-${moment().format('DD-MM-YYYY')}.csv`);
    const fields = Object.keys(rows[0]);

    // add titles
    fields.forEach((title, i) => {
      ws.cell(1, (i + 1))
        .string(title);
    });

    // loop rows
    rows.forEach((row, i) => {
      // values
      Object.values(row).forEach((col, x) => {
        // create worksheet cell
        ws.cell((i + 2), (x + 1))
          .string(col);
      });
    });

    // set uuid
    const UUID = uuid();

    // write to temp
    await new Promise((resolve, reject) => {
      // write
      wb.write(`/tmp/${UUID}.xlsx`, (err) => {
        // check for error
        if (err) return reject(err);

        // resolve
        resolve();
      });
    });

    // download XLSX
    res.set('Content-Disposition', `attachment; filename=${this.get('id') || (new FormModel()).constructor.name}-${moment().format('DD-MM-YYYY')}.xlsx`);
    res.download(`/tmp/${UUID}.xlsx`);
  }

  // ////////////////////////////////////////////////////////////////////////////
  //
  // MISC methods
  //
  // ////////////////////////////////////////////////////////////////////////////


  /**
   * merge deep
   *
   * @param  {Object} target
   * @param  {Object} source
   *
   * @return {Object}
   */
  __merge(target, source) {
    // check object
    if (this.__object(target) && this.__object(source)) {
      // loop source keys
      Object.keys(source).forEach((key) => {
        // check is object
        if (this.__object(source[key])) {
          // assign empty to target
          if (!target[key]) Object.assign(target, { [key] : {} });

          // merge deep
          this.__merge(target[key], source[key]);
        } else {
          // assign shallow
          Object.assign(target, { [key] : source[key] });
        }
      });
    }
  }

  /**
   * returns true if object is object
   *
   * @param  {*} item
   *
   * @return {Boolean}
   */
  __object(item) {
    // returns true if object
    return (item && typeof item === 'object' && !Array.isArray(item));
  }
}

/**
 * Export new Grid Helper instance
 *
 * @type {GridHelper}
 */
exports = module.exports = GridHelper;
