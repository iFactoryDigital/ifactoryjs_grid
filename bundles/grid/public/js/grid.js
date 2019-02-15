
// require event emitter
const qs = require('qs');
const Events = require('events');
const dotProp = require('dot-prop');

// Require live model
const EdenModel = require('model/public/js/model');

/**
 * create grid store
 *
 * @extends Events
 */
class GridStore extends Events {
  /**
   * create grid state
   *
   * @param {Object} grid
   * @param {Object} state
   */
  constructor(grid, frontend) {
    // run super
    super();

    // set variables
    Object.keys(grid).forEach((val) => {
      // set value
      this[`__${val}`] = grid[val];
    });
    this.__update = this.__update.bind(this);
    this.__updates = {};
    this.__frontend = !!frontend;

    // set alter
    if (!this.__alter) {
      // set grid alteration
      this.__alter = {};
    }

    // set rows
    this.__rows = (this.__state || {}).rows;

    // bind methods
    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
    this.build = this.build.bind(this);
    this.update = this.update.bind(this);

    // create query
    this.state = {};

    // loop query methods
    ['Set', 'Get'].forEach((method) => {
      // set in query
      this.state[method.toLowerCase()] = this[`state${method}`].bind(this);
    });

    // create query
    this.alter = {};

    // loop query methods
    ['Set', 'Get'].forEach((method) => {
      // set in query
      this.alter[method.toLowerCase()] = this[`alter${method}`].bind(this);
    });

    // create query
    this.include = {};

    // loop query methods
    ['Set', 'Get'].forEach((method) => {
      // set in query
      this.include[method.toLowerCase()] = this[`include${method}`].bind(this);
    });

    // set building
    this.building = this.build();
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
    /**
     * sets models
     */
    const setModels = () => {
      // remove update listener
      this.__rows.forEach((row) => {
        // remove listener
        if (row.removeListener) row.removeListener('update', this.__update);
      });

      // check model
      if (this.get('model')) {
        // set rows
        this.__rows = this.state.get('rows').map((row) => {
          // create model
          const model = this.__frontend ? eden.model.get(this.get('model'), row._id, row) : new EdenModel(this.get('model'), row._id, row);

          // emit update
          model.on('update', this.__update);

          // Return model
          return model;
        });
      }

      // emit update
      this.emit('update');
    };

    // check if use models
    setModels();

    // on state rows
    this.on('state.rows', setModels);
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
   * get rows
   *
   * @return {Array}
   */
  rows() {
    // return rows
    return this.__rows;
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
  // Update Methods
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * updates grid
   *
   * @param  {Object}
   *
   * @return {Promise}
   */
  async update() {
    // set loading
    this.__loading = true;

    // emit update
    this.emit('update');

    // create query and state
    const query = qs.parse(eden.router.history.location.pathname.split('?')[1] || '') || {};
    const state = Object.assign({}, {
      prevent : true,
    }, eden.router.history.location.state);

    // get id
    if (this.get('id')) {
      // set query
      query[this.get('id')] = Object.assign({}, this.state.get(), {
        rows   : undefined,
        count  : undefined,
        alter  : undefined,
        update : undefined,
      });
    } else {
      // get state
      Object.assign(query, this.state.get(), {
        rows   : undefined,
        count  : undefined,
        alter  : undefined,
        update : undefined,
      });
    }

    // replace history
    eden.router.history.replace({
      state,
      pathname : `${eden.router.history.location.pathname.split('?')[0]}?${qs.stringify(query)}`,
    });

    // log data
    const res = await fetch(this.get('route'), {
      body : JSON.stringify(Object.assign({}, this.state.get(), {
        alter  : this.__alter,
        update : this.__updates,
      }, {
        rows  : undefined,
        count : undefined,
      })),
      method  : 'post',
      headers : {
        'Content-Type' : 'application/json',
      },
      credentials : 'same-origin',
    });

    // load json
    const data = await res.json();

    // set data and state
    Object.keys(data.data).forEach(key => this.set(key, data.data[key]));
    Object.keys(data.state).forEach(key => this.state.set(key, data.state[key]));

    // set includes
    Object.keys(data).filter(key => !['data', 'state'].includes(key)).forEach((key) => {
      // set value
      this[`__${key}`] = data[key];
    });

    // set loading
    this.__loading = false;

    // emit update
    this.emit('update');
  }

  /**
   * updates grid
   *
   * @param  {Object}
   *
   * @return {Promise}
   */
  async export(type) {
    // set loading
    this.__loading = true;

    // emit update
    this.emit('update');

    // get query string
    const qs = require('qs');

    // do request
    eden.router.go(`//${eden.config.domain}${this.get('route')}?${qs.stringify(Object.assign({}, this.state.get(), {
      alter  : this.__alter,
      export : type,
      update : this.__updates,
    }, {
      rows  : undefined,
      count : undefined,
    }))}`);

    // set loading
    this.__loading = false;

    // emit update
    this.emit('update');
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
    this.emit(`state.${key}`, value);

    // check contains parent key
    if (key.includes('.')) {
      // emit parent key
      this.emit(`state.${key.split('.')[0]}`, this.state.get(key.split('.')[0]));
    }

    // return this
    return this;
  }

  // ////////////////////////////////////////////////////////////////////////////
  //
  // Alter methods
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
  alterGet(key, backup) {
    // gets key
    if (!key) return this.__alter;

    // get key from data
    return dotProp.get(this.__alter, key) || (backup ? this.get(key) : undefined);
  }

  /**
   * get value
   *
   * @param  {String} key
   * @param  {*}      value
   *
   * @return {*}
   */
  alterSet(key, value) {
    // get key from data
    dotProp.set(this.__alter, key, value);

    // emit event
    this.emit(`alter.${key}`, value);

    // check contains parent key
    if (key.includes('.')) {
      // emit parent key
      this.emit(`alter.${key.split('.')[0]}`, this.alter.get(key.split('.')[0]));
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
   * @param  {String} from
   * @param  {String} key
   *
   * @return {*}
   */
  includeGet(from, key) {
    // gets key
    if (!key) return this[`__${from}`];

    // get key from data
    return dotProp.get(this[`__${from}`], key);
  }

  /**
   * get value
   *
   * @param  {String} from
   * @param  {String} key
   * @param  {*}      value
   *
   * @return {*}
   */
  includeSet(from, key, value) {
    // get key from data
    dotProp.set(this[`__${from}`], key, value);

    // emit event
    this.emit(`${from}.${key}`, value);

    // check contains parent key
    if (key.includes('.')) {
      // emit parent key
      this.emit(`${from}.${key.split('.')[0]}`, this.include.get(from, key.split('.')[0]));
    }

    // return this
    return this;
  }

  // ////////////////////////////////////////////////////////////////////////////
  //
  // Misc Methods
  //
  // ////////////////////////////////////////////////////////////////////////////

  /**
   * is loading
   *
   * @return {Boolean}
   */
  isLoading() {
    // return is grid loading
    return !!this.__loading;
  }

  /**
   * emits update
   */
  __update() {
    // emit update
    this.emit('update');
  }
}

// create grid store
exports = module.exports = GridStore;
