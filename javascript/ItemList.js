/**
 * SimpleDbAdmin - ItemList.php
 * 
 * Handles the listing, choosing, creating and deleting of SimpleDb domains.
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
	
	$.NinjaSDB.ItemList = function(el, options){
		var base = this;
		base.$el = $(el);
		base.el = el;
		base.maxRows = 10;
		base.fieldLists = {};
		
		base.putDialog = $('<div style="background-color: #FFFFFF"><table cellspacing="0" cellpadding="4"><tbody><tr><td colspan="2">Domain:&nbsp;&nbsp;<span id="domainName">*domain*</span></td></tr> ' + 
		'<tr><td colspan="2">Item&nbsp;Name:&nbsp;&nbsp;<input type="text" name="item-name" id="itemName" value="the item name"/></td></tr> ' + 
		'<tr><td colspan="2"><hr /></td></tr> ' + 
		'</tbody><tbody id="attrRows"></tbody></table></div>');
		
		base.addAttributeDialog = $('<div style="background-color: #FFFFFF" >' +
			'<table cellspacing="0" cellpadding="4"><tbody>' +
				'<tr><td>Name:</td><td><input type="text" name="newAttName" style="width:200px;"></td></tr>' +
				'<tr><td>Value:</td><td><input type="text" name="newAttValue" style="width:200px;"></td></tr>' +
			'</tbody></table>' +
		'</div>');
		
		base.scaffolding = $('<div id="' + base.el.id + 'Grid"><table cellspacing="0" cellpadding="4"><thead id="' + base.el.id + 'Thead"></thead><tbody id="' + base.el.id + 'Tbody"></tbody></table></div>');
		base.itemAttributeRowTemplate = $('<tr><td></td><td><input type="text" name="" value="" />&nbsp;<a href="#"><img src="./images/x.png" class="attribute-delete-btn" title="Remove this Attribute" /></a></td></tr>');
		base.$el.append(base.scaffolding);

		$('#' + base.el.id + 'Tbody').live('click', function (eventObj) {
			var tr = $(eventObj.target).closest('tr');
			var itemId = tr[0].id.substr(4);
			$.NinjaSDB.GetAttributes(base.currentDomainName, itemId).bind('GetAttributesResponseReceived', function(a,o) {
				var attrs = base._parseGetAttributesResults(o.AWSResponse.GetAttributesResponse.GetAttributesResult);
				base._populateDialog(itemId, attrs);
				base.putDialog.dialog('open');				
			});
		});

		$('#' + base.el.id + 'Tbody').live('mouseover', function (eventObj) {
			var tr = $(eventObj.target).closest('tr');
			tr.addClass('hovered');
		});
		
		$('#' + base.el.id + 'Tbody').live('mouseout', function (eventObj) {
			var tr = $(eventObj.target).closest('tr');
			tr.removeClass('hovered');
		});

		$('.addNewAttributeName').live('click', function() {
			$("input[name='newAttName']").val('');
			$("input[name='newAttValue']").val('');
			$("input[name='newAttName']").autocomplete({
				source: base.fieldLists[base.currentDomainName]
			});
			base.addAttributeDialog.dialog('open');
			$("input[name='newAttName']").focus();
			return false;
		});
		
		$('.attribute-delete-btn').live('click', function() {
			var itemName = base.putDialog.find('#itemName').val();
			var attributes = [];
			var nm = $(this).attr('attr-name');
			var vl = $(this).attr('attr-value');
			var pair = {
				Name: $(this).attr('attr-name')
			};
			if (vl && vl.length > 0) {
				pair.Value = vl;
			}
			
			var tr = $(this).closest('tr');
			attributes.push(pair);
			$.NinjaSDB.DeleteAttributes(base.currentDomainName, itemName, attributes).bind('DeleteAttributesResponseReceived', function(a,o) {
				//need to remove the old row
				tr.remove();
				//need to renumber all of those left who have the same itemName
				base._renumberInputsByAttributeName(nm);
			});
		});
		
		base._renumberInputsByAttributeName = function(nm) {
			var ct = 0;
			var selector = '[name|=' + nm + ']';
			base.putDialog.find(selector).each(function(idx, itm) {
				$(itm).attr('name', nm + '-' + ct);
				ct++;
			});
		};

		base.$el.data("NinjaSDB.ItemList", base);

		base.getItems = function(domainName, nextToken) {
			base.currentDomainName = domainName;
			var qry = base._buildQuery(domainName);	
			$.NinjaSDB.Select(qry).bind('SelectResponseReceived', function(a,o) {
				var resObj = base._parseSelectResults(o.AWSResponse.SelectResponse.SelectResult);
				base._buildItemTable(resObj);
				base.ensureAdd();
				if (o.AWSResponse.SelectResponse.SelectResult.NextToken)	{
					base.nextToken = o.AWSResponse.SelectResponse.SelectResult.NextToken;
					base.ensureNext();
					$('#nextBtn').css('display', 'block');
				}
				else {
					$('#nextBtn').css('display', 'hidden');
				}
			});
		};
		base.ensureNext = function() {
			if (!base.nextBtn) {
				base.nextBtn = $('<button>Next</button>');
				base.$el.append(base.nextBtn);
				base.nextBtn.button().bind('click', base.handleNextClicked);
			}
		};
		
		base.handleNextClicked = function() {
			var qry = base._buildQuery(base.currentDomainName);
			$.NinjaSDB.Select(qry, true, base.nextToken).bind('SelectResponseReceived', function(a,o) {
				var resObj = base._parseSelectResults(o.AWSResponse.SelectResponse.SelectResult);
				base._buildItemTable(resObj);
				base.ensureAdd();
				if (o.AWSResponse.SelectResponse.SelectResult.NextToken)	{
					base.nextToken = o.AWSResponse.SelectResponse.SelectResult.NextToken;
					base.ensureNext();
					$('#nextBtn').css('display', 'block');
				}
				else
				{
					$('#nextBtn').css('display', 'hidden');
				}
			});
		};
		
		base.ensureAdd = function() {
			if (!base.addBtn) {
				base.addBtn = $('<Button>Add Row</button>');
				base.$el.append(base.addBtn).append('&nbsp;&nbsp;&nbsp;&nbsp;');
				base.addBtn.button().bind('click', base.handleAddClicked);
			}
		};
		
		base._populateDialog = function(itemName, attrs){
			base.putDialog.find('#domainName').text(base.currentDomainName);
			if (itemName) {
				base.putDialog.find('#itemName').val(itemName);
			}
			else {
				base.putDialog.find('#itemName').val('');
			}
			base.putDialog.find('#attrRows').empty();
			var fields = base.fieldLists[base.currentDomainName];
			for(var i=0; i<fields.length; i++) {
				var fld = fields[i];
				var row;
				var tds;
				var inpt;
				var delAttrImg;
				if (attrs && attrs[fld]) {
					var attrAry = attrs[fld];
					for (var a = 0; a < attrAry.length; a++) {
						var vl = attrAry[a];
						if (vl === '' || vl) {
							row = base.itemAttributeRowTemplate.clone();
							tds = row.find('td');
							$(tds[0]).append(fld);
							inpt = row.find('input');
							inpt.attr('name', fld + '-' + a);
							delAttrImg = row.find('.attribute-delete-btn');
							inpt.attr('value', vl);
							delAttrImg.attr('attr-value', vl);
							delAttrImg.attr('attr-name', fld);
							base.putDialog.find('#attrRows').append(row);
						}
					}
				}
				else if (attrs) {
					//nothing?
				}
				else {
					row = base.itemAttributeRowTemplate.clone();
					tds = row.find('td');
					$(tds[0]).append(fld);
					inpt = row.find('input');
					inpt.attr('name', fld + '-0');
					delAttrImg = row.find('.attribute-delete-btn');
					delAttrImg.attr('attr-name', fld);
					base.putDialog.find('#attrRows').append(row);
				}
			}
		};

		
		base.handleAddClicked = function() {
			base._populateDialog();
			base.putDialog.dialog('open');
			base.putDialog.find('#itemName').focus();
		};
		
		base._addItem = function() {
			$(this).find('');
		};
		
		
		base._getUniqueArrayValues = function(ary) {
		 var u = {}, a = [];
		 for(var i = 0, l = ary.length; i < l; ++i){
			if (ary[i] in u) {
				continue;
			}
			a.push(ary[i]);
			u[ary[i]] = 1;
		 }
		 return a;
		};
		
		
		base._trackAttributeNames = function(keys) {
			base.fieldLists[base.currentDomainName] = [];
			for(var i=0; i<keys.length; i++){
				var k = keys[i];
				if ($.inArray(k, base.fieldLists[base.currentDomainName]) === -1) {
					base.fieldLists[base.currentDomainName].push(k);
				}
			}
		};
		
		base._parseGetAttributesResults = function(o) {
			var objects = {};
			if (o.Attribute[0]) {
				for (var i = 0; i < o.Attribute.length; i++) {
					var attr = o.Attribute[i];
					if (!objects[attr.Name]) {
						objects[attr.Name] = [];
					}
					objects[attr.Name].push(attr.Value);
				}
			}
			else {
				if (!objects[o.Attribute.Name]) {
					objects[o.Attribute.Name] = [];
				}
				objects[o.Attribute.Name].push(o.Attribute.Value);
			}
			return objects;
		};
		
		base._parseSelectResults = function(o) {
			var keys = base._getFieldKeys(o);
			base._trackAttributeNames(keys);
			var objects = {};
			var itemCol = [];
			if (o.Item) { //won't exist of domain is empty
				if (!o.Item.length) {
					itemCol = [o.Item]; // this is needed if there is only one item
				}
				else {
					itemCol = o.Item;
				}
			}
			for (var i in itemCol) {
				if (itemCol.hasOwnProperty(i)) {
					var itm = itemCol[i];
					var r = {};
					var rowName = itm.Name;
					if (itm.Attribute[0]) {
						for (var m in itm.Attribute) {
							if (itm.Attribute.hasOwnProperty(0)) {
								var attr = itm.Attribute[m];
								if (!r[attr.Name]) {
									r[attr.Name] = [];
								}
								r[attr.Name].push(attr.Value);
							}
						}
					}
					else {
						if (!r[itm.Attribute.Name]) {
							r[itm.Attribute.Name] = [];
						}
						r[itm.Attribute.Name].push(itm.Attribute.Value);
					}
					objects[rowName] = r;
				}
			}
			var res = {
				keys: keys,
				rows: objects
			};
			return res;
		};
		
		base._buildItemTable = function(objStruct) {
			$('#' +	base.el.id + 'Thead').empty();
			$('#' +	base.el.id + 'Tbody').empty();
			var keys = objStruct.keys;
			var keyCt = keys.length;
			
			var headRow = '<tr><td>ItemName</td>';
			
			for(var i=0; i<keyCt; i++){
				headRow += '<td>' + keys[i] + '</td>';
			}
			headRow += '</tr>';
			
			var items = objStruct.rows;
			var body = '';
			for(var itemName in items) {
				if (items.hasOwnProperty(itemName)) {
					var item = items[itemName];
					var row = base._makeRowFromItem(itemName, item);
					body += row;
				}
			}	
			$('#' +	base.el.id + 'Thead').append(headRow);
			$('#' +	base.el.id + 'Tbody').append(body);
		};
		
		base._makeRowFromItem = function(itemName, item) {
			var keys = base.fieldLists[base.currentDomainName];

			var keyCt = keys.length;
			var body = '<tr id="row-' + itemName	+ '"><td class="itemName">' + itemName + '</td>';
			for (var i=0; i<keyCt; i++) {
			var key = keys[i];
			if (item[key]) {
				var attr = item[key];
				var mult = false;
				body += '<td>';
				if (attr.length > 1) {
					mult = true;
					body += '[';
				}
				for (var j=0; j< attr.length; j++) {
					body += attr[j];
					if (mult && j <= attr.length-2) {
						body += ',';
					}
				}
				if (attr.length > 1) {
					body += ']';
				}
					body += '</td>';
				}
				else {
					body += '<td></td>';//emptycell
					
				}
			}
			body += '</tr>';
			return body;
		};
		
		
		base._getFieldKeys = function(o) {
			var all = [];
			if (o.Item) { //won't exist if the domain is empty
				if (o.Item.length) {
					for (var i in o.Item) {
						if (o.Item.hasOwnProperty(i)) {
							var obj = o.Item[i];
							var ct=0;
							for (var k in obj) {
								if (obj.hasOwnProperty(k)) {
									ct++;
								} 
					    }
							//if obj.Attribute contains 'Name' and 'Value' and attribute count is 2 - there is only one attribute
							if(obj.Attribute.Name && obj.Attribute.Value && ct===2){
								all.push(obj.Attribute.Name);
							}
							else {
								for (var j in obj.Attribute) {
									if (obj.Attribute.hasOwnProperty(j)) {
										var att = obj.Attribute[j];
										if (att.Name) {
											all.push(att.Name);
										}
									}
								}
							}
						}
					}
				}
				else { //this works in the case where there is only one row
					if (o.Item.Attribute[0]) {
						for (var id in o.Item.Attribute) {
							if (o.Item.Attribute.hasOwnProperty(id)) {
								all.push(o.Item.Attribute[id].Name);
							}
						}
					}
					else {
						all.push(o.Item.Attribute.Name);
					}
				}
			}	
			return base._getUniqueArrayValues(all);
		};
		
		
		base._buildQuery = function(domainName) {
			var qry;
			if (domainName.indexOf('-') === -1 && domainName.indexOf('.') === -1 && isNaN(parseInt(domainName.substr(0,1))))
			{
				qry  = 'SELECT * FROM ' + domainName + '	LIMIT ' + base.maxRows;
			}
			else
			{
				qry = 'SELECT * FROM `' + domainName + '`	LIMIT ' + base.maxRows;
			}
			return qry;
		};
		
		base.init = function(){
			base.options = $.extend({},$.NinjaSDB.ItemList.defaultOptions, options);
			base.putDialog = $('<div style="background-color: #FFFFFF;"><table style="margin: auto;cellspacing="0" cellpadding="4"><tbody><tr><td colspan="2">Domain:&nbsp;&nbsp;<span id="domainName">*domain*</span></td></tr>' +
				'<tr><td colspan="2">Item&nbsp;Name:&nbsp;&nbsp;<input type="text" name="item-name" id="itemName" value="the item name"/></td></tr>' +
				'<tr><td colspan="2"><hr /></td></tr>' +
				'</tbody><tbody id="attrRows"></tbody>' +
				'<tbody><tr><td colspan="2"><a href="#" class="addNewAttributeName" >Add Attribute Name</a></td></tr></tbody>' +
				'</table></div>');
			
			$(base.putDialog).dialog({ draggable: true, resizable: true, autoOpen: false, width: 600, buttons: { 
			Remove: function() {
				var itemId = $('#itemName').val();
				
				var answer = confirm("Are you sure you want to remove item " + itemId + '?');
				if (answer) {
					$.NinjaSDB.DeleteAttributes(base.currentDomainName, itemId).bind('DeleteAttributesResponseReceived', function(a, o){
						$('#row-' + itemId).remove();
						$(base.putDialog).dialog('close');
					});
				}				
			},
			Cancel: function() {
				$(base.putDialog).dialog('close');
			},
			Put: function() {
				var itemName = $(this).find('#itemName').val();
				var flds = {};
				var fields = base.fieldLists[base.currentDomainName];
				for (var i=0; i<fields.length; i++) {
					var field = fields[i];
					if (!flds[field]) {
						flds[field] = [];
					}
					var cc = 0;
					while ($(this).find("input[name='" + field + "-" + cc + "']").length > 0){
						var val = $(this).find("input[name='" + field + "-" + cc + "']").val();
						flds[field].push(val);
						cc++;
					}
				}
				$.NinjaSDB.PutAttributes(base.currentDomainName, itemName, flds).bind('PutAttributesResponseReceived', function(a,o){
					$(base.putDialog).dialog('close');
					//TODO: find out why the GetAttributes below sometimes returns the old value and see if we can get rid of the setTimeout delay.
					setTimeout(function() {
						$.NinjaSDB.GetAttributes(base.currentDomainName, itemName).bind('GetAttributesResponseReceived', function(a,o){
							var attrs = base._parseGetAttributesResults(o.AWSResponse.GetAttributesResponse.GetAttributesResult);
							var row = base._makeRowFromItem(itemName, attrs);
							if ($('#row-' + itemName).length === 0) {
								$('#' + base.el.id + 'Tbody').append(row);
							}
							else {
								$('#row-' + itemName).replaceWith(row);
							}
						});
					}, 1000);
				});			
			}}});
			
			base.addAttributeDialog.dialog({ draggable: true, resizable: false, autoOpen: false, width: 300, buttons: { Add: function() {
				var row = base.itemAttributeRowTemplate.clone();
				var fld = base.addAttributeDialog.find('[name=newAttName]').val();
				var val =	base.addAttributeDialog.find('[name=newAttValue]').val();
				if($.inArray(fld, base.fieldLists[base.currentDomainName]) === -1) {
					base.fieldLists[base.currentDomainName].push(fld);
				}
				var tds = row.find('td');
				$(tds[0]).append(fld);
				var inpt = row.find('input');
				inpt.attr('name', fld + '-100');
				if (val){
					inpt.attr('value', val);
				}
				else {
					inpt.attr('value', '');
				}
				base.putDialog.find('#attrRows').append(row);
				base._renumberInputsByAttributeName(fld);
				base.addAttributeDialog.dialog('close');
			}}});
		};
		base.init();
	};
	
	$.NinjaSDB.ItemList.defaultOptions = {
		//none
	};
	
	$.fn.NinjaSDB_ItemList = function(options){
		return this.each(function(){
			(new $.NinjaSDB.ItemList(this, options));
		});
	};
	
	$.fn.getNinjaSDB_ItemList = function(){
		return this.data("NinjaSDB.ItemList");
	};
	
})(jQuery);
