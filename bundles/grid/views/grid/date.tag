<grid-date>
  <span>
    <span if={ opts.dataValue }>{ getDate(opts.dataValue) }</span>
    <i if={ !opts.dataValue }>N/A</i>
  </span>
  <script>
    // require moment
    const moment = require('moment');
    
    /**
     * get date
     *
     * @param  {Date} date
     *
     * @return {*}
     */
    getDate(date) {
      // return date
      if ((opts.column.meta || {}).fromNow) {
        // set from
        return moment(date).fromNow();
      }
      
      // return moment format
      return moment(date).format((opts.column.meta || {}).format || 'LLL');
    }
  </script>
</grid-date>
