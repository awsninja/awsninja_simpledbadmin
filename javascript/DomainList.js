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
			for (var i=0;i<domainsAry.length; i++){
				base._appendDomain(domainsAry[i]);
			}
		};

		base._appendDomain = function(domainName) {
			//$('#' + base.el.id + "List").empty();
			var id = base.el.id + 'domain_' + this.domainCt;
			base.domainCt++;
			$('#' + base.el.id + "List").append('<li id="domain-' + domainName + '"><a  id="' + id + '" class="Domain" href="#">' + domainName + '</a></li>');
			$('#' + id ).contextMenu('domainMenu'	, {bindings: {
				domainDelete: function(o) {
					var domainName = o.firstChild.nodeValue;
					base._deleteDomain(domainName);
				},
				domainEmpty: function() {
					alert('domainEmpty');
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
