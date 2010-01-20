/*************************************************************************
 * jquery.TrackIt.modules.js - Version 2.0
 *************************************************************************
 * @author Aaron Lisman (Aaron.Lisman@ogilvy.com)
 * @author Adam S. Kirschner (AdamS.Kirschner@ogilvy.com)
 * $Rev: 155 $
 * $Date: 2010-01-17 13:28:40 -0500 (Sun, 17 Jan 2010) $
 * $Author: adams.kirschner@ogilvy.com $
 * $HeadURL: https://svn.ogilvy.com/repos/OgilvyInteractive/projects/TrackingPlugin/trunk/js/jquery.trackit.modules.js $
 *************************************************************************
 */
(function($){
	/**
	 * A tracking module needs to declare at least 2 kinds of tracking methods, "TrackEvent" and "TrackPageView". The outer 
	 * shell of $.TrackIt is essentially a wrapper for both of these functions. Each function will receive the data node
	 * of the correct event that was passed. The TrackEvent function will also receive the element that the event fired from.
	 * 
	 * @class
	 * @name TrackingModules
	 */
	window.TrackingModules = {
		/**
		 * !!!!!!!!!!!!!!!!!!!!!! WARNING !!!!!!!!!!!!!!!!!!!!!!!!!!
		 * THIS IMPLEMENTATION WAS NOT TESTED WITH VERSION 2.0 
		 * THESE CALLBACKS SHOULD BE CHECKED AND CONFIRMED WITH 
		 * GOOGLE ANALYTICS!
		 * !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!
		 * @class
		 * @name GoogleAnalytics
		 * @memberOf TrackingModules
		 */
		GoogleAnalytics: {
			/**
			 * @field
			 * @name Type
			 * @type string
			 * @memberOf TrackingModules.GoogleAnalytics
			 */
			Type: "Google Analytics",
			DoTrackEvent: function(data, ele){				
				if( this.settings.ShowDebugInfo ) {
					console.info(data);
				} else {
					pageTracker._trackEvent(data.category, data.action, data.opt_label, data.opt_value);
				}
			},
			DoTrackPageView: function(data){
				if (this.settings.ShowDebugInfo) {
					console.info(data);
				} else {
					pageTracker._trackPageview(data.pageName);
				}
			}
		},
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
				// create new omniture instance
				var s = s_gi(s_account);

				// merge all the data into "s"
				$.extend( s, data );
				
				// these are TrackIt specific attributes used, we don't want this to merge with the tracker at all.
				var excludeVars = [ "type", "event", "urlMap", "customLinkName" ];
				$.each( excludeVars, function() { delete s[this] } );
				
				// omniture needs to know all the variables we are settings asside
				// from just setting it, add all the variable names to an array
				var linkTrackVars = [];
				for( var varName in data ) { 
					if( !( excludeVars[varName] ) ) { linkTrackVars.push( varName ); }
				}
				
				// join the array with and tell omniture these are the variables
				s.linkTrackVars = linkTrackVars.join(',');
				
				// not only do we need set the s.events variable, but also s.linkTrackEvents
				// if an event does get thrown
				if( s.events && s.events.length > 0 ) {
					s.linkTrackEvents = s.events;
				}

				// if in test mode just show what would get reported
				if( this.settings.TestMode && ( this.settings.ShowOnlyReportedData || this.settings.ShowDebugInfo ) ) {
					console.groupCollapsed( "TrackItModules.Omniture.DoTrackEvent() - Track Event Skipped:" );
					console.dir( {"s": s, "data": data} );
					console.groupEnd();
				} else {
					// use a dud link and set the link url and link text if they exist
					if( options['link url'] && options['link text'] ) { 
						this.DudHtmlLink
							.attr('href', options['link url'] )
							.text( options['link text'] );
					}
					
					var dudLink = null;
					if( this.DudHtmlLink && this.DudHtmlLink.length > 0 ) {
						dudLink = this.DudHtmlLink.get(0);
					}
					
					// either send in the HtmlLinkElement that was passed or the dud link
					// customLinkName allows for a custom value 
					s.tl( options.ele || dudLink, data.customLinkType || 'o', data.customLinkName || null);
					
					if( this.settings.ShowDebugInfo || this.settings.ShowOnlyReportedData ) { 
						console.groupCollapsed("TrackItModules.Omniture.DoTrackEvent() - Event tracked successfully.");
						console.dir({"s": s, "data": data });
						console.groupEnd();
					}
					
					// clear the dud link
					this.DudHtmlLink
							.attr('href', '' )
							.text( '' );
							
					// clean up, clear out all the values that were set
					for( var key in data ) { delete s[key]  };
				}
			},
			DoTrackPageView: function( data ) {
			
				// use existing s object from current page
				$.extend( s, data );
				
				// if in test mode AND we're showing some sort of information, we show the data
				if( this.settings.TestMode && ( this.settings.ShowOnlyReportedData || this.settings.ShowDebugInfo ) ) {
					console.groupCollapsed("TrackItModules.Omniture.DoTrackPageView() - Page View tracking is being skipped.")
					console.dir({"s": s, "data": data});
					console.groupEnd();
				} 
				
				// if not in test mode, then actually track it
				if( ! this.settings.TestMode ) {	
					s.t();
					
					// decipher whether or not the tracked information should show
					if( this.settings.ShowDebugInfo || this.settings.ShowOnlyReportedData ) { 
						console.groupCollapsed("TrackItModules.Omniture.DoTrackPageView() - Page View tracked successfully.");
						console.dir({"s": s, "data": data });
						console.groupEnd();
					}
				}
				
				// clean up, clear out all the values that were set
				for( var key in data ) { delete s[key]  };
			}
		}
	}
})(jQuery);