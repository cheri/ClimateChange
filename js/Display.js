define(["Game", "jQuery", "jQueryUI"], function(Game) {

	var State;
	var Coordinator;

	var makeLink = function(_coordinator, id, content, target) {
		
		var pTag = $('<p/>', {
		    class: 'titleLink',
		});

		$('<a/>', {
		    href: target,
		    text: content,
		    click: function() {
				$( "#blackout" ).fadeIn( "slow", function() {
	    			startScene(_coordinator,id);
  				});
			}
		}).appendTo(pTag);

		return pTag;
	}

	var startScene = function(_coordinator, id, loadIntro) {
		var bg = _coordinator.loadBackground(id);
		initSceneScreen(State, bg);
		if (loadIntro) { _coordinator.loadSceneIntro(id); }
		_coordinator.loadStoryMaterials(id);
		_coordinator.loadAvatars(id);
		_coordinator.startGame(id);
	}

	var initTitleScreen = function(_coordinator, _State, scenes) {

		State = _State;
		Coordinator = _coordinator;
		
		$('<h1/>', {
		    text: 'Climate Change Game',
		    id: 'title'
		}).appendTo('body');

		var begin = $('<h2/>', {
			text: 'Begin',
			id: 'begin',
			click: function() {
				$( "#blackout" ).fadeIn( "slow", function() {
	    			startScene(_coordinator, scenes[0], true);
  				});
			}
		}).appendTo('body');

		$('<h2/>', {
		    text: 'Scene Selection',
		    id: 'sceneSelectTitle'
		}).appendTo('body');

		// For each scene, make a link to start it.
		scenes.forEach(function(scene, pos) {
			var el = makeLink(_coordinator, scene, scene, "#");
			$('body').append(el);
		});

		$('<div/>', {
		    id: 'blackout'
		    //text: ''
		}).appendTo('body');
	}

	var initSceneScreen = function(State, bg) {

		$('body').html('');
		$('<div/>', {
		    id: 'storyContainer'
		    //text: ''
		}).appendTo('body');

		$('<div/>', {
		    id: 'gameContainer'
		    //text: ''
		}).appendTo('body');

		$('<div/>', {
		    id: 'statsContainer',
		    style: "background-image:url('/assets/bgs/"+ bg +"')"
		    //text: ''
		}).appendTo('body');

		$('<div/>', {
		    id: 'sceneIntro'
		    //text: ''
		}).appendTo('body');

		$('<div/>', {
		    id: 'blackout'
		    //text: ''
		}).appendTo('body');

		initStatsUI(State);
	}

	var initStatsUI = function(State) {
		$('<div/>', {
		    id: 'charPic'
		    //text: ''
		}).appendTo('#statsContainer');

		$('<div/>', {
		    id: 'stats'
		    //text: ''
		}).appendTo('#statsContainer');

		$('<div/>', {
		    id: 'storyStats'
		    //text: ''
		}).appendTo('#stats');

		$('<div/>', {
		    id: 'gameStats'
		    //text: ''
		}).appendTo('#stats');
	}

	/*
		Sets avatar on-screen based on state
	*/
	var setAvatar = function(State) {
		var theAvatar = false;

		State.avatars.forEach(function(avatar, pos) {
			var correctAvatar = State.isTrue(avatar.state);
			if (correctAvatar) {
				theAvatar = avatar;
			}
		});
		if (theAvatar) {
			$('#charPic').css("background-image", "url(/assets/avatar/"+ theAvatar.src +")"); 
		}
	}

	/*
	Called by story and game systems to change stat displayed, or add it
	*/

	var setStats = function(containerId) {
		var stats = State.get("storyUIvars");
		$("#"+containerId).html('');

		stats.forEach(function(stat, pos) {
			$('<div/>', {
				id: stat+'Container',
		    	class: 'stat'
			}).appendTo("#"+containerId);

			$('<span/>', {
		    	class: 'statLabel',
		    	text: stat + ": "
			}).appendTo('#'+stat+'Container');

			$('<span/>', {
		    	class: 'statValue',
		    	text: State.get(stat)
			}).appendTo('#'+stat+'Container');
		});
	};

	//sets the intro screen for each scene
	var setSceneIntro = function(sceneText) {
		$("#blackout").show();
		$("#sceneIntro").html(sceneText);
		var begin = $('<h2/>', {
			text: 'Begin',
			click: function() {
				$("#sceneIntro").fadeOut( "slow" );
				$("#blackout").fadeOut( "slow" );
			}
		}).appendTo("#sceneIntro");
		$("#sceneIntro").fadeIn( "slow" );
	}

	var setSceneOutro = function(endText) {

		var nextIndex = State.get("scenes").findIndex(function(scene) {
			return (scene == State.get("currentScene"));
		}) + 1;
		$( "#blackout" ).fadeIn( "slow", function() {
	    	$("#sceneIntro").html(endText);

	    	$('<h3/>', {
	    		text : 'Stats',
	    	}).appendTo("#sceneIntro");
	    	var stats = State.get("storyUIvars");
	    	stats.forEach(function(stat, pos) {
				$('<div/>', {
					id: stat+'ContainerOutro',
			    	class: 'stat'
				}).appendTo("#sceneIntro");

				$('<span/>', {
			    	class: 'statLabel',
			    	text: stat + ": "
				}).appendTo('#'+stat+'ContainerOutro');

				$('<span/>', {
			    	class: 'statValue',
			    	text: State.get(stat)
				}).appendTo('#'+stat+'ContainerOutro');
			});


	    	var begin = $('<h2/>', {
			text: 'Next',
			click: function() {
				startScene(Coordinator, State.get("scenes")[nextIndex], true);
			}
			}).appendTo("#sceneIntro");

	    	$( "#sceneIntro" ).fadeIn();
	    });
	}

	return {
		initTitleScreen : initTitleScreen,
		setAvatar : setAvatar,
		setStats : setStats,
		setSceneIntro : setSceneIntro,
		setSceneOutro : setSceneOutro,
		startScene : startScene
	} 
});