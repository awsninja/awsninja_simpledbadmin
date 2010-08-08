/**
 * SimpleDbAdmin - DomainList.php
 * 
 * Displays and allows manipulation of AWS SimpleDb domain contents.
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


(function($) {
	
	if (!$.NinjaSDB) {
		$.NinjaSDB = {};
	}
	
	$.NinjaSDB.DomainList = function(el, options){
		var base = this;
		base.$el = $(el);
	  base.el = el;
		base.$el.data('NinjaSDB.DomainList', base);
		base.domainCt = 0;
		
		base.populateDomainList = function(domainsAry) {
			$('#' + base.el.id + "List").empty();
			
			if (domainsAry.constructor.toString().indexOf('Array') == -1) {
				//There is only one domain  "domainsAry" is a string
				base._appendDomain(domainsAry);
			}
			else {
				for (var i=0;i<domainsAry.length; i++){
					base._appendDomain(domainsAry[i]);
				}
			}
		};

		base._appendDomain = function(domainName) {
			var id = base.el.id + 'domain_' + this.domainCt;
			base.domainCt++;
			$('#' + base.el.id + "List").append('<li id="domain-' + domainName + '"><a  id="' + id + '" class="Domain" href="#">' + domainName + '</a></li>');
			$('#' + id ).contextMenu('domainMenu'	, {bindings: {
				domainDelete: function(o) {
					var domainName = o.firstChild.nodeValue;
					base._deleteDomain(domainName);
				}
			}});
		};


		base._deleteDomain = function(domainName) {
			var confirmed = confirm('DON\'T DO IT MAN!  Are you sure you want to delete Domain ' + domainName + '?');
			if (confirmed){
				$.NinjaSDB.DeleteDomain(domainName).bind('DeleteDomainResponseReceived', function(a,o) {
				$('#domain-' + domainName).remove();
				});
			}
		};
		
		base._addDomain = function(eventObj) {
			var newDomainName = prompt("Enter the name for your new Domain.");
			$.NinjaSDB.CreateDomain(newDomainName).bind('CreateDomainResponseReceived', function(a,o) {
				base._appendDomain(newDomainName);
			});
			return false;
		};
		
		

		base.changeDomain = function(eventObj) {
			$('.Domain').removeClass('current-domain');
			$(eventObj.target).addClass('current-domain');
			var targ = eventObj.target;
			var newDomainName = targ.firstChild.nodeValue;
			$(base).trigger('DomainChanged', {NewDomainName: newDomainName});
		};
		
		
		base.init = function() {
			base.options = $.extend({}, $.NinjaSDB.DomainList.defaultOptions, options);
			base.scaffolding = ($('<ul id="' + base.el.id + 'List"></ul><div><button id="' + base.id + 'addDomainBtn">Add Domain</button></div>'));
			base.$el.append(base.scaffolding);
			base.$el.find('#' + base.id + 'addDomainBtn').button().bind('click', function() {
				base._addDomain();
			});
			$('.Domain').live('click', base.changeDomain);
		};
		base.init();
	};

	
	$.NinjaSDB.DomainList.defaultOptions = {};
	
	$.fn.NinjaSDB_DomainList = function(options) {
		return this.each(function() {
			(new $.NinjaSDB.DomainList(this, options));
		});
	};
	
	$.fn.getNinjaSDB_DomainList = function() {
		return this.data('NinjaSDB.DomainList');
	};
})(jQuery);
