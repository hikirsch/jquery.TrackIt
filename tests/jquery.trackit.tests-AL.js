var TrackItTestsAL = {
	CheckVars: function() { 
		var tracker = $.initTrackIt("omniture",{
			GlobalHolders: { 
				"test_global_string": 'value of global holder string',
				"test_global_function": function() {
					return "value of global holder function";
				}
			},
			TrackData: {
				"FakeKey": {
					'prop1': 'value1',
					'prop2': 'value2',
					'fake_key_holder_function': function() { return "fake key dynamic holder"; }
				},
				"FakeKey2": {
					'prop1': 'value1',
					'prop2': 'value2',
					'fake_key_holder_function': function() { return "fake key dynamic holder"; }
				}
			}
		});
		

		// get count keys in trackData;
		var count = 0;
		for (var item in tracker.TrackData) {
			count++;		
		}
	
		$.each(tracker.TrackData,function(key){
			var link = $("<a href='javascript:void(0)' trackKey='"+ key +"'>test link</a>").appendTo("body");
			link.click();
		});

		var delay = count * 500;
		stop(delay + 500); // make test wait for a bit so track images can load
		
		setTimeout( function() {
			var i = 0;				
			$.each(tracker.TrackData,function(n){				
				//var s = s_gi(s_account);
				var imgName = "s_i_ogilvywpp";
				imgName += (i!==0) ? "_" + i:"";
				
				equals( window[imgName].tagName, "IMG", "trackkey" + n + " has tracked" );
				
				$.each(tracker.TrackData[n], function(v) {
					console.log(tracker.TrackData[n]);
					var urlToken = VarMapper.getVar(v);
					console.log(urlToken);
					
				});								
				var src = window[imgName].src;
				i++;
				start();	
			});
						
		},		
		delay
		);

		
		//equals( tracker.Type, "Omniture", "$.TrackIt.Type is correct!" );
		//equals( typeof tracker.DoTrackPageView, "function", "$.TrackIt.DoPageView is defined" );
		//equals( typeof tracker.DoTrackEvent, "function", "$.TrackIt.DoTrackEvent is defined" ); 
		//equals( typeof tracker.TrackData, "object", "TrackData is defined" ); 
	}	
};



var VarMapper = {

	getVar : function(val) {		
		if (val in this.map) {
			// test for function or string
			var transform = map[val];			
			switch (typeof transform) {
				case "function" : 
					return "blah";
				break;
				case "string" :
					return "string";
				break;
				default: 
					return null;
			}			
		} else {
			return null; 
		}		
	},
	map : {
	
		pageName : "pageName",
		server : "server",
		pageType : "pageType",
		channel : "ch",
		campaign : "v0",
		state : "state",
		zip : "zip",
		events : "events",
		products : "products",
		purchaseID : "purchaseID",
		charSet : "ce",
		visitorNamespace : "Ns",
		currencyCode : "cc",
		"Referring URL" : "R",
		"Current URL" : "g",
		
		eVar: function(){
			return this.replace(/eVar/, "v");
		},
		prop: function(){
			return this.replace(/prop/, "c");
		},
		hier: function(){
			return this.replace(/hier/, "h");
		}
	}
}



