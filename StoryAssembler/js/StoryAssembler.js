/* StoryAssembler Module

Handles the core loop of running a StoryAssembler story.
*/

/* global define */

define(["Display", "Templates", "Chunks", "State"], function(Display, Templates, Chunks, State) {
	"use strict";

	var scenePosition = 0;
	var sceneTemplate;
	var scenePlan;

	// Begins running a scene with the given ID.
	var beginScene = function(sceneId) {
		scenePosition = 0;
		Display.init(handleSelection);
		sceneTemplate = Templates.loadScene(sceneId);
		scenePlan = sceneTemplate.toPlan();
		doNextFrame();
	}

	// Handle the next frame request in the scene plan.
	var doNextFrame = function() {
		if (scenePosition >= scenePlan.frames.length) {
			endScene();
			return;
		}
		var frame = scenePlan.frames[scenePosition];
		processFrame(frame.id);	
		scenePosition++;
	}

	// Takes a frame, renders all its content (including choices if any) and shows it in the UI.
	var processFrame = function(frameId) {
		var frameTemplate = Templates.loadFrame(frameId);
		var framePlan = frameTemplate.toPlan();
		framePlan.chunks.forEach(function(chunk) {
			var renderedChunk = Chunks.render(chunk);
			Display.addStoryText(renderedChunk);
		})
		if (framePlan.choices) {
			framePlan.choices.forEach(function(choice) {
				var renderedChoice = choice;
				Display.addChoice(renderedChoice);
			});
		}
	}

	// Deals with the player selecting a choice.
	var handleSelection = function(choice) {
		// Handle any effects of the choice
		if (choice.effects) {
			choice.effects.forEach(function(effect) {
				State.change(effect);
			});
		}
		console.log("State.get('timesAnnoyed')", State.get('timesAnnoyed'));
		Display.clearAll();
		processFrame(choice.responseFrame);
		doNextFrame();
	}

	// Show an indicator that the scene is over.
	var endScene = function() {
		Display.addStoryText("End of scene!");
	}

	// PUBLIC INTERFACE
	return {
		beginScene: beginScene
	}

});