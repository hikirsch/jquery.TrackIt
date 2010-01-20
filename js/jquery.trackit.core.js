/**
 * This function does nothing. It is mostly used when initializing a fake console object.
 * 
 * @name Void
 * @function
 * @memberOf window
 */
var Void=function(){};if(!window.console){window.console={warn:Void,log:Void,error:Void,info:Void}};

if(!window.console.group){window.console=$.extend(window.console,{group:Void,groupEnd:Void,groupCollapsed:Void,dir:Void});}
/**
 * See a basic JavaScript guide if you don't know what the window is.
 * @name window
 * @class
 */

/**
 * See the jQuery Library  (<a href="http://jquery.com">http://jquery.com</a>) for full details.
 * This just documents the function and classes that are added to jQuery by this plug-in. 
 * See (<a href="http://jquery.com">http://jquery.com</a>).
 * @name $
 * @class
 */

/** 
 * @name cloneObj
 * @function
 * @param {object} o the object to be cloned
 * @return {object} same object as the parameter but as a new instance
 * @memberOf window
 */ 
var cloneObj=function(o){var c={};for(var p in o){if(o[p]!==undefined){if(typeof o[p]==="object"){c[p]=cloneObj(o[p]);}else{c[p]=o[p];}}}return c;};
 
/*************************************************************************
 * jquery.TrackIt.js - Version 2.0
 *************************************************************************
 * @author Aaron Lisman (Aaron.Lisman@ogilvy.com)
 * @author Adam S. Kirschner (AdamS.Kirschner@ogilvy.com)
 * $Rev: 156 $
 * $Date: 2010-01-17 14:04:44 -0500 (Sun, 17 Jan 2010) $
 * $Author: adams.kirschner@ogilvy.com $
 * $HeadURL: https://svn.ogilvy.com/repos/OgilvyInteractive/projects/TrackingPlugin/trunk/js/jquery.trackit.core.js $
 *************************************************************************
 */
(function($) {	
	/**
	 * Create a new instance of the tracker, "this" should be the data grid itself
	 * @constructor
	 * @name initTrackIt
	 * @see TrackItModules
	 * @memberOf $
	 * @param {string} trackerModule the Tracking Module to use
	 * @param {object} options a set of options that can be used to override $.TrackIt.defaults
	 * @snippet var tracker = $.initTrackIt('omniture', { XmlUrl: '/path/to/trackData.xml' });
	 */
	$.initTrackIt = function(trackerModule, options){ return new $.TrackIt(trackerModule, options); };
		
	/**
	 * Main Constructor. Initializes the main Tracker object, merges in the correct tracking module and returns
	 * an instance of the tracker itself. This function will also attach a click event using jQuery.live
	 * @constructor
	 * @memberOf $
	 * @name TrackIt
	 * @param {object} data the tracking data itself
	 * @param {string} trackerModule the Tracking Module to use, either ga or omniture (other aliases exist)
	 * @param {object} options a set of options that can be used to override $.TrackIt.defaults
	 */
	$.TrackIt = function(trackerModule, options) {
		var self = this;

		
		
		// allow options to override default settings
		this.settings = $.extend(this.defaults, options.Settings);
		
		if( this.settings.ShowDebugInfo ) { console.group( "$.TrackIt() - Init" ); }
		
		// some debug info 
		if( this.settings.TestMode && this.settings.ShowDebugInfo ) {
			console.groupCollapsed( "$.TrackIt() - Test Mode is Enabled, Tracking Disabled!" );
		} else if( this.settings.ShowDebugInfo ) {
			console.info( "$.TrackIt() - Tracking Enabled. Debug Mode On." );
		}
		
		// Omniture does suck with flash, needs a "fake link"
		this.InitDudLink();
		
		// merge the tracking Module object settings into this object
		this.loadTrackingModule(trackerModule);

		// reset all track events
		this.__CALLBACK_EVENTS = {};
		$.each( this.__GLOBAL_EVENTS, function() { self.__CALLBACK_EVENTS[this + ''] = []; } );
		
		// set ready to start accepting new events
		this.__READY = [];
		
		// extend global placeholders
		if( options.GlobalHolders ) { $.extend( this.BuiltInHolders, options.GlobalHolders ); }
		
		// use live to set global click listener
		$(this.settings.TrackKeyCssSelector).live('click', function(){ self.HandleGenericClick( this ); });
	
		if( options.Plugins ) { $.each( options.Plugins, function() { 
			if( this["Init"] && $.isFunction( this["Init"] ) ) { this.Init.apply(self); } 
		});	}

		if( this.settings.ShowDebugInfo ) { console.groupEnd(); }
		
		// if there was an xml file specified, load it	
		if( options.XmlUrl ) {
			// load the track data from an Xml File, send in an extra data that is set (if any)
			this.loadXml(options.XmlUrl, options.TrackData);
		} else {
			// set the track data
			this.TrackData = $.extend({}, options.TrackData);
			
			// callback functions should run when this module has done its basic initialization
			this.ready();
		}
	};

	/**
     * $.TrackIt Methods
     */
	$.extend( $.TrackIt.prototype,
		/** @lends $.TrackIt.prototype */ 
		{
		__GLOBAL_EVENTS: [ 'afterProcessHolders', 'beforeProcessHolders', 'beforeTrack', 'afterTrack' ],
		__INDIVIDUAL_EVENTS: [ 'afterProcessHolders', 'beforeProcessHolders', 'beforeTrack', 'afterTrack' ],
		/**
		 * These are the basic options that can be overridden by $.TrackIt to help debugging
		 * and other customizations that may be necessary. Every option is set to false by default.
		 * 
		 * @type object
		 * @memberOf $.TrackIt.prototype
		 */
		defaults: { 
			/**
			 * the css selector string that will listen for the TrackKeyAttribute
			 * 
			 * @memberOf $.TrackIt.prototype
			 * @type string
			 */
			TrackKeyCssSelector: "*",
			
			/**
			 * whether or not reporting is actually sent to service. 
			 * 
			 * @memberOf $.TrackIt.prototype
			 * @type bool
			 */
			TestMode: false,
			
			/**
			 * the HTML attribute that is checked for a track key when an item is clicked on
			 * 
			 * @type string
			 * @memberOf $.TrackIt.prototype
			 */
			TrackKeyAttribute: "trackKey",
			
			/**
			 * whether or not the tracker should be disabled if a "#" is present on pageload
			 * 
			 * @type bool
			 * @memberOf $.TrackIt.prototype
			 */
			EnableUrlMappingWithDeepLink: false,
			
			/**
			 * a warning will show up in Firebug when a holder ([some holder]) is evaluated based on no specified input
			 * 
			 * @type bool
			 * @memberOf $.TrackIt.prototype
			 */
			ShowMissingHolderWarnings: false,
			
			/**
			 * whether or not to show detailed tracker debug information to track stack trace and other useful information while testing
			 * 
			 * @type bool
			 * @memberOf $.TrackIt.prototype
			 */
			ShowDebugInfo: false,
			
			/**
			 * the HTML attribute that is checked for a track key when an item is clicked on
			 * 
			 * @type bool
			 * @memberOf $.TrackIt.prototype
			 */
			SanityCheckEnabled: false,
			
			/**
			 * whether or not to show a detailed report that verifies the existance (or non existance) of all holders in all track keys
			 * 
			 * @type bool
			 * @memberOf $.TrackIt.prototype
			 */
			SanityCheckMissingOnly: false,
			
			/**
			 * whether or not to only show holders that are not defined during a data sanity check
			 * 
			 * @type bool
			 * @memberOf $.TrackIt.prototype
			 */
			SanityCheckFromFlash: false,
			
			/**
			 * regardless of other variables that are set, this option will ensure that reported data will show in console
			 * 
			 * @type bool
			 * @memberOf $.TrackIt.prototype
			 */
			ShowOnlyReportedData: false
		},

		/**
		 * When an element is clicked and includes the trackKey attribute, this function is called
		 * and handles the track call. The element itself is passed as a parameter with its key as "ele"
		 * 
		 * @function
		 * @private
		 * @param {HTMLElement} ele the HTML element that was clicked and caused the tracker to fire
		 * @memberOf $.TrackIt.prototype
		 */
		HandleGenericClick: function( ele ) {
			var key = $(ele).attr(this.settings.TrackKeyAttribute);	
			
			// if the tracking attribute has a valid value in it, then this element should be tracked
			if( key !== undefined && key.text().length > 0 ) {
				
				// track it and send the link ele as an option
				this.track(key, { ele: ele });
			}
		},
		/**
		 * TrackIt provides the ability to track any kind of element, whether it being from Flash or HTML. 
		 * Omniture requires that if you are tracking an event, then you must supply the element that caused
		 * the track to happen. Since flash doesn't have real elements, this link element will be used to 
		 * pass into Omniture as a fall back in case we don't have any other kind of element to send them.
		 * 
		 * @private
		 * @function
		 * @memberOf $.TrackIt.prototype
		 */
		InitDudLink: function() {
			if( $.TrackIt.DudHtmlLink !== undefined && this.DudHtmlLink === undefined ) {
				this.DudHtmlLink = $.TrackIt.DudHtmlLink;
			} else if( this.DudHtmlLink === undefined ) { 
				// create a dud link, hide it. this is used for links from flash
				$.TrackIt.DudHtmlLink = this.DudHtmlLink = $("<a></a>")
					.css("display","none");

				$(document.body).append( this.DudHtmlLink );
			}
		},
		
		/**
		 * This function will merge in the proper tracking module, whether it is Omniture or Google Analytics
		 * @private
		 * @function
		 * @memberOf $.TrackIt.prototype
		 * @param {string} module a string representation of what module to load, "ga", "omniture", etc.
		 */
		loadTrackingModule: function( module ) {
			switch( module.toLowerCase() ) {
				case "googleanalytics":
				case "google":
				case "ga":
					$.extend( this, window.TrackingModules.GoogleAnalytics );
					break;
				case "omniture":
				case "omni":
					$.extend( this, window.TrackingModules.Omniture );
					break;
				default:
					console.error("WARNING: No valid tracking module was specified!"); 
			}
		},
		
		/**
		 * This function is useful when loading an external XML file as the basis for the tracking spec. 
		 * A XML file path is passed and is processed via an XmlHttpRequest. An optional object can be passed
		 * that will be merged with the XML document that is loaded. The option object can be typically used
		 * for passing extra keys that will be holders within a variables value.
		 * @private
		 * @function
		 * @memberOf $.TrackIt.prototype
		 * @param {string} xmlUrl the URL of where the trackData XML file lives. 
		 * @param {object} extraTrackData an object that will be merged into the XML file once it is loaded, useful for custom functions as holders 
		 */
		loadXml: function( xmlUrl, extraTrackData ) {
			var self = this;
			
			// lets go, ajax time
			$.ajax({
				'url': xmlUrl,
				'complete': function(xml) {
					// if no data comes back, do nothing
					if( xml.responseText.length > 0 ) {
						// set processed data 
						self.TrackData = $.extend( self.parseXml(xml.responseText), extraTrackData );
					}
										
					// since we're ready now, go, this should change to a custom event
					self.ready();
				}
			});		
		},
		/** 
		 * This function will take an XML as a string an call "getXmlObject" which will give a XML DOM object that 
		 * can be used to parse. It does not use any of the jQuery find methods to parsing the XML since jQuery will
		 * make all of the tag names uppercase which is not desired.
		 * @private
		 * @function
		 * @memberOf $.TrackIt.prototype
		 * @param {string} XML the string as an XML document
		 */
		parseXml: function( xml ) {
			var trackEvents = {};
			
			// get all of the trackEvent nodes.
			xml = this.getXmlObject(xml).getElementsByTagName("trackEvent");
			
			$(xml).each(function() {
				if( this.tagName ) {
					var trackEvent = $(this);
					var newTrackEvent = {
						urlMap: trackEvent.attr('urlMap'),
						event: trackEvent.attr('event')
					};
					
					$(this.childNodes).each(function(){
						if( this.tagName ) { 
							newTrackEvent[ this.tagName ] = $(this).text();	
						}
					});
						
					trackEvents[ trackEvent.attr('eventName') ] = newTrackEvent;
				}
			});
			
			return trackEvents;
		},
		/**
		 * Since we cannot use jQuery to parse the XML, we will need to create either an ActiveXObject for IE or use a 
		 * standardized method to retrieve a valid XML DOM.
		 * @function
		 * @private
		 * @memberOf $.TrackIt.prototype
		 * @param {string} str a string that contains XML
		 */
		getXmlObject: function(str) {
			var out;
			// create ActiveXObject for IE
			try {
				var xml = ( $.browser.msie )? new ActiveXObject("Microsoft.XMLDOM") : new DOMParser();
				xml.async = false;
			} catch(e){ 
				throw new Error("XML Parser could not be instantiated");
			};
			
			// get the XML DOM object itself and return it.
			try {
				if($.browser.msie) 
					out = (xml.loadXML(str)) ? xml : false;
				else 
					out = xml.parseFromString(str, "text/xml");
			} catch(e){
				throw new Error("Error parsing XML string");
			};
			
			return out;
		},
		/**
		 * @property {boolean} whether or not the plugin is ready
		 */
		isReady: false,
		/**
		 * When the plugin is ready, we will fire all of these callbacks. If the plugin is already ready
		 * and I get a new function, this will call it immediately.
		 * @param {function} callback a callback method to be called when the plugin is ready
		 */
		ready: function( callback ) {
			
			// if its already ready, just run it
			if(  this.isReady ) { 
				callback.apply( self ); 
			} else {
				
				// if we're not ready and its a function, queue it up
				if( $.isFunction( callback ) ) {
					this.__READY.push( callback );
					
				// if this function is called with no arguments, then the ready event fired
				} else if( arguments.length === 0 ) {
					
					// set ready to true
					this.isReady = true;
					
					// dequeue and run all the functions
					$.each( this.__READY, function(){ 
						this.apply( self );
					});
					
					// remove the callbacks
					delete this.__READY;
				}
			}
		},
		/**
		 * TrackIt has the ability to attach events during the tracking process. Some of these
		 * events include: ready, afterProcessHolders, beforeProcessHolders, beforeTrack, afterTrack.
		 * 
		 * @function
		 * @private
		 * @memberOf $.TrackIt.prototype
		 * @param {string} eventType the kind of event that you wish to attach the callback method onto
		 * @param {function} callback a callback method to be called when the event type has been triggered
		 */
		addCallback: function( eventType, callback ) {
			if( this.settings.ShowDebugInfo ) { console.info( "$.TrackIt.addCallback() - Adding Callback to '" + eventType + "'", callback ); }

			if( $.inArray(eventType, this.__GLOBAL_EVENTS > -1 ) ) { 
				this.__CALLBACK_EVENTS[ eventType ].push( callback );
			} else {
				if( this.settings.ShowDebugInfo ) { 
					console.warn( "$.TrackIt.addCallback() - Failed to add callback to '" + eventType + "'! ", callback );
				}
			}
		},
		
		/**
		 * This function is simply a list of callback functions that should be run when the tracker object
		 * has been fully initialized and is ready to begin tracking. This function will eventually be an 
		 * event that will be listened upon so that extensions can be made ontop of this plugin.
		 * @function
		 * @private
		 * @memberOf $.TrackIt.prototype
		 * @param {string} eventType the event that we are triggering
		 * @param {object} params any parameters that are specific to this track will get passed into the callback
		 */
		fireEvent: function( eventType, params ) { 
			var retVal = true;
			
			var self = this;
			
			if( typeof eventType === "string" ) {
				if( this.__CALLBACK_EVENTS[eventType] && this.__CALLBACK_EVENTS[eventType].length > 0 ) {
					if( this.settings.ShowDebugInfo ) { console.group( "$.TrackIt.fireEvent() - Firing Global Event '" + eventType + "'" ); }

					$.each( this.__CALLBACK_EVENTS[eventType], function(){ 
						// if false is explicitly sent back, return false
						if( this.apply( self, [ params ] ) === false ) {
							retVal = false;
						} 
					});

					if( this.settings.ShowDebugInfo ) { console.groupEnd(); }
				}
				
				// check that params has a key, and check to see if that key has an eventType to throw and is a function
				if( params && params.key && this.TrackData[params.key] && 
					this.TrackData[params.key][eventType] && $.isFunction( this.TrackData[params.key][eventType] ) 
					) {
					// it much be called from track data
					if( this.settings.ShowDebugInfo ) { console.info( "$.TrackIt.fireEvent() - Firing Local Event '" + eventType + "'" ); }
					
					// if false is explicitly sent back, return false
					if( this.TrackData[params.key][eventType].apply( self, [ params ] ) === false ) {
						retVal = false;
					}
				}
			}
			
			return retVal;
		},
		
		/**
		 * Function that will track an event. A key is used to map to the proper parameters that will
		 * be passed to the tracker itself. The options is an object where each key is a holder. This is
		 * when it is necesary to pass dynamic values into a tracking string.
		 * @function
		 * @memberOf $.TrackIt.prototype
		 * @param {string} key the name of the event to get the data from
		 * @param {object} options an object where each key will be processed as a holder, options.ele can also be a HtmlLinkElement
		 */
		track: function(key, options) {
			// if a string comes back as options, this is most likely flash, so eval it
			if( typeof options === "string" ) {
				// this was in the jquery library, line 3725
				options = window["eval"]("(" + options + ")");
			} else if( options == null ) {
				options = {};
			}
		
			// log that a track event has occured, show options and key that was caught
			if( this.settings.ShowDebugInfo ) { console.groupCollapsed( "$.TrackIt.track() - key='", key, "' options=", options); }
			
			// if the key is a valid track key
			if( this.TrackData[key] !== undefined ) {	
			
				// get the parsed version of the data (if there are placeholders) 
				var parsedData = this.GetParsedData(key, options);
	
				if( this.fireEvent('beforeTrack', { key: key, options: options, parsedData: parsedData } ) ) {
					// detect what kind of an event that occurred and use the loaded module to track the event
					if (parsedData.event && parsedData.event.toLowerCase() == "pageview") {
						if( this.settings.ShowDebugInfo ) { console.info('$.TrackIt.track()-->DoTrackPageView("' + key + '")'); }
						this.DoTrackPageView(parsedData, options)
					} else {
						if( this.settings.ShowDebugInfo ) { console.info('$.TrackIt.track()-->DoTrackEvent("' + key + '")'); }
						this.DoTrackEvent(parsedData, options);				
					}
					
					this.fireEvent('afterTrack', { key: key, options: options, parsedData: parsedData } );
				} else {
					if( this.settings.ShowDebugInfo ) { console.info("$.TrackIt.track() - beforeTrack returned false. Skipping track."); }
				}
			}
			
			if( this.settings.ShowDebugInfo ) { console.groupEnd(); }
		},
		
		/**
		 * This will return parsed data from the TrackData object. Key and eventType are used to retrieve the 
		 * raw data. ele is passed in so that we can retrieve data from the element itself and use it in the reporting.
		 * 
		 * @private
		 * @function
		 * @memberOf $.TrackIt.prototype
		 * @param {string} key the name of the event to get the data from
		 * @param {object} options contains extra information that will help with integrating the holders
		 */
		GetParsedData: function( key, options ) {
			var retVal = null;
			
			// find out if the key exists in TrackData
			if (this.TrackData[key]) {
				// retrieve it and replace all the holders in each data element
				retVal = cloneObj( this.TrackData[key] );
			
				for (var varName in retVal) {
					if (! $.isFunction( retVal[varName] ) ) {
						retVal[varName] = unescape( this.ReplaceHolders(retVal[varName], key, options) );
					}
				}
			}

			return retVal;
		},
		
		/**
		 * Return an array of all the Holders that exist in this string. A holder is the part of the string that has {}.
		 * 
		 * @private
		 * @function
		 * @memberOf $.TrackIt.prototype
		 * @param {string} str a string with or without a Holder
		 */
		GetPlaceHolderArray: function(str) { return str.match(/\[[^\]]+\]/g); },
		
		/**
		 * This plugin comes with a variety of pre-existing holders that may come convenient to the implementer.
		 *   
		 * @type object
		 * @memberOf $.TrackIt.prototype
		 */
		BuiltInHolders: {
			/**
			 * "ele.text()" of a HtmlElement
			 * @property
			 * @name $.TrackIt.prototype.BuiltInHolders.TEXT
			 * @memberOf $.TrackIt.prototype
			 */
			'TEXT': function() { return $(this).text(); },
			
			/**
			 * title tag of the page
			 * @field
			 * @name $.TrackIt.prototype.BuiltInHolders.TITLE
			 * @memberOf $.TrackIt.prototype
			 */
			'TITLE': function() { return document.title; },
			
			/**
			 * the "ele.text()" of the first HtmlHeadingElement
			 * @field
			 * @name $.TrackIt.prototype.BuiltInHolders.H1
			 * @memberOf $.TrackIt.prototype
			 */
			'H1': function() { return $("H1").text(); },
			
			/**
			 * the "ele.alt" attribute of a HtmlElement
			 * @field
			 * @name $.TrackIt.prototype.BuiltInHolders.ALT
			 * @memberOf $.TrackIt.prototype
			 */
			'ALT': function() { return $(this).attr('alt'); },
			
			/**
			 * the destination url of a HtmlLinkElement
			 * @field
			 * @name $.TrackIt.prototype.BuiltInHolders.HREF
			 * @memberOf $.TrackIt.prototype
			 */
			'HREF': function() { 
				var url = $(this).attr('href');
				
				// IE returns the entire URL if you grab its href
				// so trim out the host name.
				if( url.indexOf( location.host ) > -1 )  {
					url = url.substr( url.indexOf( location.host ) + location.host.length );
				}
				return url;
			},
			
			/**
			 * returns the value of what the HtmlAttribute "value" is for the current HtmlElement
			 * @field
			 * @name $.TrackIt.prototype.BuiltInHolders.ATTR
			 * @memberOf $.TrackIt.prototype
			 */
			'ATTR': function(o) { return $(this).attr(o.value); },
			
			/**
			 * similar to ATTR however, will check parent elements and returns the first occurrance
			 * @field
			 * @name $.TrackIt.prototype.BuiltInHolders.ATTR+
			 * @memberOf $.TrackIt.prototype
			 */
			'ATTR+': function(o) { 
				var pars = $(this).parents('*[' + o.value + ']'); 								
				if (pars.length > 0) {
					return  $(pars[0]).attr(o.value); // get the attribute		
				}
			},
			
			/**
			 * the file name of the page
			 * @field
			 * @name $.TrackIt.prototype.BuiltInHolders.PAGENAME
			 * @memberOf $.TrackIt.prototype
			 */
		    'PAGENAME': function() { 
				var fn = window.location.pathname.split('/');
				return fn[fn.length-1];
			},
			/**
			 * the full URL of the page
			 * @function
			 * @memberOf $.TrackIt.prototype
			 */
			'URL': function() { return document.location.pathname; }
		},
		
		/**
		 * This function will get all of the holders within a string and replace it based on the holder. The set of options
		 * that was passed will be processed here
		 * 
		 * @private
		 * @function
		 * @memberOf $.TrackIt.prototype
		 * @param {string} str a pre-parsed string that main contain holders
		 * @param {string} key the track key event that is being tracked
		 * @param {object} options an object where each key will correspond to a holder
		 */
		ReplaceHolders: function(str, key, options){
			var skipHolders = true;
			
			// throw beforeReplaceHolders event
			if( this.TrackData[key]["beforeReplaceHolders"] && $.isFunction( this.TrackData[key]["beforeReplaceHolders"] ) ) {
				skipHolders = this.TrackData[key]["beforeReplaceHolders"].apply( this, [{ key: key, str: str, options: options }] );
			}
			
			// get all Holders that exist in this string
			var holders = this.GetPlaceHolderArray(str);

			if( holders && skipHolders !== false ) { 
				// go through each holder
				for (var index = 0; index < holders.length; index++) {
				
					// get the holder
					var holder = holders[index];
					
					// reset the parsed holder
					var parsedHolder = "";
					
					// get rid of the curly braces and split at colon
					var splitArr = holder.toString().substring(1,(holder.length-1)).toString().split(":");
					var command = splitArr[0]; var value = splitArr[1];
					
					// process the existing track key properties first, recognizes functions and string values
					if ( $.isFunction( this.TrackData[key][command] ) ) {
						parsedHolder = this.TrackData[key][command].apply( options.ele || null, [{ instance:this, key:key, value:value }] ); 
					} else if( typeof this.TrackData[key][command] === "string" ) {
						parsedHolder = this.TrackData[key][command];
					}	
					// rerun same rules on the passed options
					else if( options && $.isFunction( options[ command ] ) ) {
						parsedHolder = options[ command ].apply( options.ele || null, [{ instance:this, key:key, value:value }] ); 
					} else if( options && typeof options[ command ] == "string" ) {
						parsedHolder = options[ command ];
						
					// built in holders
					} else if( this.BuiltInHolders[command] && $.isFunction( this.BuiltInHolders[command] ) ) { 
						parsedHolder = this.BuiltInHolders[command].apply( options.ele || null, [{ instance:this, key: key, value:value }] );
					
					} else if( this.BuiltInHolders[command] && typeof this.BuiltInHolders[command] === "string" ) {
						parsedHolder = this.BuiltInHolders[command];
					} else {
						if( this.settings.ShowMissingHolderWarnings && this.settings.ShowDebugInfo ) {
							console.warn( "$.TrackIt.HandleBuiltInHolder() - Missing Holder Detected - '" + command + "' in key '" + key + "'" );
						}
					}
					
					// throw afterReplaceHolders event
					if( this.TrackData[key]["afterReplaceHolders"] && $.isFunction( this.TrackData[key]["afterReplaceHolders"] ) ) {
						retVal = this.TrackData[key]["afterReplaceHolders"].apply( this, [{ key: key, str: str, options: options }] );
						if( retVal ) { str = retVal; }
					}
					
					// replace the parsed value of the holder with the holder itself
					str = str.replace(holder, parsedHolder); 
				}
			}
			
			return str;
		}
	});	
})(jQuery);