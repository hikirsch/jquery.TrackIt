﻿/**
 * This function does nothing. It is mostly used when initializing a fake console object.
 * 
 * @name Void
 * @function
 * @memberOf window
 */
;;; var Void=function(){};if(!("console" in window)){window.console={};};$.each(["groupCollapsed","groupEnd","group","warn","info","dir","warn","error","log"], function(i,s) { if (!( s in console ) ) { window.console[s] = Void; } });
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

/**
 * @name trim
 * @return {string} a string with no whitespace on the sides
 * @memberOf String
 */
String.prototype.trim = function() { return this.replace(/^\s+|\s+$/g,""); };

/*************************************************************************
 * jquery.TrackIt.js
 *************************************************************************
 * @author Adam S. Kirschner (me@adamskirschner.com)
 *************************************************************************
 */
(function($) {	
	/**
	 * Main Constructor. Initializes the main Tracker object, merges in the correct tracking module and returns
	 * an instance of the tracker itself. This function will also attach a click event using jQuery.live
	 * @constructor
	 * @memberOf $
	 * @name TrackIt
	 * @param {string} trackerModule the Tracking Module to use, either ga or omniture (other aliases exist)
	 * @param {object} options a set of options that can be used to override $.TrackIt.defaults
	 */
	$.TrackIt = function(trackerModule, options) {
		var self = this;
		
		// allow options to override default settings
		this.settings = $.extend(this.defaults, options.Settings);
		
		;;; if( this.settings.ShowDebugInfo ) { console.group( "$.TrackIt() - Init" ); }
		
		// some debug info 
		;;; if( this.settings.TestMode && this.settings.ShowDebugInfo ) {
		;;; 	console.groupCollapsed( "$.TrackIt() - Test Mode is Enabled, Tracking Disabled!" );
		;;; } else if( this.settings.ShowDebugInfo ) {
		;;; 	console.info( "$.TrackIt() - Tracking Enabled. Debug Mode On." );
		;;; }
		
		// Omniture does suck with flash, needs a "fake link"
		this.InitDudLink();
		
		// merge the tracking Module object settings into this object
		this.loadTrackingModule(trackerModule);
		
		// set ready to start accepting new events
		this.__READY = [];
		
		// create an empty track queue
		this.__TRACK_QUEUE = [];
		
		this.ExcludeAttribute("key");
		this.ExcludeAttribute("type");
		
		// extend global placeholders
		if( options.Holders ) { $.extend( this.Holders, options.Holders ); }
		
		// use live to set global click listener
		$(this.settings.TrackKeyCssSelector).live('click', function(){ self.HandleGenericClick( this ); });
	
		// TODO: use jquery native custom events
		// reset all track events
		this.__CALLBACK_EVENTS = {};
		$.each( this.__GLOBAL_EVENTS, function() { self.__CALLBACK_EVENTS[this + ''] = []; } );
		
		// go through the plugins and begin their init process
		if( options.Plugins ) { $.each( options.Plugins, function() { 
			if( this["Init"] && $.isFunction( this["Init"] ) ) { this.Init.apply(self); } 
		});	}
		
		;;; if( this.settings.ShowDebugInfo ) { console.groupEnd(); }
		
		// if there was an xml file specified, load it	
		if( options.XmlUrl ) {
			// load the track data from an Xml File, send in an extra data that is set (if any)
			this.loadXml(options.XmlUrl, options.Data);
		} else {
			// set the track data
			this.Data = $.extend({}, options.Data);
			
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
		__EXCLUDE_VARS: [],
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
			TrackKeyCssSelector: "*[trackKey]",
			
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
			if( key !== undefined && key.length > 0 ) {
				
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
					.css("display","none")
					.attr("href","#nojs");

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
					$.extend( this, window.TrackItModules.GoogleAnalytics );
					break;
				case "omniture":
				case "omni":
					$.extend( this, window.TrackItModules.Omniture );
					break;
				default:
					;;; console.error("WARNING: No valid tracking module was specified!"); 
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
		loadXml: function( xmlUrl, extraData ) {
			var self = this;
			
			// lets go, ajax time
			$.ajax({
				'url': xmlUrl,
				'complete': function(xml) {
					// if no data comes back, do nothing
					if( xml.responseText.length > 0 ) {
						// set processed data 
						self.Data = $.extend( self.parseXml(xml.responseText), extraData );
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
			var self = this;
			
			// get all of the trackEvent nodes.
			xml = this.getXmlObject(xml).getElementsByTagName("trackEvent");
			
			$(xml).each(function() {
				if( this.tagName ) {
					var trackEvent = $(this);
					var newTrackEvent = {}
					
					// read in all the attributes (except key)
					for( var i = 0; i < this.attributes.length; i++ ) {
						var nodeName = this.attributes[i].nodeName;
						
						// key is captured manually as it is primary to a structure
						if( nodeName.toLowerCase() != "key" ) { 
							
							// store this attribute
							newTrackEvent[ nodeName ] = trackEvent.attr(nodeName);
							
							// remember these values so that when we do reporting, we can take them out.
							if( $(self.__EXCLUDE_VARS).index(nodeName) < 0 ) { self.__EXCLUDE_VARS.push(nodeName); }
						}
					};
					
					$(this.childNodes).each(function(){
						if( this.tagName ) { 
							newTrackEvent[ this.tagName ] = $(this).text();	
						}
					});
						
					trackEvents[ trackEvent.attr('key') ] = newTrackEvent;
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
			var self = this;
			
			// if its already ready, just run it
			if(  this.isReady ) { 
				callback.apply( self, [] ); 
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
						this.apply( self, [] );
					});
					
					// remove the callbacks
					delete this.__READY;
					
					// now that we're really ready, lets run all the events that may have already been fired.
					this.RunTrackQueue();
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
			;;; if( this.settings.ShowDebugInfo ) { console.info( "$.TrackIt.addCallback() - Adding Callback to '" + eventType + "'", callback ); }

			if( $.inArray(eventType, this.__GLOBAL_EVENTS > -1 ) ) { 
				this.__CALLBACK_EVENTS[ eventType ].push( callback );
			} else {
				;;; if( this.settings.ShowDebugInfo ) { 
				;;; 	console.warn( "$.TrackIt.addCallback() - Failed to add callback to '" + eventType + "'! ", callback );
				;;; }
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
					;;; if( this.settings.ShowDebugInfo ) { console.group( "$.TrackIt.fireEvent() - Firing Global Event '" + eventType + "'" ); }

					$.each( this.__CALLBACK_EVENTS[eventType], function(){ 
						// if false is explicitly sent back, return false
						if( this.apply( self, [ params ] ) === false ) {
							retVal = false;
						} 
					});

					;;; if( this.settings.ShowDebugInfo ) { console.groupEnd(); }
				}
				
				// check that params has a key, and check to see if that key has an eventType to throw and is a function
				if( params && params.key && this.Data[params.key] && 
					this.Data[params.key][eventType] && $.isFunction( this.Data[params.key][eventType] ) 
					) {
					// it much be called from track data
					;;; if( this.settings.ShowDebugInfo ) { console.info( "$.TrackIt.fireEvent() - Firing Local Event '" + eventType + "'" ); }
					
					// if false is explicitly sent back, return false
					if( this.Data[params.key][eventType].apply( self, [ params ] ) === false ) {
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
			if( ! this.isReady ) { 			
				this.QueueTrackEvent(key, options);
				return;
			}
			
			// if a string comes back as options, this is most likely flash, so eval it
			if( typeof options === "string" ) {
				// this was in the jquery library, line 3725
				options = window["eval"]("(" + options + ")");
			} else if( options == null ) {
				options = {};
			}
		
			// if the key is a valid track key
			if( this.Data[key] !== undefined ) {	
				// log that a track event has occured, show options and key that was caught
				;;; if( this.settings.ShowDebugInfo ) { console.groupCollapsed( "$.TrackIt.track() - key='", key, "' options=", options); }
			
				// get the parsed version of the data (if there are placeholders) 
				var parsedData = this.GetParsedData(key, options);
	
				if( this.fireEvent('beforeTrack', { key: key, options: options, parsedData: parsedData } ) ) {
					// detect what kind of an event that occurred and use the loaded module to track the event
					if (parsedData.type && parsedData.type.toLowerCase() == "pageview") {
						;;; if( this.settings.ShowDebugInfo ) { console.info('$.TrackIt.track()-->DoTrackPageView("' + key + '")'); }
						this.DoTrackPageView(parsedData, options)
					} else {
						;;; if( this.settings.ShowDebugInfo ) { console.info('$.TrackIt.track()-->DoTrackEvent("' + key + '")'); }
						this.DoTrackEvent(parsedData, options);				
					}
					
					this.fireEvent('afterTrack', { key: key, options: options, parsedData: parsedData } );
				} else {
					;;; if( this.settings.ShowDebugInfo ) { console.info("$.TrackIt.track() - beforeTrack returned false. Skipping track."); }
				}

				;;; if( this.settings.ShowDebugInfo ) { console.groupEnd(); }

			} else {
				;;; if( this.settings.ShowDebugInfo ) { console.error("$.TrackIt.track() - Key Not Found! - key='", key, "' options=", options ); }
			}
			
			
		},
		
		/**
		 * Since TrackIt can make an AJAX request and not have all the necessary components, it becomes necessary 
		 * to queue up the events and fire them when the plugin has actually finished its init process.
		 * @function
		 * @memberOf $.TrackIt.prototype
		 * @param {string} key the name of the event
		 * @param {object} options the trackit options object
		 */
		QueueTrackEvent: function( key, options ) {
			this.__TRACK_QUEUE.push({
				key: key,
				options: options				
			});
		},
		
		/**
		 * This function will get called after ready() has finished. 
		 * @function
		 * @memberOf $.TrackIt.prototype
		 */
		RunTrackQueue: function() {
		    var obj = null;
		    while (this.__TRACK_QUEUE.length > 0) {
		        obj = this.__TRACK_QUEUE.pop();
		        this.track(obj.key, obj.options);
		    } 
		},
		
		/**
		 * There are certain data key/values that we need to ditch before we process the data,
		 * for example the track key and type. 
		 * @function
		 * @memberOf $.TrackIt.prototype
		 * @param {string} attr the key to exclude from the data object
		 */
		ExcludeAttribute: function(attr) { 
			this.__EXCLUDE_VARS.push(attr);
		},
		
		/**
		 * This will return parsed data from the Data object. Key and eventType are used to retrieve the 
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
			
			// find out if the key exists in Data
			if (this.Data[key]) {
				// retrieve it and replace all the holders in each data element
				retVal = cloneObj( this.Data[key] );
			
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
		Holders: {
			/**
			 * "ele.text()" of a HtmlElement
			 * @property
			 * @name $.TrackIt.prototype.Holders.TEXT
			 * @memberOf $.TrackIt.prototype
			 */
			'TEXT': function() { return $(this).text().trim(); },
			
			/**
			 * title tag of the page
			 * @field
			 * @name $.TrackIt.prototype.Holders.TITLE
			 * @memberOf $.TrackIt.prototype
			 */
			'TITLE': function() { return document.title.trim(); },
			
			/**
			 * the "ele.text()" of the first HtmlHeadingElement
			 * @field
			 * @name $.TrackIt.prototype.Holders.H1
			 * @memberOf $.TrackIt.prototype
			 */
			'H1': function() { return $("H1").text().trim(); },
			
			/**
			 * the "ele.alt" attribute of a HtmlElement
			 * @field
			 * @name $.TrackIt.prototype.Holders.ALT
			 * @memberOf $.TrackIt.prototype
			 */
			'ALT': function() { return $(this).attr('alt'); },
			
			/**
			 * the destination url of a HtmlLinkElement
			 * @field
			 * @name $.TrackIt.prototype.Holders.HREF
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
			 * @name $.TrackIt.prototype.Holders.ATTR
			 * @memberOf $.TrackIt.prototype
			 */
			'ATTR': function(o) { return $(this).attr(o.value); },
			
			/**
			 * similar to ATTR however, will check parent elements and returns the first occurrance
			 * @field
			 * @name $.TrackIt.prototype.Holders.ATTR+
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
			 * @name $.TrackIt.prototype.Holders.PAGENAME
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
			if( this.Data[key]["beforeReplaceHolders"] && $.isFunction( this.Data[key]["beforeReplaceHolders"] ) ) {
				skipHolders = this.Data[key]["beforeReplaceHolders"].apply( this, [{ key: key, str: str, options: options }] );
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
					if ( $.isFunction( this.Data[key][command] ) ) {
						parsedHolder = this.Data[key][command].apply( options.ele || null, [{ instance:this, key:key, value:value }] ); 
					} else if( typeof this.Data[key][command] === "string" ) {
						parsedHolder = this.Data[key][command];
					}	
					// rerun same rules on the passed options
					else if( options && $.isFunction( options[ command ] ) ) {
						parsedHolder = options[ command ].apply( options.ele || null, [{ instance:this, key:key, value:value }] ); 
					} else if( options && typeof options[ command ] == "string" ) {
						parsedHolder = options[ command ];
						
					// built in holders
					} else if( this.Holders[command] && $.isFunction( this.Holders[command] ) ) { 
						parsedHolder = this.Holders[command].apply( options.ele || null, [{ instance:this, key: key, value:value }] );
					
					} else if( this.Holders[command] && typeof this.Holders[command] === "string" ) {
						parsedHolder = this.Holders[command];
					} else {
						;;; if( this.settings.ShowMissingHolderWarnings && this.settings.ShowDebugInfo ) {
						;;; 	console.warn( "$.TrackIt.HandleBuiltInHolder() - Missing Holder Detected - '" + command + "' in key '" + key + "'" );
						;;; }
					}
					
					// throw afterReplaceHolders event
					if( this.Data[key]["afterReplaceHolders"] && $.isFunction( this.Data[key]["afterReplaceHolders"] ) ) {
						retVal = this.Data[key]["afterReplaceHolders"].apply( this, [{ key: key, str: str, options: options }] );
						if( retVal ) { str = retVal; }
					}
					
					// replace the parsed value of the holder with the holder itself
					str = str.replace(holder, parsedHolder); 
					
					// if this string has more holders in it from another holder, we have to recurse through it
					str = this.ReplaceHolders( str, key, options );
				}
			}
			
			return str;
		}
	});	
})(jQuery);/*************************************************************************
 * jquery.TrackIt.modules.js
 *************************************************************************
 * @author Adam S. Kirschner (me@adamskirschner.com)
 *************************************************************************
 */
(function($){
	/**
	 * A tracking module needs to declare at least 2 kinds of tracking methods, "TrackEvent" and "TrackPageView". The outer 
	 * shell of $.TrackIt is essentially a wrapper for both of these functions. Each function will receive the data node
	 * of the correct event that was passed. The TrackEvent function will also receive the element that the event fired from.
	 * 
	 * @class
	 * @name TrackItModules
	 */
	window.TrackItModules = {
		/**
		 * These are the Google Analytics methods needed for TrackIt to track.
		 * @class
		 * @name GoogleAnalytics
		 * @memberOf TrackItModules
		 */
		GoogleAnalytics: {
			/**
			 * @field
			 * @name Type
			 * @type string
			 * @memberOf TrackItModules.GoogleAnalytics
			 */
			Type: "Google Analytics",
			
			/**
			 * This is the Google Analaytics implementation of the TrackEvent. This handles all special cases in terms 
			 * of being able to track the proper variables.
			 * 
			 * @param {Object} data the parsed data that should be reported.
			 * @param {HtmlElement} ele the HtmlElement that the event fired from
			 */
			DoTrackEvent: function(data, ele){
				;;; if( this.settings.TestMode && ( this.settings.ShowOnlyReportedData || this.settings.ShowDebugInfo ) ) {
				;;; 	console.groupCollapsed( "TrackItModules.GoogleAnalytics.DoTrackEvent() - Track Event Skipped:" );
				;;; 	console.dir({ "data": data });
				;;; 	console.groupEnd();
				;;; } else {
						pageTracker._trackEvent(data.category, data.action, data.opt_label, data.opt_value);
					
				;;; 	if( this.settings.ShowDebugInfo || this.settings.ShowOnlyReportedData ) { 
				;;; 		console.groupCollapsed("TrackItModules.GoogleAnalytics.DoTrackEvent() - Event tracked successfully.");
				;;; 		console.dir({ "data": data });
				;;;		 	console.groupEnd();
				;;; 	}
				;;; }
			},
			DoTrackPageView: function(data){
				;;; if( this.settings.TestMode && ( this.settings.ShowOnlyReportedData || this.settings.ShowDebugInfo ) ) {
				;;; 	console.groupCollapsed( "TrackItModules.GoogleAnalytics.DoTrackPageView() - Track Event Skipped:" );
				;;; 	console.dir({ "data": data });
				;;; 	console.groupEnd();
				;;; } else {
						pageTracker._trackPageview(data.pageName);
					
				;;; 	if( this.settings.ShowDebugInfo || this.settings.ShowOnlyReportedData ) { 
				;;; 		console.groupCollapsed("TrackItModules.GoogleAnalytics.DoTrackPageView() - Event tracked successfully.");
				;;; 		console.dir({ "data": data });
				;;;		 	console.groupEnd();
				;;; 	}
				;;; }
			}
		},
		
		/**
		 * These are the Omniture methods needed for TrackIt to track.
		 * @class
		 * @name Omniture
		 * @memberOf TrackItModules
		 */
		Omniture: {
			Type: "Omniture",
			/**
			 * This is the omniture implementation of the TrackEvent. This handles all special cases in terms of being able
			 * to track the proper variables.
			 * 
			 * @param {Object} data the parsed data that should be reported.
			 * @param {HtmlElement} ele the HtmlElement that the event fired from
			 */
			DoTrackEvent: function(data, options){
				"s:nomunge";
				// create new omniture instance
				var s = s_gi(s_account);

				// merge all the data into "s"
				$.extend( s, data );
				
				// TODO: create method in core to exclude data set
				// these are TrackIt specific attributes used, we don't want this to merge with the tracker at all.
				$.each( this.__EXCLUDE_VARS, function() { delete s[this] } );
				
				// omniture needs to know all the variables we are settings asside
				// from just setting it, add all the variable names to an array
				
				var linkTrackVars = [];
				for( var varName in data ) { 
					if( $(this.__EXCLUDE_VARS).index(varName) == -1 ) { linkTrackVars.push( varName ); }
				}
				
				// join the array with and tell omniture these are the variables
				s.linkTrackVars = linkTrackVars.join(',');
				
				// not only do we need set the s.events variable, but also s.linkTrackEvents
				// if an event does get thrown
				if( s.events && s.events.length > 0 ) {
					s.linkTrackEvents = s.events;
				}

				// if in test mode just show what would get reported
			;;; if( this.settings.TestMode && ( this.settings.ShowOnlyReportedData || this.settings.ShowDebugInfo ) ) {
			;;; 	console.groupCollapsed( "TrackItModules.Omniture.DoTrackEvent() - Track Event Skipped:" );
			;;; 	console.dir( {"s": s, "data": data} );
			;;; 	console.groupEnd();
			;;; } else {
			 		// use a dud link and set the link url and link text if they exist
			 		if (data['dudLinkUrl'] && data['dudLinkText'] ) { 
			 			this.DudHtmlLink
			 				.attr('href', data['customLinkUrl'] )
			 				.text( data['dudLinkText'] );
			 		}

			 		// either send in the HtmlLinkElement that was passed or the dud link
			 		// customLinkName allows for a custom value 
			 		s.tl( options.ele || this.DudHtmlLink.get(0), data.customLinkType || 'o', data.customLinkName || null );
            
			;;; 	if( this.settings.ShowDebugInfo || this.settings.ShowOnlyReportedData ) { 
			;;; 		console.groupCollapsed("TrackItModules.Omniture.DoTrackEvent() - Event tracked successfully.");
			;;; 		console.dir({"s": s, "data": data });
			;;; 		console.groupEnd();
			;;; 	}
			
			 		// clear the dud link
					this.DudHtmlLink
							.attr('href', '#nojs' )
							.text( '' );
			
					// clean up, clear out all the values that were set
			 		for( var key in data ) { delete s[key]  };
			;;; }
			},
			DoTrackPageView: function( data ) {
				"s:nomunge";
				// use existing s object from current page
				$.extend( s, data );
				
				// TODO: create method in core to exclude data set
				// these are TrackIt specific attributes used, we don't want this to merge with the tracker at all.
				$.each( this.__EXCLUDE_VARS, function() { delete s[this] } );
				
				// if in test mode AND we're showing some sort of information, we show the data
			;;;	if( this.settings.TestMode && ( this.settings.ShowOnlyReportedData || this.settings.ShowDebugInfo ) ) {
			;;;		console.groupCollapsed("TrackItModules.Omniture.DoTrackPageView() - Page View tracking is being skipped.")
			;;;		console.dir({"s": s, "data": data});
			;;;		console.groupEnd();
			;;;	} 
				
				// if not in test mode, then actually track it
			;;;	if( ! this.settings.TestMode ) {	
					s.t();
					
					// decipher whether or not the tracked information should show
			;;;		if( this.settings.ShowDebugInfo || this.settings.ShowOnlyReportedData ) { 
			;;;			console.groupCollapsed("TrackItModules.Omniture.DoTrackPageView() - Page View tracked successfully.");
			;;;			console.dir({"s": s, "data": data });
			;;;			console.groupEnd();
			;;;		}
			;;;	}
				
				// clean up, clear out all the values that were set
				for( var key in data ) { delete s[key]  };
			}
		}
	}
})(jQuery);/*************************************************************************
 * jquery.TrackIt.plugins.js
 *************************************************************************
 * @author Adam S. Kirschner (me@adamskirschner.com)
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
				;;; if( this.settings.ShowDebugInfo ) { 
				;;; 	console.groupCollapsed( "$.TrackItPlugins.DataSanityCheck() - Results" );
				;;; 	console.dir( holderStatus );
				;;; 	console.groupEnd();
				;;; }
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
			Init: function() { this.ready( $.TrackItPlugins.CopyPropToEVar.Go ); },
			
			/**
			 * Go function for the Copy prop to eVar. Implementation for this plugin is here.
			 * 
			 * @function
			 * @name Go
			 * @memberOf TrackItPlugins.CopyPropToEVar
			 */
			Go: function() { 
				;;; if( this.settings.ShowDebugInfo ) { console.groupCollapsed( "TrackItPlugins.CopyPropToEVar.Go() - Results" ); }
							
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
				
				;;; if( this.settings.ShowDebugInfo ) { 
				;;; 	console.dir(newEVars);
				;;; 	console.groupEnd(); 
				;;; }
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
					;;; if( this.settings.ShowDebugInfo ) { console.info("$.TrackItPlugins.CheckUrlMapping.Go() - Deep Link Detected, Disabling Url Mapping"); }
				} else {	
					// the feature is enabled, so show info that it's going to process
					;;; if( this.settings.ShowDebugInfo ) { console.group("$.TrackItPlugins.CheckUrlMapping.Go() - Enabled"); }
					;;; if( this.settings.ShowDebugInfo ) { console.info("$.TrackItPlugins.CheckUrlMapping.Go() - Check against URL: ", document.location.pathname); }
					
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
									;;; if( that.settings.ShowDebugInfo ) { console.info("TrackItPlugins.CheckUrlMapping.Go() - Found Key: '" + trackKey + "'"); }
									that.track( trackKey );
									found = true;
								}
							});
						}
					}
					
					;;; if( this.settings.ShowDebugInfo && ! found ) { console.info("TrackItPlugins.CheckUrlMapping.Go() - Key Not Found!"); } 
				}
				
				;;; if( this.settings.ShowDebugInfo ) { console.groupEnd(); }
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
					;;; if( this.settings.ShowDebugInfo ) { console.info("TrackItPlugins.RecordLastTrack() - Last data set saved!"); }
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
					;;; if( options.instance.settings.ShowDebugInfo ) { console.warn( "TrackItPlugins.RecordLastTrack() - LAST value request not found '" + options.value + "'")}
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
				;;; if( self.settings.ShowDebugInfo ) { console.groupCollapsed( "$.TrackItPlugins.CssSelector() - Enabled'" ); }
				
				// go through each track key
				for( var trackKey in self.Data ) {
					
					// get the selector and make sure its something
					var selector = this.Data[trackKey].cssSelector;
					if( selector && selector.length > 0 ) {
				
						// set our event
						(function(selector, trackKey) {
							$(selector).live("click", function() { 
								self.track( trackKey, { ele: this } );
							});
						}(selector,trackKey));

						;;; if( self.settings.ShowDebugInfo ) { console.info( '"' + selector + '" --> "' + trackKey + '"' ); }
					}
				}

				;;; if( self.settings.ShowDebugInfo ) { console.groupEnd(); }
			}
		},
		
		/**
		 * This plugin will change all values to lowercase.
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
				;;; if( this.settings.ShowDebugInfo ) { console.info( "$.TrackItPlugins.ToLowerCase() - Enabled'" ); }
			},
			
			/** 
			 *  
			 * @function
			 * @name ToLowerCase.Go
			 * @memberOf $.TrackItPlugins
			 */
			Go: function( options ) {
				var self = this;
				;;; if( self.settings.ShowDebugInfo ) { console.group( "$.TrackItPlugins.ToLowerCase() - Executing'" ); }
				
				var parsedData = options.parsedData;
				
				// go through each track key
				for( var key in parsedData ) {
					if( $.isFunction( parsedData[key].toLowerCase ) ) {
						parsedData[ key ] = parsedData[key].toLowerCase();
					}
				}

				;;; if( self.settings.ShowDebugInfo ) { console.groupEnd(); }
			}
		}
	}
})(jQuery);
