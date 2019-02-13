
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
  constructor(data, state, frontend) {
    // run super
    super();

    // set variables
    this.__data = data;
    this.__state = state;
    this.__updates = {};
    this.__frontend = !!frontend;

    // bind methods
    this.get = this.get.bind(this);
    this.set = this.set.bind(this);
    this.build = this.build.bind(this);

    // create query
    this.state = {};

    // loop query methods
    ['Set', 'Get'].forEach((method) => {
      // set in query
      this.state[method.toLowerCase()] = this[`state${method}`].bind(this);
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
      // get rows
      if (this.get('model')) {
        // set rows
        this.state.set('rows', this.state.get('rows').map((row) => {
          // create model
          const model = new EdenModel(this.get('model'), row._id, row);

          // Return model
          return model;
        }));

        // emit update
        this.emit('update');
      }
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
        rows  : undefined,
        count : undefined,
      });
    } else {
      // get state
      Object.assign(query, this.state.get(), {
        rows  : undefined,
        count : undefined,
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
}

// create grid store
exports = module.exports = GridStore;
