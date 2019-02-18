<grid-update-text>
  <div class="row">
    <div class="col">
      <div class="form-group m-0">
        <input type="text" class="form-control" ref="input" value={ opts.dataValue } />
      </div>
    </div>
    <div class="col-2 pl-0">
      <button class={ 'btn btn-block btn-success' : true, 'loading' : this.loading } onclick={ onSave } disabled={ this.loading }>
        <i class="fa { this.loading ? 'fa-spinner fa-spin' : 'fa-check' }" />
      </button>
    </div>
  </div>

  <script>

    /**
     * on save
     *
     * @param  {Event} e
     *
     * @return {*}
     */
    onSave(e) {
      // prevent default
      e.preventDefault();
      e.stopPropagation();
      
      // set loading
      this.loading = true;
      
      // update view
      this.update();
      
      // save
      if (opts.onSave) opts.onSave(opts.row, opts.column, this.refs.input.value);
    }
  </script>
</grid-update-text>
