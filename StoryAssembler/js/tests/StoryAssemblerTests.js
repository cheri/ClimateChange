/* global test */
"use strict";
define(["../StoryAssembler", "../ChunkLibrary", "State", "Wishlist", "StoryDisplay", "Character", "jQueryUI"], function(StoryAssembler, ChunkLibrary, State, Wishlist, StoryDisplay, Character, $) {

	var getStoryEl = function() {
		return document.getElementById("storyArea").children[0];
	}
	var getChoiceEl = function() {
		return document.getElementById("choiceArea");
	}
	var html = function(el) {
		return el.innerHTML;
	}
	var countChildren = function(el) {
		return el.children.length;
	}
	var child = function(num, el) {
		return el.children[num-1];
	}
	var clickEl = function(el) {
		el.click();
	}
	var clickChoice = function(num) {
		clickEl(child(num, getChoiceEl()));
	}
	var contentForChoice = function(num) {
		return html(child(num, getChoiceEl()));
	}
	var cleanUpDom = function() {
		var el = document.getElementById("storyArea");
		el.parentNode.removeChild(el);
		el = document.getElementById("choiceArea");
		el.parentNode.removeChild(el);
		el = document.getElementById("diagnostics");
		el.parentNode.removeChild(el);
	}
	
	var run = function() {

		var resetTest = function() {		//local function for resetting stuff between tests
			

			var characters = {
				"char1" : {name: "Emma", nickname: "Em", gender: "female" },
				"char2": {name: "Miguel", nickname: "Miguel", gender: "male"}
			};

			ChunkLibrary.reset();
			State.reset();
			Character.init(State);
			for (var key in characters) {
				Character.add(key, characters[key]);
			}
			State.set("mode", { type: "narration" } );
		}

		QUnit.module( "StoryAssembler Module tests" );
		test("Integration tests for StoryAssembler", function( assert ) {
			
			var wl;
			resetTest();

			wl = Wishlist.create([{condition: "x eq true"}], State);
			ChunkLibrary.add([
				{ id: "Chunk1", content: "Chunk1 Content", choices: [{chunkId: "Chunk2"}] },
				{ id: "Chunk2", choiceLabel: "Chunk2 Label", content: "Chunk2 Content", effects: ["set x true"] }
			]);
			StoryAssembler.beginScene(wl, ChunkLibrary, State, StoryDisplay, undefined, Character);
			assert.deepEqual(html(getStoryEl()), "(speaker): Chunk1 Content", "Basic: First chunk should be shown correctly");
			assert.deepEqual(contentForChoice(1), "(speaker): Chunk2 Label", "Basic: First choice should be shown correctly");
			clickChoice(1);
			assert.deepEqual(html(getStoryEl()), "(speaker): Chunk2 Content", "Basic: Second chunk should be shown correctly");
			assert.deepEqual(countChildren(getChoiceEl()), 0, "Should be no choices if we've run out of chunks.");

			resetTest();

			wl = Wishlist.create([{condition: "x eq true"}], State);
			wl.logOn();
			ChunkLibrary.add([
				{ id: "Chunk1", content: "Chunk1 Content", choices: [{chunkId: "Chunk2"}] },
				{ id: "Chunk2", choiceLabel: "Chunk2 Label", content: "Chunk2 Content", choices: [{chunkId: "Chunk3"}] },
				{ id: "Chunk3", choiceLabel: "Chunk3 Label", content: "Chunk3 Content", effects: ["set x true"] }
			]);
			StoryAssembler.beginScene(wl, ChunkLibrary, State, StoryDisplay, undefined, Character);
			assert.deepEqual(html(getStoryEl()), "(speaker): Chunk1 Content", "In multi-choice chain, first chunk should be shown correctly");
			assert.deepEqual(contentForChoice(1), "(speaker): Chunk2 Label", "In multi-choice chain, first option correct.");
			clickChoice(1);
			assert.deepEqual(html(getStoryEl()), "(speaker): Chunk2 Content", "In multi-choice chain, second chunk shows correctly.");
			assert.deepEqual(contentForChoice(1), "(speaker): Chunk3 Label", "In multi-choice chain, second option correct.");
			assert.deepEqual(countChildren(getChoiceEl()), 1, "In multi-choice chain, should be exactly 1 option.");
			clickChoice(1);
			assert.deepEqual(html(getStoryEl()), "(speaker): Chunk3 Content", "In multi-choice chain, last chunk should show correctly.");
			assert.deepEqual(countChildren(getChoiceEl()), 0, "In multi-choice chain, no options when finished.");

			// Test chaining through condition-based request (condition is different than initial wishlist goals)
			resetTest();
			State.set("beat", 1);
			wl = Wishlist.create([{condition: "beat eq 3"}, {condition: "beat eq 2"}], State);
			ChunkLibrary.add([
				{ id: "Chunk1", content: "Chunk1 Content", choices: [{chunkId: "Chunk2x"}], effects: ["set beat 2"] },
				{ id: "Chunk2x", choiceLabel: "Chunk2 Label", request: {condition: "x eq true"} },
				{ id: "Chunk3x", conditions: ["beat eq 2"], content: "Chunk3 Content", effects: ["set beat 3", "set x true"] }
			]);
			StoryAssembler.beginScene(wl, ChunkLibrary, State, StoryDisplay, undefined, Character);
			assert.deepEqual(html(getStoryEl()), "(speaker): Chunk1 Content", "Chain through condition request: first node HTML correct");
			assert.deepEqual(countChildren(getChoiceEl()), 1, "Chain through condition request: initially only 1 choice");
			assert.deepEqual(contentForChoice(1), "(speaker): Chunk2 Label", "Chain through condition request: single choice is to Chunk2");
			console.log("clicking choice in Chunk1");
			clickChoice(1);
			assert.deepEqual(html(getStoryEl()), "(speaker): Chunk3 Content", "Chain through condition request: after click, should chain through.");
			assert.deepEqual(contentForChoice(1), "Continue", "Chain through condition request: no options when finished.");

			// Test "persistent" wishlist parameter and "repeatable" chunk parameter.
			resetTest();
			wl = Wishlist.create([{condition: "x eq true", persistent: true}], State);
			ChunkLibrary.add([
				{ id: "Chunk1", content: "Chunk1 Content", effects: ["set x true"], repeatable: true }
			]);
			StoryAssembler.beginScene(wl, ChunkLibrary, State, StoryDisplay, undefined, Character);
			assert.deepEqual(html(getStoryEl()), "(speaker): Chunk1 Content", "Persistent chunks work first time (1/3)");
			assert.deepEqual(countChildren(getChoiceEl()), 1, "Persistent chunks work first time (2/3)");
			assert.deepEqual(contentForChoice(1), "Continue", "Persistent chunks work first time (3/3)");
			clickChoice(1);
			assert.deepEqual(html(getStoryEl()), "(speaker): Chunk1 Content", "Persistent chunks work second time (1/2)");
			assert.deepEqual(contentForChoice(1), "Continue", "Persistent chunks work second time (2/2)");

			resetTest();
			wl = Wishlist.create([{condition: "x eq true", persistent: true}], State);
			ChunkLibrary.add([
				{ id: "Chunk1", content: "Chunk1 Content", effects: ["set x true"], repeatable: false }
			]);
			StoryAssembler.beginScene(wl, ChunkLibrary, State, StoryDisplay, undefined, Character);
			assert.deepEqual(html(getStoryEl()), "(speaker): Chunk1 Content", "Non-repeatable chunks work first time (1/2)");
			assert.deepEqual(contentForChoice(1), "Continue", "Non-repeatable chunks work first time (2/2)");
			clickChoice(1);
			assert.deepEqual(html(getStoryEl()), "[End of scene.]", "Non-repeatable chunks: if a used non-repeatable chunk is the only thing satisfying a wishlist item, fail to find a path");

			resetTest();
			wl = Wishlist.create([{condition: "x eq true", persistent: true}], State);
			ChunkLibrary.add([
				{ id: "Chunk1", content: "...", effects: ["set x true"], repeatable: false },
				{ id: "Chunk2", content: "...", effects: ["set x true"], repeatable: false },
				{ id: "Chunk3", content: "...", effects: ["set x true"], repeatable: false }
			]);
			StoryAssembler.beginScene(wl, ChunkLibrary, State, StoryDisplay, undefined, Character);
			clickChoice(1);
			clickChoice(1);
			clickChoice(1);
			assert.deepEqual(html(getStoryEl()), "[End of scene.]", "Non-repeatable chunks: should run out when we've exhausted supply.");


			//test whether it can find the next want from wishlist if current choice-thread ends
			resetTest();
			State.set("beat", 1);
			wl = Wishlist.create([{condition: "beat eq 2"}, {condition: "beat eq 3"}], State);
			ChunkLibrary.add([
				{ id: "Chunk1", content: "Chunk1 Content", choices: [{chunkId: "Chunk2b"}], effects: ["set beat 2"] },
				{ id: "Chunk2b", choiceLabel: "Chunk2 Label", content: "Chunk2 content" },
				{ id: "Chunk3", conditions: ["beat eq 2"], content: "Chunk3 Content", effects: ["set beat 3"] }
			]);
			StoryAssembler.beginScene(wl, ChunkLibrary, State, StoryDisplay, undefined, Character);
			assert.deepEqual(html(getStoryEl()), "(speaker): Chunk1 Content", "Move to different want after thread ends: first node HTML correct");
			assert.deepEqual(countChildren(getChoiceEl()), 1, "Move to different want after thread ends: initially only 1 choice");
			assert.deepEqual(contentForChoice(1), "(speaker): Chunk2 Label", "Move to different want after thread ends: single choice is to Chunk2");
			clickChoice(1);
			assert.deepEqual(html(getStoryEl()), "(speaker): Chunk2 content", "Move to different want after thread ends: after click, should chain through.");
			assert.deepEqual(contentForChoice(1), "Continue", "Move to different want after thread ends: single choice is to Chunk2");
			clickChoice(1);
			assert.deepEqual(html(getStoryEl()), "(speaker): Chunk3 Content", "Move to different want after thread ends: second node HTML correct");

			//unit test for pulling in chunk with choices into chunk making request that has no content
			resetTest();
			State.set("beat", 1);
			wl = Wishlist.create([{condition: "beat eq 2"}, {condition: "beat eq 3"}], State);
			ChunkLibrary.add([
				{ id: "Chunk1", content: "Chunk1 Content", choices: [{chunkId: "Chunk2"}], effects: ["set beat 2"] },
				{ id: "Chunk2", choiceLabel: "Chunk2 Label", request: {condition: "x eq true"} },
				{ id: "Chunk3", conditions: ["beat eq 2"], content: "Chunk3 Content", choices: [{chunkId: "Chunk4"}], effects: ["set beat 3", "set x true"] },
				{ id: "Chunk4", choiceLabel: "Chunk4 Label", content: "Chunk4 Content" },
			]);
			console.log("aw yeah problem child");
			StoryAssembler.beginScene(wl, ChunkLibrary, State, StoryDisplay, undefined, Character);
			assert.deepEqual(html(getStoryEl()), "(speaker): Chunk1 Content", "Choices also chain from requests: first node HTML correct");
			assert.deepEqual(countChildren(getChoiceEl()), 1, "Choices also chain from requests: initially only 1 choice");
			assert.deepEqual(contentForChoice(1), "(speaker): Chunk2 Label", "Choices also chain from requests: single choice is to Chunk2");
			clickChoice(1);
			assert.deepEqual(html(getStoryEl()), "(speaker): Chunk3 Content", "Choices also chain from requests: after click, should chain through.");
			assert.deepEqual(contentForChoice(1), "(speaker): Chunk4 Label", "Choices also chain from requests: single choice is to Chunk4");
			assert.deepEqual(countChildren(getChoiceEl()), 1, "Choices also chain from requests: second screen only 1 choice");
			clickChoice(1);
			assert.deepEqual(html(getStoryEl()), "(speaker): Chunk4 Content", "Choices also chain from requests: after click, should chain through again.");
			assert.deepEqual(countChildren(getChoiceEl()), 0, "Choices also chain from requests: no options when finished.");
			console.log(wl.wantsAsArray());

			//make sure options aren't being displayed that shouldn't be displayed
			resetTest();
			State.set("beat", 1);
			wl = Wishlist.create([{condition: "beat eq 1"}, {condition: "beat eq 2"}], State);
			ChunkLibrary.add([
				{ 
					id: "Text1", 
					content: "Text1 Content", 
					choices: [{chunkId: "normalChoice"}],
					effects: ["set beat 1"] 
				},
				{ 
					id: "normalChoice", 
					choiceLabel: "normalChoice Label", 
					content: "normalChoice Content"
				},
				{ 
					id: "orphanChoice", 
					choiceLabel: "orphanChoice Label", 
					request: {condition: "beat eq 2"} },
				{ 
					id: "orphanChoiceContent", 
					conditions: ["beat eq 1"], 
					content: "orphanChoiceContent Content", 
					choices: [{chunkId: "Chunk4"}], 
					effects: ["set beat 2"] 
				}
			]);
			StoryAssembler.beginScene(wl, ChunkLibrary, State, StoryDisplay, undefined, Character);
			assert.deepEqual(html(getStoryEl()), "(speaker): Text1 Content", "No extra options: first node HTML correct");
			assert.deepEqual(countChildren(getChoiceEl()), 1, "No extra options: no initial options");
			assert.deepEqual(contentForChoice(1), "(speaker): normalChoice Label", "No extra options: normalChoice displays");

			// Test incremental progress towards wishlist items.
			resetTest();
			State.set("stress", 0);
			wl = Wishlist.create([{condition: "stress gte 3"}], State);
			ChunkLibrary.add([
				{ 
					id: "StressChunk", 
					content: "StressChunk Content", 
					effects: ["incr stress 1"], 
					repeatable: true 
				}
			]);
			StoryAssembler.beginScene(wl, ChunkLibrary, State, StoryDisplay, undefined, Character);
			assert.deepEqual(html(getStoryEl()), "(speaker): StressChunk Content", "Testing incremental progress (1)");
			assert.deepEqual(contentForChoice(1), "Continue", "Testing incremental progress (2)");
			clickChoice(1);
			assert.deepEqual(html(getStoryEl()), "(speaker): StressChunk Content", "Testing incremental progress (3)");
			clickChoice(1);
			assert.deepEqual(countChildren(getChoiceEl()), 0, "Testing incremental progress (4)");

			// Test gotoId as a Twine-like deterministic link
			resetTest();

			
			wl = Wishlist.create([{condition: "theChunk eq 1"}, {condition: "theChunk eq 4"}], State);
			wl.logOn();
			ChunkLibrary.add([
				{ 
					id: "LinkTest1", 
					content: "Text1 Content", 
					choices: [{gotoId: "LinkTest2"}],
					effects: ["set theChunk 1"] },
				{ 
					id: "LinkTest2", 
					choiceLabel: "linkChoice link", 
					content: "linkTest2 Content"
				}
			]);
			StoryAssembler.beginScene(wl, ChunkLibrary, State, StoryDisplay, undefined, Character);
			assert.deepEqual(html(getStoryEl()), "(speaker): Text1 Content", "Testing goto-style links (1)");
			assert.deepEqual(contentForChoice(1), "(speaker): linkChoice link", "Testing goto-style links (2)");
			clickChoice(1);
			assert.deepEqual(html(getStoryEl()), "(speaker): linkTest2 Content", "Testing goto-style links (3)");
			
			// Test compound nodes where second content node fulfills wishlist item
			resetTest();
			wl = Wishlist.create([{condition: "theScene eq start", order: "first"}, {condition: "awesome eq heckYeah"} ], State);
			wl.logOn();
			ChunkLibrary.add([
				{ 
					id: "chunk1", 
					content: "chunk1 is me!", 
					choices: [{condition: "x eq active"}],
					effects: ["set theScene start"]
				},
				{ 
					id: "chunk2", 
					choiceLabel: "hey choicelabel",
					request: {"gotoId": "chunk3"},
					effects: ["set x active"]
				},
				{ 
					id: "chunk3", 
					content: "chunk3 is me!", 
					effects: ["set awesome heckYeah"],
				}
			]);
			StoryAssembler.beginScene(wl, ChunkLibrary, State, StoryDisplay, undefined, Character);
			assert.deepEqual(html(getStoryEl()), "(speaker): chunk1 is me!", "Testing compound nodes (1)");
			assert.deepEqual(contentForChoice(1), "(speaker): hey choicelabel", "Testing compound nodes (2)");
			clickChoice(1);
			assert.deepEqual(html(getStoryEl()), "(speaker): chunk3 is me!", "Testing compound nodes (3)");

			// Test compound nodes with gotoIds
			resetTest();
			wl = Wishlist.create([{condition: "establishSetting eq true", order: "first"}, {condition: "awesome eq heckYeah"} ], State);
			wl.logOn();
			ChunkLibrary.add([
				{
					"id": "setup",
					"speaker" : "ally",
					"content" : "Sorry everything's so messy!",
					"choices" : [
						{"gotoId" : "choiceInterface", "speaker" : "protagonist"}
					],
					"effects": ["set establishSetting true"]
				},
				{
					"id": "choiceInterface",
					"choiceLabel": "What's with all the boxes everywhere?",
					"request": {"gotoId": "interface"},
					//"effects": ["set establishSetting true"]
				},
				{
					"id": "interface",
					"speaker" : "ally",
					"content" : "I'm the interface!",
					"choices" : [
						{"gotoId" : "dummyChoice", "speaker" : "protagonist"}
					],
					//"effects": ["set establishSetting true"]
				},
				{
					"id": "dummyChoice",
					"choiceLabel": "I'm the dummy choice.",
					"content": "dummy content"
				},
			]);
			StoryAssembler.beginScene(wl, ChunkLibrary, State, StoryDisplay, undefined, Character);
			assert.deepEqual(html(getStoryEl()), "(speaker): Sorry everything's so messy!", "Test compound nodes with gotoIds w/ no Want motivation (1)");
			assert.deepEqual(contentForChoice(1), "(speaker): What's with all the boxes everywhere?", "Test compound nodes with gotoIds w/ no Want motivation (2)");
			clickChoice(1);
			assert.deepEqual(html(getStoryEl()), "(speaker): I'm the interface!", "Test compound nodes with gotoIds w/ no Want motivation (3)");
			assert.deepEqual(contentForChoice(1), "(speaker): I'm the dummy choice.", "Test compound nodes with gotoIds w/ no Want motivation (4)");

			//chunks that are used in dynamic / compound chunks should also be removed from the content library if applicable
			resetTest();
			wl = Wishlist.create([{condition: "establishSetting eq true", order: "first"}, {condition: "awesome eq heckYeah"} ], State);
			wl.logOn();
			ChunkLibrary.add([
				{
					"id": "setup",
					"speaker" : "ally",
					"content" : "Sorry everything's so messy!",
					"choices" : [
						{"gotoId" : "choiceInterface", "speaker" : "protagonist"}
					],
					"effects": ["set establishSetting true"]
				},
				{
					"id": "choiceInterface",
					"choiceLabel": "What's with all the boxes everywhere?",
					"request": {"gotoId": "interface"},
					//"effects": ["set establishSetting true"]
				},
				{
					"id": "interface",
					"speaker" : "ally",
					"content" : "I'm the interface!",
					"choices" : [
						{"gotoId" : "dummyChoice", "speaker" : "protagonist"}
					],
					//"effects": ["set establishSetting true"]
				},
				{
					"id": "dummyChoice",
					"choiceLabel": "I'm the dummy choice.",
					"content": "dummy content"
				},
			]);
			StoryAssembler.beginScene(wl, ChunkLibrary, State, StoryDisplay, undefined, Character);
			assert.deepEqual(ChunkLibrary.get('interface').available, true, "for first node, interface should still be available from ChunkLibrary");
			clickChoice(1);
			assert.deepEqual(ChunkLibrary.get('interface'), false, "after clicking, interface should not be available");
/*
			//dynamic chunks brought in as choices should be valid if the root chunk making the request has an effect that would make their state pre-condition true
			resetTest();
			wl = Wishlist.create([{condition: "establishFriendBackstory eq true", order: "first"}, {condition: "establishEmmaRegrets eq true"} ], State);
			wl.logOn();
			ChunkLibrary.add([
				{
					"id": "inSpain",
					"content": "You would not believe how much of this stuff I ate in Spain.",
					"choices" : [
						{"condition": "establishEmmaRegrets eq true"},
					],
					"conditions": [],
					"effects": ["set establishFriendBackstory true"]
				},
				{
					"id": "stilljealous",
					"choiceLabel": "Still jealous you got to spend six months there.",
					"request": {"condition": "establishEmmaRegrets eq true"}
				},
				{
					"id": "regrets",
					"content": "Oh, come on. Don't beat yourself up. I'm pretty sure you made the right decision.",
					"conditions" : ["establishFriendBackstory eq true"],
					"effects": ["decr confidence 1", "set establishEmmaRegrets true"]
				}
			]);
			StoryAssembler.beginScene(wl, ChunkLibrary, State, StoryDisplay, undefined, Character);
			assert.deepEqual(html(getStoryEl()), "(speaker): You would not believe how much of this stuff I ate in Spain.", "dynamic choiceLabels chain correctly (1)");
			assert.deepEqual(contentForChoice(1), "(speaker): Still jealous you got to spend six months there.", "Dynamic choice label should be brought in without wishlist item");
			clickChoice(1);
			assert.deepEqual(html(getStoryEl()), "(speaker): Oh, come on. Don't beat yourself up. I'm pretty sure you made the right decision.", "Content should display correctly");
			*/

		});
	}

	return {
		run: run
	}
});