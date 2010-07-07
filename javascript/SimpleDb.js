/**
 * SimpleDbAdmin - SimpleDb.php
 * 
 * A JavaScript library for the SimpleDb API.  Produces valid SimpleDb API
 * operations that can be relayed (but not sent directly - because of the 
 * JavaScript Same Origin policy) to SimpleDb.
 * 
 * Implemented as a JQuery plug-in.  Requires JQuery.
 * 
 * @author Jay Muntz
 * 
 * Copyright 2010 Jay Muntz (http://www.awsninja.com)
 *
 * Permission is hereby granted, free of charge, to any person obtaining
 * a copy of this software and associated documentation files (the
 * “Software”), to deal in the Software without restriction, including
 * without limitation the rights to use, copy, modify, merge, publish,
 * distribute, sublicense, and/or sell copies of the Software, and to
 * permit persons to whom the Software is furnished to do so, subject to
 * the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED “AS IS”, WITHOUT WARRANTY OF ANY KIND,
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

	//Properties 

	
	$.NinjaSDB.sdbAccessKey = null;
	$.NinjaSDB.sdbSecKey = null;
	
	$.NinjaSDB.sdbVersion = '2009-04-15';
	$.NinjaSDB.sdbSignatureVersion = '2';
	$.NinjaSDB.sdbSignatureMethod = 'HmacSHA256';
	
	
	$.NinjaSDB.sdbURI = 'sdb.amazonaws.com';

	$.NinjaSDB.ListDomains = function(maxNumberOfDomains, nextToken)	{
		var params = {
			Action: 'ListDomains'
		};
		if (maxNumberOfDomains) {
			params.MaxNumberOfDomains = maxNumberOfDomains;
		}
		else {
			params.MaxNumberOfDomains = 20;
		}
		if (nextToken) {
			params.NextToken = nextToken;
		}
		return this._executeQuery('POST', params);
	};
	
	$.NinjaSDB.CreateDomain = function(domainName) {
		var params = {
			Action: 'CreateDomain',
			DomainName: domainName
		};
		return this._executeQuery('POST', params);
	};
	
	$.NinjaSDB.DeleteDomain = function(domainName) {
		var params = {
			Action: 'DeleteDomain',
			DomainName: domainName
		};
		return this._executeQuery('POST', params);
	};
	
	$.NinjaSDB.Select = function(selectExpression, consistantRead, nextToken) {
		var params = {
			Action: 'Select'
		};
		if (consistantRead === false) {
			params.ConsistantRead = 'false';
		}
		else {
			params.ConsistantRead = 'true';
		}
		
		
		params.SelectExpression = selectExpression;


		if (consistantRead === false) {
			params.ConsistantRead = 'false';
		}
		else {
			params.ConsistantRead = 'true';
		}
		if (nextToken) {
			params.NextToken = nextToken;
		}
		
		return this._executeQuery('POST', params);
	};
	
	$.NinjaSDB.GetAttributes = function(domainName, itemName) {
		var params = {
			Action: 'GetAttributes',
			ItemName: itemName,
			DomainName: domainName,
			ConsistantRead: 'true'
		};
		return this._executeQuery('POST', params);
	};
	
	$.NinjaSDB.PutAttributes = function(domainName, itemName, attrAry) {
		var params = {
			Action: 'PutAttributes',
			DomainName: domainName,
			ItemName: itemName
		};
		var ct = 0;
		for (var nm in attrAry) {
			if (attrAry.hasOwnProperty(nm)) {
				var period = $.NinjaSDB._periodSlug;
				var vals = attrAry[nm];
				for (var i = 0; i < vals.length; i++) {
					var val = vals[i];
					//'_p3ri0d_' will be replaced by . in relay.php.	PHP does not like dots in variable names
					params['Attribute' + period + ct + period + 'Name'] = nm;
					params['Attribute' + period + ct + period + 'Value'] = val;
					params['Attribute' + period + ct + period + 'Replace'] = 'true';
					ct++;
				}
			}
		}
		return this._executeQuery('POST', params);	
	};
	
	$.NinjaSDB._periodSlug = '_p3ri0d_';
	
	
	$.NinjaSDB.DeleteAttributes = function (domainName, itemName, attrs) {
		var params = {
			Action: 'DeleteAttributes',
			DomainName: domainName,
			ItemName: itemName
		};
		var period = $.NinjaSDB._periodSlug;
		if (attrs){
			for(var i=0; i<attrs.length; i++) {
				var pair = attrs[i];
				params['Attribute'	+ period +	i	+ period +	'Name'] = pair.Name;
				if (pair.Value) {
					params['Attribute' + period + i + period + 'Value'] = pair.Value;
				}
			}
		}
		var bla =	this._executeQuery('POST', params);
		return bla;
	};
	
	$.NinjaSDB._getUniqueId = function() {
		var newDate = new Date();
			return newDate.getTime();
	};
	
	$.NinjaSDB._ensureCredentials = function(callbackMethod, callbackParams) {
		if (!this.sdbAccessKey || !this.sdbSecKey) {
			this.cmg = $('<div id="cm"></div>');
			$('body').append(this.cmg);
			$('#cm').NinjaSDB_CredentialManager();
			return false;
		}
		else {
			return true;
		}
	};
	
	
	$.NinjaSDB._executeQuery = function(method, params) {
		//build the query without the signature or timestamp
		var hasCreds = $.NinjaSDB._ensureCredentials(method,params);
		var responseObj = {};
		var doExecute = function(method, params) {
			var p = params;
			p.AWSAccessKeyId = $.NinjaSDB.sdbAccessKey;
			p.Version = $.NinjaSDB.sdbVersion;
			p.SignatureVersion = $.NinjaSDB.sdbSignatureVersion;
			p.SignatureMethod = $.NinjaSDB.sdbSignatureMethod;
			var oSign = $.NinjaSDB._getSignatureFromArray(method, $.NinjaSDB.sdbURI + '/', p, $.NinjaSDB.sdbSecKey);
			p.Signature = oSign.Signature;
			p.Timestamp = oSign.Timestamp;

			$.ajax({
				url: './relay.php',
				context: $.NinjaSDB,
				success: function(data){
					$(responseObj).trigger(params.Action + 'ResponseReceived', {
						AWSResponse: data
					});
				},
				complete: function(req, status){
				//				alert('complete');
				},
				error: function(XMLHttpRequest, textStatus, errorThrown){
					alert('error');
					alert(textStatus);
				},
				dataType: 'json',
				type: method,
				data: p
			});
		};
		
		if (hasCreds) {
			doExecute(method, params);
		}
		else {
			$($('#cm').getNinjaSDB_CredentialManager()).bind('AccountChosen', function(eventObj, credObj) {
				$.NinjaSDB.sdbAccessKey = credObj.awsKey;
				$.NinjaSDB.sdbSecKey = credObj.awsSecret;
				$('#currentAccountName').text(credObj.name);
				$('#seItemList').getNinjaSDB_ItemList().fieldLists = {};
				doExecute(method, params);
			});
		}
		return $(responseObj);
	};
	
	$.NinjaSDB._getSignatureFromArray = function(method, URI, params, secretKey) {
		var modParams = {};		
		var regex = new RegExp($.NinjaSDB._periodSlug, 'g');
		for (var key in params) {
			if (params.hasOwnProperty(key)) {
				modParams[key.replace(regex, '.')] = params[key].toString();
			}
		}
		return AWSQS.getSignatureFromArray('POST', URI, modParams, secretKey); //POST because we don't want anything URL encoded yets
	};
		
	$.NinjaSDB._urlencode = function(str) {
			// URL-encodes string	
			// version: 911.718
			// discuss at: http://phpjs.org/functions/urlencode
			str = (str+'').toString();
		
			// Tilde should be allowed unescaped in future versions of PHP (as reflected below), but if you want to reflect current
			// PHP behavior, you would need to add ".replace(/~/g, '%7E');" to the following.
			return encodeURIComponent(str).replace(/!/g, '%21').replace(/'/g, '%27').replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A').replace(/%20/g, '+');
	};
	
})(jQuery);
