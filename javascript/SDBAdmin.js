
(function($){
    if(!$.NinjaSDB){
        $.NinjaSDB = {};
    }
    
    $.NinjaSDB.SDBAdmin = function(el, options){
        var base = this;
        base.$el = $(el);
        base.el = el;
        base.$el.data("NinjaSDB.SDBAdmin", base);
				base.domainListScaffolding = $('<div id="' + base.el.id + 'DomainList"></div>');
				base.itemListScaffolding = $('<div id="' + base.el.id + 'ItemList"></div>');

        base.init = function(){
          base.options = $.extend({},$.NinjaSDB.SDBAdmin.defaultOptions, options);
					base.$el.append(base.domainListScaffolding);
					base.$el.append(base.itemListScaffolding);
					base.DomainList = $('#' + base.el.id + 'DomainList').NinjaSDB_DomainList();
					base.ItemList = $('#' + base.el.id + 'ItemList').NinjaSDB_ItemList();
					
					$($('#' + base.el.id + 'DomainList').getNinjaSDB_DomainList()).bind('DomainChanged', function(eventObj, data) {
						$('#' + base.el.id + 'ItemList').getNinjaSDB_ItemList().getItems(data.NewDomainName);
					});
					$.NinjaSDB.ListDomains().bind('ListDomainsResponseReceived', function(ev,o) {
						$('#' + base.el.id + 'DomainList').getNinjaSDB_DomainList().populateDomainList(o.AWSResponse.ListDomainsResponse.ListDomainsResult.DomainName);
					});
	      };
        base.init();
    };
    
    $.NinjaSDB.SDBAdmin.defaultOptions = {
			//none
    };
    
    $.fn.NinjaSDB_SDBAdmin = function(options){
      return this.each(function(){
          (new $.NinjaSDB.SDBAdmin(this, options));
      });
    };
    
    $.fn.getNinjaSDB_SDBAdmin = function(){
       return this.data("NinjaSDB.SDBAdmin");
    };
    
})(jQuery);

$('#se').NinjaSDB_SDBAdmin();

