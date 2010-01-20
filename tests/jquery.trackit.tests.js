var TrackItTests = {
	/**
	 * Checks to make sure that the tracking module gets created and that Omniture is available.
	 */
	InitTrackItOmniture: function() { 
		var tracker = $.initTrackIt('omniture',{});
		equals( tracker.Type, 'Omniture', '$.TrackIt.Type is correct!' );
		ok( jQuery.isFunction( tracker.DoTrackPageView ), '$.TrackIt.DoPageView is defined' );
		ok( jQuery.isFunction( tracker.DoTrackEvent ), '$.TrackIt.DoTrackEvent is defined' ); 
	},
	/**
	 * Checks to make sure that the tracking module gets created and that Google Analytics is available.
	 */
	InitTrackItGoogleAnalytics: function() { 
		var tracker = $.initTrackIt('omniture',{});
		equals( tracker.Type, 'Omniture', '$.TrackIt.Type is correct!' );
		ok( jQuery.isFunction( tracker.DoTrackPageView ), '$.TrackIt.DoPageView is defined' );
		ok( jQuery.isFunction( tracker.DoTrackEvent ), '$.TrackIt.DoTrackEvent is defined' ); 
	},
	GetPlaceHolderArray: function() {
		var tracker = $.initTrackIt('omniture',{});
		var testHolder = 'some text [holderA] some more text [holderB] some other text [holderC]';
		var holders = tracker.GetPlaceHolderArray( testHolder );
		
		equals( holders.length, 3, '3 Holders Found' );
		equals( holders[0], '[holderA]', '[holderA] found successfully!' );
		equals( holders[1], '[holderB]', '[holderB] found successfully!' );
		equals( holders[2], '[holderC]', '[holderC] found successfully!' );
	},
	ReplaceHolders: function() {
		var tracker = $.initTrackIt('omniture',{
			GlobalHolders: { 
				'test_global_string': 'value of global holder string',
				'test_global_function': function() { return 'value of global holder function'; 	}
			},
			TrackData: { 
				'Fake Key': {
					'key1': 'value1',
					'key2': 'value2',
					'fake_key_holder_function': function() { return 'Fake Key dynamic holder'; }
				}
			}
		});
		
		var fakeElement = $('<div style="display:none;"><div customAttr="a custom attribute test"><div id="customTestId">This <a href="/somepage.html">is a</a> test DIV<img src="/fake/path.jpg" alt="fake alt text" /></div></div></div>');
		fakeElement.appendTo( document.body );
		
		var holderTests = [ 
			{ input: '[TEXT] this is a test [PAGENAME]', expected: 'This is a test DIV this is a test runtests.html', ele: fakeElement },
			{ input: '[TEXT]', expected: 'This is a test DIV', ele: fakeElement.find('#customTestId') },
			{ input: '[TITLE]', expected: 'jquery.trackit.js - QUnit Tests', ele: fakeElement },
			{ input: '[H1]', expected: 'jquery.trackit.js - QUnit Tests', ele: fakeElement },
			{ input: '[ALT]', expected: 'fake alt text', ele: fakeElement.find('img') },
			{ input: '[HREF]', expected: '/somepage.html', ele: fakeElement.find('a') },
			{ input: '[ATTR:id]', expected: 'customTestId', ele: fakeElement.find('#customTestId') },
			{ input: '[ATTR+:customAttr]', expected: 'a custom attribute test', ele: fakeElement.find('#customTestId') },
			{ input: '[PAGENAME]', expected: 'runtests.html' },
			{ input: '[URL]', expected: '/qunit/runtests.html', ele: fakeElement.find('a') },
			{ input: '[CUSTOM_HOLDER]', expected: 'some value', extra: { 'CUSTOM_HOLDER': 'some value' } },
			{ input: '[test_global_string]', expected: 'value of global holder string' },
			{ input: '[test_global_function]', expected: 'value of global holder function' },
			{ input: '[key1]', expected: 'value1' },
			{ input: '[fake_key_holder_function]', expected: 'Fake Key dynamic holder' }
		];
		
		$.each(holderTests, function() {
			var ele = ( this.ele ) ? this.ele.get(0) : null;
			var processed = tracker.ReplaceHolders( this.input, 'Fake Key', $.extend({ ele: ele }, this.extra));
			equals( processed, this.expected, this.input );
		});
		
		fakeElement.remove();
	},
	InitDudLink: function() {
		var tracker = $.initTrackIt( 'omniture', {} );
		
		if( tracker.DudHtmlLink != null && tracker.DudHtmlLink.parents('body').length > 0 ) {
			ok( true, 'dud link is valid' ); 
		} else {
			ok( false, 'dud link is not valid' );
		}
	},
	ParseXml: function() {
		var tracker = $.initTrackIt('omniture',{});
		
		var xml = '<?xml version="1.0" encoding="UTF-8"?>' + 
			'<track>' + 
				'<trackEvent eventName="Page Load" event="pageView" urlMap="*">' + 
					'<pageName>jquery.trackit.js QUnit Test Page</pageName>' + 
					'<eVar1>this is eVar1</eVar1>' + 
				'</trackEvent>' + 
				'<trackEvent eventName="Test Event" event="click">' + 
					'<eVar2>this is a test eVar</eVar2>' + 
					'<events>event20</events>' + 
				'</trackEvent>' + 
			'</track>';
		
		var xmlObj = tracker.parseXml( xml );

		ok(xmlObj["Page Load"] !== undefined, "Page Load - track event is defined" );
		equals(xmlObj["Page Load"].event, "pageView", "Page Load - pageView event" );
		equals(xmlObj["Page Load"].urlMap, "*", "Page Load - urlMap" );
		equals(xmlObj["Page Load"].pageName, "jquery.trackit.js QUnit Test Page", "Page Load - pageName" );
		equals(xmlObj["Page Load"].eVar1, "this is eVar1", "Page Load - eVar1" );
		
		ok(xmlObj["Test Event"] !== undefined, "Test Event - track event" );
		equals(xmlObj["Test Event"].event, "click", "Test Event - click event" );
		equals(xmlObj["Test Event"].eVar2, "this is a test eVar", "Test Event - eVar2" );
		equals(xmlObj["Test Event"].events, "event20", "Test Event - events" );

	},
	// this entire test has to run as a callback to the tracking data being ready
	LoadXml: function() {
		stop();
		var tracker = $.initTrackIt('omniture',{
			XmlUrl: 'trackData.xml',
			Plugins: [ { Init: function() { this.ready( function() { 
				start();
				equals( typeof this.TrackData["Page Load"], "object", "TrackData defined" );
				var ele = $("<a href='/someurl.html'>a fake link</a>").get(0);
				
				equals(typeof this.TrackData["Page Load"], "object", "Page Load - track event is defined" );
				equals(this.TrackData["Page Load"].event, "pageView", "Page Load - pageView event" );
				equals(this.TrackData["Page Load"].urlMap, "*",  "Page Load - urlMap" );
				equals(this.TrackData["Page Load"].pageName, "[TITLE] > [TEXT] > [HREF]", "Page Load - pageName" );
				equals(this.TrackData["Page Load"].eVar1, "this is eVar1", "Page Load - eVar1" );
				
				equals(typeof this.TrackData["Test Event"], "object", "Test Event - track event" );
				equals(this.TrackData["Test Event"].event, "click", "Test Event - click event" );
				equals(this.TrackData["Test Event"].eVar2, "this is a test eVar [HREF]", "Test Event - eVar2" );
				equals(this.TrackData["Test Event"].events, "event20", "Test Event - events" );	
			} ) } } ]
		});
	},
	
	GetParsedData: function() {		
		stop();
		var tracker = $.initTrackIt('omniture',{
			XmlUrl: 'trackData.xml',
			Plugins: [ { Init: function() { this.ready( function() { 
				start();
				equals( typeof this.TrackData["Page Load"], "object", "TrackData defined" );
				var ele = $("<a href='/someurl.html'>a fake link</a>").get(0);
				var options = $.extend({},this.TrackData["Page Load"], { ele: ele });
				
				var data = this.GetParsedData("Page Load", options );
				equals( data.pageName, "jquery.trackit.js - QUnit Tests > a fake link > /someurl.html", "Page Load - pageName" );
				equals( data.eVar1, "this is eVar1", "Page Load - eVar1" );
				equals( data.eVar2, "/qunit/runtests.html", "Page Load - eVar2" );
			} ) } } ]
		});
	},
	ReadyEvent: function() {
		stop();
		var readyCount = 0;
		var tracker = $.initTrackIt('omniture',{
			XmlUrl: 'trackData.xml',
			Plugins: [ { Init: function() { this.ready( function() {
				readyCount++;
				equals(readyCount, 1, "First ready OK");
				stop();
				tracker.ready( function() {
					start();
					readyCount++;
					equals(readyCount, 2, "Second ready OK");
				});
			} ) } } ]
		});
		
		tracker.ready( function() { equals( readyCount, 2, "All Readys accounted for!" ); } );
	}
};