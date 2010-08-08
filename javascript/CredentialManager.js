/**
 * SimpleDbAdmin - CredentialManager.php
 * 
 * Manages the user's AWS credentials for The SimpleDbAdmin application.
 * Saves encrypted credential information to cookies using a password.
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
	$.NinjaSDB.CredentialManager = function(el, options){
		
		var base = this;
		base.$el = $(el);
		base.el = el;
		
		base.$el.data('NinjaSDB.CredentialManager', base);
		base.putDialog = $('<div style="background-color: #FFFFFF; width: 600px;"><table cellspacing="0" cellpadding="4"><tbody> ' + 
		'<tr><td colspan="2">Saved&nbsp;Acct.&nbsp;Name:&nbsp;&nbsp;<select id="savedCredentialsDropdown"></select></td></tr> ' + 
		'<tr><td colspan="2"><hr /></td></tr> ' + 
		'</tbody><tbody>'+
		'<tr><td>Name</td><td><input name="name" /></td></tr>'+
		'<tr><td>Access Key</td><td><input name="accessKey" /></td></tr>'+
		'<tr><td>Secret Key</td><td><input name="secretKey" /></td></tr>'+
		'<tr><td>Password</td><td><input name="password" /></td></tr>'+
		'</tbody></table></div>');
		
		base.encrypt = function(str, pwd) {
			if(pwd === null || pwd.length <= 0) {
				return null;
			}
			var prand = "";
			for(var i=0; i<pwd.length; i++) {
				prand += pwd.charCodeAt(i).toString();
			}
			var sPos = Math.floor(prand.length / 5);
			var mult = parseInt(prand.charAt(sPos) + prand.charAt(sPos*2) + prand.charAt(sPos*3) + prand.charAt(sPos*4) + prand.charAt(sPos*5), 10);
			var incr = Math.ceil(pwd.length / 2);
			var modu = Math.pow(2, 31) - 1;
			if(mult < 2) {
				alert("Algorithm cannot find a suitable hash. Please choose a different password. \nPossible considerations are to choose a more complex or longer password.");
				return null;
			}
			var salt = Math.round(Math.random() * 1000000000) % 100000000;
			prand += salt;
			while(prand.length > 10) {
				prand = (parseInt(prand.substring(0, 10), 10) + parseInt(prand.substring(10, prand.length), 10)).toString();
			}
			prand = (mult * prand + incr) % modu;
			var enc_chr = "";
			var enc_str = "";
			for(i=0; i<str.length; i++) {
				enc_chr = parseInt(str.charCodeAt(i) ^ Math.floor((prand / modu) * 255), 10);
				if (enc_chr < 16) {
					enc_str += "0" + enc_chr.toString(16);
				}
				else {
					enc_str += enc_chr.toString(16);
				}
				prand = (mult * prand + incr) % modu;
			}
			salt = salt.toString(16);
			while (salt.length < 8) {
				salt = "0" + salt;
			}
			enc_str += salt;
			return enc_str;
		};
		
		
		base.decrypt = function(str, pwd) {
			if(str === null || str.length < 8) {
				alert("A salt value could not be extracted from the encrypted message because it's length is too short. The message cannot be decrypted.");
				return;
			}
			if(pwd === null || pwd.length <= 0) {
				alert("Please enter a password with which to decrypt the message.");
				return;
			}
			var prand = "";
			for(var i=0; i<pwd.length; i++) {
				prand += pwd.charCodeAt(i).toString();
			}
			var sPos = Math.floor(prand.length / 5);
			var mult = parseInt(prand.charAt(sPos) + prand.charAt(sPos*2) + prand.charAt(sPos*3) + prand.charAt(sPos*4) + prand.charAt(sPos*5), 10);
			var incr = Math.round(pwd.length / 2);
			var modu = Math.pow(2, 31) - 1;
			var salt = parseInt(str.substring(str.length - 8, str.length), 16);
			str = str.substring(0, str.length - 8);
			prand += salt;
			while(prand.length > 10) {
				prand = (parseInt(prand.substring(0, 10), 10) + parseInt(prand.substring(10, prand.length), 10)).toString();
			}
			prand = (mult * prand + incr) % modu;
			var enc_chr = "";
			var enc_str = "";
			for(i=0; i<str.length; i+=2) {
				enc_chr = parseInt(parseInt(str.substring(i, i+2), 16) ^ Math.floor((prand / modu) * 255), 10);
				enc_str += String.fromCharCode(enc_chr);
				prand = (mult * prand + incr) % modu;
			}
			return enc_str;
		};
	
		base._getAccounts = function() {
			var acctStr = $.cookie('SDBAccounts');
			if (acctStr) {
				var res = {};
				var accts = acctStr.split('~-');
				for (var i = 0; i < accts.length; i++) {
					var acct = accts[i];
					var actpts = acct.split('-~');
					var actObj = {
						name: actpts[0],
						awsKey: actpts[1],
						encSecKey: actpts[2]
					};
					res[actObj.awsKey] = actObj;
				}
				return res;
			}
			else {
				return {};
			}			
		};
	
		base._removeAccount = function(awsKey) {
			base.accounts[awsKey] = null;
			$("option[value='" + awsKey + "']").remove();
			base._setCookie();
		};
		
		base._configureOptions = function() {
			var hasAccounts = false;
			base.putDialog.find('select').empty();
			for(var awsKey in base.accounts){
				if (base.accounts[awsKey]) {
					base.putDialog.find('select').append('<option value="' + awsKey + '">' + base.accounts[awsKey].name + '</option>');
					hasAccounts = true;
				}
			}
			if (!hasAccounts){
				base.putDialog.find('select').append('<option>Set up an account below</option>');
			}
			else {
				base.putDialog.find('select').prepend('<option>Choose an Account</option>');
			}
		};
		
		
		base._appendAccount = function() {
			var name = base.putDialog.find("input[name='name']").val();
			var awsKey = base.putDialog.find("input[name='accessKey']").val();
			var secretKey = base.putDialog.find("input[name='secretKey']").val();
			var password = base.putDialog.find("input[name='password']").val();
			var encryptedKey = base.encrypt(secretKey, password);
			var actObj = {
				name: name,
				awsKey: awsKey,
				encSecKey: encryptedKey
			};
			base.accounts[awsKey] = actObj;
			base._setCookie();
		};
	
		base._setCookie = function() {
			//set the cookie
			var cookieBody = '';
			var first = true;
			for(var awsKey in base.accounts){
				if (base.accounts.hasOwnProperty(awsKey)) {
					var act = base.accounts[awsKey];
					if (act) {
						if (first) {
							first = false;
						}
						else {
							cookieBody += '~-';
						}
						cookieBody += act.name + '-~' + act.awsKey + '-~' + act.encSecKey;
					}
				}
			}
			$.cookie('SDBAccounts', cookieBody, {expires: 365});
		};
	
		$('#savedCredentialsDropdown').live('change', function() {
			var password = prompt("Enter your password, or press cancel to delete this account.");
			var actObj = base.accounts[$('#savedCredentialsDropdown').val()];
			if (password) {
				var creds = {
					awsKey: actObj.awsKey,
					awsSecret: base.decrypt(actObj.encSecKey, password),
					name: actObj.name
				};
				$(base).trigger('AccountChosen', [creds]);
				base.putDialog.dialog('close');
			}
			else {
				base._removeAccount(actObj.awsKey);
			}
		});
	

		$('#currentAccountName').live('click',function() {
			base.changeAccount();
		});
			
		base.changeAccount = function() {
		
			base.putDialog.find("input[name='secretKey']").val('');
			base.putDialog.find("input[name='password']").val('');
			base.putDialog.find("input[name='name']").val('');
			base.putDialog.find("input[name='accessKey']").val('');
			base._configureOptions();
			base.putDialog.dialog('open');
		};
	
		base.init = function() {
			base.options = $.extend({}, $.NinjaSDB.CredentialManager.defaultOptions, options);
			base.accounts = base._getAccounts();
			base._configureOptions();
			base.putDialog.dialog({width: 500, buttons: {Go: function() {
				//this is adding a new account
				var secretKey = base.putDialog.find("input[name='secretKey']").val();
				var password = base.putDialog.find("input[name='password']").val();
			//	var encryptedKey = base.encrypt(secretKey, password);
				var name = base.putDialog.find("input[name='name']").val();
				var awsKey = base.putDialog.find("input[name='accessKey']").val();
				base._appendAccount();
				var creds = {
					awsKey: awsKey,
					awsSecret: secretKey,
					name: name
				};
				$(base).trigger('AccountChosen', [creds]);
				base.putDialog.dialog('close');
			}}});

		};
		base.init();
	};
	
	$.NinjaSDB.CredentialManager.defaultOptions = {
		//none
	};

	$.fn.NinjaSDB_CredentialManager = function(options) {
		return this.each(function() {
			(new $.NinjaSDB.CredentialManager(this, options));
		});
	};
	
	$.fn.getNinjaSDB_CredentialManager = function() {
		return this.data('NinjaSDB.CredentialManager');
	};
	
})(jQuery);
