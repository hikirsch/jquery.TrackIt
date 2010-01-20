var Void=function(){};
/*
 * jquery-json
 * http://code.google.com/p/jquery-json/
 */
(function($){function toIntegersAtLease(n){return n<10?'0'+n:n;}Date.prototype.toJSON=function(date){return this.getUTCFullYear()+'-'+toIntegersAtLease(this.getUTCMonth())+'-'+toIntegersAtLease(this.getUTCDate());};var escapeable=/["\\\x00-\x1f\x7f-\x9f]/g;var meta={'\b':'\\b','\t':'\\t','\n':'\\n','\f':'\\f','\r':'\\r','"':'\\"','\\':'\\\\'};$.quoteString=function(string){if(escapeable.test(string)){return'"'+string.replace(escapeable,function(a){var c=meta[a];if(typeof c==='string'){return c;}c=a.charCodeAt();return'\\u00'+Math.floor(c/16).toString(16)+(c%16).toString(16);})+'"';}return'"'+string+'"';};$.toJSON=function(o,compact){var type=typeof(o);if(type=="undefined")return"undefined";else if(type=="number"||type=="boolean")return o+"";else if(o===null)return"null";if(type=="string"){return $.quoteString(o);}if(type=="object"&&typeof o.toJSON=="function")return o.toJSON(compact);if(type!="function"&&typeof(o.length)=="number"){var ret=[];for(var i=0;i<o.length;i++){ret.push($.toJSON(o[i],compact));}if(compact)return"["+ret.join(",")+"]";else return"["+ret.join(", ")+"]";}if(type=="function"){throw new TypeError("Unable to convert object of type 'function' to json.");}var ret=[];for(var k in o){var name;type=typeof(k);if(type=="number")name='"'+k+'"';else if(type=="string")name=$.quoteString(k);else continue;var val=$.toJSON(o[k],compact);if(typeof(val)!="string"){continue;}if(compact)ret.push(name+":"+val);else ret.push(name+": "+val);}return"{"+ret.join(", ")+"}";};$.compactJSON=function(o){return $.toJSON(o,true);};$.evalJSON=function(src){return eval("("+src+")");};$.secureEvalJSON=function(src){var filtered=src;filtered=filtered.replace(/\\["\\\/bfnrtu]/g,'@');filtered=filtered.replace(/"[^"\\\n\r]*"|true|false|null|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?/g,']');filtered=filtered.replace(/(?:^|:|,)(?:\s*\[)+/g,'');if(/^[\],:{}\s]*$/.test(filtered))return eval("("+src+")");else throw new SyntaxError("Error parsing JSON, source is not valid.");};})(jQuery);
$.postJSON = function(url,data,callback){ $.ajax({type:'POST',data:$.toJSON(data),url: url,contentType: 'application/json',dataType: 'json',success:callback});};

(function($){
	$.blockUI.defaults.css.borderColor = "#000";
	$.blockUI.defaults.css.top = "20%";
	$.blockUI.defaults.overlayCSS.opacity = '0.8';
	$.blockUI.defaults.growlCSS.opacity = '0.8';
	$.blockUI.defaults.growlCSS.top = 'auto';
	$.blockUI.defaults.growlCSS.bottom = '10px';
	
	$.AddNewSite = function() {
		if( ! this.Init ) { 
			$("#addNewSiteDialog a.closeButton").VoidLink().unbind('click').click( $.unblockUI );
			$("#addNewSiteDialog input.cancelButton").unbind('click').click( function() { 
				$("#addNewSiteDialog li").each( function() { $(this).removeClass("error"); });
				 $.unblockUI();
			});
			$("#addNewSiteDialog input.createButton").unbind('click').click(function() { 
				var error = false;
				var jsonFields = {};
				$("#addNewSiteDialog input[type='text'], #addNewSiteDialog select").each( function() { 
					if( $(this).hasClass("required") && $(this).val().length == 0 ) {
						$(this).parent().addClass("error");
						error = true;
					} else { 
						$(this).parent().removeClass("error");
						jsonFields[ $(this).attr('name') ] = $(this).val();
					}
				});
				
				if( ! error ) { 
					$.postJSON(
						'/Assets/json/successJson.aspx',
						jsonFields,
						function(response) { 
							$.unblockUI();
									
							if( response.success ) { 
								$.growlUI('Site created successfully!', 'The site "' + jsonFields.siteName + '" has been deleted successfully!' );	
							} else {
								$.growlUI('Sorry!', 'Something went wrong while creating the site.' );	
							}
						}
					);
				}
			});
			this.Init = true;
		}
		
		$.blockUI({ message: $("#addNewSiteDialog") });
	};
	
	$.ConfirmDelete = function( options ) {
		if( ! this.Init ) { 
			$("#deleteConfirmation a.closeButton").VoidLink().unbind('click').click( $.unblockUI );
			$("#deleteConfirmation input.noButton").unbind('click').click( $.unblockUI );
			this.Init = true;
		}
		
		$("#deleteConfirmation input.yesButton").unbind('click').click( options.callback );
		
		$("#deleteConfirmation h5 span").text(options.title);
		$("#deleteConfirmation p.message").text(options.message);
			
		$.blockUI({ message: $("#deleteConfirmation") });
	};
	
	$.extend( $.fn, {
		destroy: function() {
			var that = this;
			if( ! this.Init ) { 
				$(document.body).append( 
					this.__TRASH_BIN = $("<div><div>")
						.css('display','none')
				);
			}
			
			$(this).fadeOut(500, function() { 
				$(that).appendTo( this.__TRASH_BIN );
				that.__TRASH_BIN.empty();
			});	
		},
		VoidLink: function() { return this.attr('href', 'javascript:Void()'); },
		ClickRow: function() {
			$.each( this.find("tr"), function() { 
				var link = $(this).find('a:first');
				
				if( link ) { 					
					$(this).click( function() { location.href = $(link).attr('href'); } );
					$(this).hover( 
						function() { $(this).addClass('hover'); },
						function() { $(this).removeClass('hover'); }
					);
				};
			});
		},
		SiteListingIcons: function() {
			var that = $(this);
			that.find('tbody tr').each(function(){
				var rowEle = $(this);
				var siteName = rowEle.find('a:first').text();
				var siteId = rowEle.find('input.siteId:first').get(0).value;
				
				rowEle.find('a.iconDelete').VoidLink().click(function(e) { 
					
					$.ConfirmDelete({
						title: 'TrackIt - Delete Site Confirmation',
						message: 'Are you sure you want to delete the site "' + siteName + '"?',
						callback: function() { 
							$.postJSON(
								'/Assets/json/successJson.aspx',
								{ SiteId: siteId },
								function( response ) { 
									$.unblockUI();
									
									if( response.success ) { 
										$.growlUI('Deleted Successfully!', 'The site "' + siteName + '" has been deleted successfully!' );	
										rowEle.destroy();
									} else {
										$.growlUI('Item not deleted!', 'Something went wrong while deleting the site "' + siteName + '".' );	
									}
								}
							);
						}
					});
					
					e.stopPropagation();
					return false;
				});
				
			});
		},
		TrackEventListingIcons: function() {
			var that = $(this);
			that.find('tbody tr').each(function(){
				var rowEle = $(this);
				var trackEventName = rowEle.find('a:first').text();
				var trackEventId = rowEle.find('input.trackEventId:first').get(0).value;
				
				rowEle.find('a.iconDelete').VoidLink().click(function(e) { 
					
					$.ConfirmDelete({
						title: 'TrackIt - Delete TrackEvent Confirmation',
						message: 'Are you sure you want to delete the TrackEvent"' + trackEventName + '"?',
						callback: function() { 
							$.postJSON(
								'/Assets/json/successJson.aspx',
								{ TrackEventId: trackEventId },
								function( response ) { 
									$.unblockUI();
									
									if( response.success ) { 
										$.growlUI('Deleted Successfully!', 'The TrackEvent "' + trackEventName + '" has been deleted successfully!' );	
										rowEle.destroy();
									} else {
										$.growlUI('Item not deleted!', 'Something went wrong while deleting the TrackEvent "' + trackEventId + '".' );	
									}
								}
							);
						}
					});
					
					e.stopPropagation();
					return false;
				});
				
			});
		}
	});
	
	var Site = {
		Init: function() { 
			$(".listingTable").ClickRow();
			$('.siteListingTable').SiteListingIcons();
			$('.trackEventListingTable').TrackEventListingIcons();
			$('.addButton').click( $.AddNewSite );
			
		}
	};

	$( Site.Init );
})(jQuery);

