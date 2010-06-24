/*************************************************************************
 * jquery.TrackIt.plugins.js
 *************************************************************************
 * @author Aaron Lisman (Aaron.Lisman@ogilvy.com)
 * @author Adam S. Kirschner (AdamS.Kirschner@ogilvy.com)
 *************************************************************************
 */
(function($){
	/**
	 * A collection of Plugins available to use with TrackIt.
	 * @name TrackItPlugins
	 **/
	$.TrackItPlugins = {
		/**
		 * The data sanity checker will iterate through each track key and process all the holders within 
		 * each variable. It will detect whether or not a valid holder replacement was found or not. An
		 * extra option "SanityCheckMissingOnly" can be used to only report on those holders that are missing.
		 * This will show up in the console regardless of the other options that are set.
		 * 
		 * @name DataSanityCheck
		 * @memberOf TrackItPlugins
		 */	
		DataSanityCheck: { 
			/**
			 * Init function for the Data Sanity Check
			 * @function
			 * name Init
			 * memberOf DataSanityCheck
			 */
			Init: function() { this.ready( $.TrackItPlugins.DataSanityCheck.Go ); },
			/**
			 * Go function for the Data Sanity Check. Implementation for this plugin is here.
			 * 
			 * @function
			 * name Go
			 * memberOf DataSanityCheck
			 */
			Go: function(flashValidHolders, flashInvalidHolders) { 
				holderStatus = {};
				if( ! flashValidHolders ) { flashValidHolders = {} ; }
				if( ! flashInvalidHolders ) { flashInvalidHolders = {} ; }
				for( var key in this.Data ) {
					if( ! this.settings.SanityCheckMissingOnly ) { holderStatus[key] = {}; }
					keyData = cloneObj( this.Data[key] );
					for( var varName in keyData ) {
						var str = keyData[varName];
						if (typeof str == 'string') {
							var holders = this.GetPlaceHolderArray(str);
							if( holders ) {
								for( var i = 0; i < holders.length; i++ ) {
									var holder = holders[i];
									var splitArr = holder.toString().substring(1,(holder.length-1)).toString().split(":");
									var command = splitArr[0]; var value = splitArr[1];
									if( ! ( this.Holders[command] ) &&
										! ( keyData[command] ) &&
										! ( flashValidHolders[command] ) ) {
										if( ! holderStatus[key] ) { holderStatus[key] = {}; }
										holderStatus[key][command] = false;
									} else {
										if( ! this.settings.SanityCheckMissingOnly ) { 
											holderStatus[key][command] = true; 
										} else if( holderStatus[key] && holderStatus[key][command] ) {
											delete holderStatus[key][command]; 
										}
									}
								}
							}
							
						}
					}
				}
				if( this.settings.ShowDebugInfo ) { 
					console.groupCollapsed( "TrackItPlugins.DataSanityCheck() - Results" );
					console.dir( holderStatus );
					console.groupEnd();
				}
			}
		},
		/**
		 * This plugin will copy all prop's from each track key and copy its value into a corresponding eVar.
		 * 
		 * @name CopyPropToEVar
		 * @memberOf TrackItPlugins
		 */
		CopyPropToEVar: {
			/**
			 * Init function for the Copy prop to eVar plugin.
			 * 
			 * @function
			 * @name Init
			 * @memberOf TrackItPlugins.CopyPropToEVar
			 */
			Init: function() { this.ready( TrackItPlugins.CopyPropToEVar.Go ); },
			/**
			 * Go function for the Copy prop to eVar. Implementation for this plugin is here.
			 * 
			 * @function
			 * @name Go
			 * @memberOf TrackItPlugins.CopyPropToEVar
			 */
			Go: function() { 
				if( this.settings.ShowDebugInfo ) { console.groupCollapsed( "TrackItPlugins.CopyPropToEVar.Go() - Results" ); }
							
				var regex = new RegExp("(\\d+)","g");
				var newEVars = {};
				for( var key in this.Data ) {
					keyData = this.Data[key];
					for( var varName in keyData ) {
						if( varName.indexOf( "prop" ) > -1 ) {
							var i = varName.match(regex)[0];
							keyData["eVar" + i] = keyData["prop" + i];
							if( ! newEVars[ key ] ) { newEVars[key] = {}; }
							newEVars[key]["eVar" + i] = keyData[varName];
						}
					}
				}
				
				if( this.settings.ShowDebugInfo ) { 
					console.dir(newEVars);
					console.groupEnd(); 
				}
			}
		},
		/**
		 * Once the tracker has been loaded, it begins by checking the URL and the XML to see if any
		 * pageview event should fire. This function has a recognized options "EnableUrlMappingWithDeepLink"
		 * in the event that you want the deep linking controler to control what should be reported. This is 
		 * useful when using deep linking with JavaScript or Flash.
		 * 
		 * @name CheckUrlMapping
		 * @memberOf TrackItPlugins
		 */
		CheckUrlMapping: {
			/**
			 * The init function for checking the url mapping.
			 * 
			 * @function
			 * @name Init
			 * @memberOf CheckUrlMapping
			 */
			Init: function(){ 
				this.ExcludeAttribute('urlMap');
				this.ready( $.TrackItPlugins.CheckUrlMapping.Go ); 
			},
			/**
			 * Go function for the check url mapping. Implementation for this plugin is here.
			 * 
			 * @function
			 * @name Go
			 * @memberOf CheckUrlMapping
			 */
			Go: function(){
				var that = this;
					
				// if the option "EnableUrlMappingWithDeepLink" is set and there's a match URL map, then skip UrlMapping for this load
				if( document.location.hash.length > 0 && ! this.settings.EnableUrlMappingWithDeepLink ) {
					if( this.settings.ShowDebugInfo ) { console.info("TrackItPlugins.CheckUrlMapping.Go() - Deep Link Detected, Disabling Url Mapping"); }
				} else {	
					// the feature is enabled, so show info that it's going to process
					if( this.settings.ShowDebugInfo ) { console.group("TrackItPlugins.CheckUrlMapping.Go() - Enabled"); }
					if( this.settings.ShowDebugInfo ) { console.info("TrackItPlugins.CheckUrlMapping.Go() - Check against URL: ", document.location.pathname); }
					var found = false;
					// go through each track key
					for( var trackKey in this.Data ) {
						var trackObj = this.Data[trackKey];

						// ensure that a url mapping exists
						if( trackObj.urlMap ) {
							var urlMappings = trackObj.urlMap.split("|");

							$.each( urlMappings, function() {
								// check the URL and the url mapping as a regex, do some regex non-friendly manipulation first
								var mapping = this.replace("[", "\\["); 
								mapping = mapping.replace("]","\\]");
								mapping = mapping.replace("*",".*");
								
								if( !found && ( new RegExp( "^" + mapping + "$", "i" )).test( unescape(document.location.pathname) ) ) {
									// if the test pasts as a regex match, then track this event
									if( that.settings.ShowDebugInfo ) { console.info("TrackItPlugins.CheckUrlMapping.Go() - Found Key: '" + trackKey + "'"); }
									that.track( trackKey, {});
									found = true;
								}
							});
						}
					}
					
					if( this.settings.ShowDebugInfo && ! found ) { console.info("TrackItPlugins.CheckUrlMapping.Go() - Key Not Found!"); } 
				}
				
				if( this.settings.ShowDebugInfo ) { console.groupEnd(); }
			}
		},
		
		/**
		 * This plugin will store the last tracked results and can be referenced by using the [LAST:****] holder
		 * where the asterisks is the track variable. For example [LAST:eVar1] will get replaced with the last
		 * tracked data set's eVar1. If eVar1 was NOT tracked, it will return null.
		 * 
		 * @name RecordLastTrack
		 * @memberOf $.TrackItPlugins
		 */
		RecordLastTrack: {
			/**
			 * This function init's the record last track plugin. It sets the LAST holder as well as the event.
			 * 
			 * @function
			 * @name RecordLastTrack.Init
			 * @memberOf $.TrackItPlugins
			 */
			Init: function() { 
				this.__LAST_REPORT = {};
				
				this.addCallback('afterTrack', function(options) { 
					$.TrackItPlugins.RecordLastTrack.__LAST_REPORT = $.extend( $.TrackItPlugins.RecordLastTrack.__LAST_REPORT, options.parsedData);
					if( this.settings.ShowDebugInfo ) { console.info("TrackItPlugins.RecordLastTrack() - Last data set saved!"); }
				});
			
				this.Holders["LAST"] = $.TrackItPlugins.RecordLastTrack.LastHolder;
			},
			/**
			 * This function is executed on the 'afterTrack' call back event. When it is called, it will store the tracking results from
			 * the track that just occurred.
			 * 
			 * @function
			 * @name RecordLastTrack.LastHolder
			 * @memberOf $.TrackItPlugins
			 */
			LastHolder: function(options) {
				if( $.TrackItPlugins.RecordLastTrack.__LAST_REPORT && $.TrackItPlugins.RecordLastTrack.__LAST_REPORT[options.value] ) { 
					return $.TrackItPlugins.RecordLastTrack.__LAST_REPORT[options.value];
				} else {
					if( options.instance.settings.ShowDebugInfo ) { console.warn( "TrackItPlugins.RecordLastTrack() - LAST value request not found '" + options.value + "'")}
				}
			}
		},

		/**
		 * This plugin will allow the developer to use a "cssSelector" attribute to bind trackKeys to.
		 * This is an alternative plan of action instead of embedding trackKey attributes onto each link.
		 */
		CssSelector: {
			/**
			 * This function init's the css selector plugin.
			 * 
			 * @function
			 * @name CssSelector.Init
			 * @memberOf $.TrackItPlugins
			 */
			Init: function() {
				this.ExcludeAttribute('cssSelector');
				this.ready( $.TrackItPlugins.CssSelector.Go ); 
			},
			
			/** 
			 * This function processes the actual selector and calls instance.track()
			 * 
			 * @function
			 * @name CssSelector.Go
			 * @memberOf $.TrackItPlugins
			 */
			Go: function() {
				var self = this;
				if( self.settings.ShowDebugInfo ) { console.group( "$.TrackItPlugins.CssSelector() - Enabled'" ); }
				
				// go through each track key
				for( var trackKey in self.Data ) {
					
					// get the selector and make sure its something
					var selector = this.Data[trackKey].cssSelector;
					if( selector && selector.length > 0 ) {
				
						// set our event
						$(selector).live("click", function() { 
							self.track(trackKey, { ele: this });
						});
						
						if( self.settings.ShowDebugInfo ) { console.info( '"', trackKey, '" --> "', selector, '"' ); }
					}
				}

				if( self.settings.ShowDebugInfo ) { console.groupEnd(); }
			}
		},
		

		/**
		 * This plugin will allow the developer to use a "cssSelector" attribute to bind trackKeys to.
		 * This is an alternative plan of action instead of embedding trackKey attributes onto each link.
		 */
		ToLowerCase: {
			/**
			 * 
			 * 
			 * @function
			 * @name ToLowerCase.Init
			 * @memberOf $.TrackItPlugins
			 */
			Init: function() {
				this.addCallback( 'beforeTrack', $.TrackItPlugins.ToLowerCase.Go );
				if( this.settings.ShowDebugInfo ) { console.info( "$.TrackItPlugins.ToLowerCase() - Enabled'" ); }
			},
			
			/** 
			 *  
			 * @function
			 * @name ToLowerCase.Go
			 * @memberOf $.TrackItPlugins
			 */
			Go: function( options ) {
				var self = this;
				if( self.settings.ShowDebugInfo ) { console.group( "$.TrackItPlugins.ToLowerCase() - Executing'" ); }
				
				var parsedData = options.parsedData;
				// go through each track key
				for( var key in parsedData ) {
					if( $.isFunction( parsedData[key].toLowerCase ) ) {
						parsedData[ key ] = parsedData[key].toLowerCase();
					}
				}

				if( self.settings.ShowDebugInfo ) { console.groupEnd(); }
			}
		}
	}
})(jQuery);

