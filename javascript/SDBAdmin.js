/**
 * SimpleDbAdmin - SDBAdmin.php
 * 
 * The entrypoint and traffic manager for the SimpleDbAdmin JavaScript components.
 * 
 * Implemented as a JQuery plug-in.  Requires JQuery.
 * 
 * @author Jay Muntz
 * 
 * Copyright 2010 Jay Muntz (http://www.awsninja.com)
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * "Software"), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 * 
 *
 */

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

