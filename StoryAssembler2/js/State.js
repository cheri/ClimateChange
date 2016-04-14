/* 	State Module

	Stores information about the world that the story generator might wish to access or modify.
*/

/* global define */

define(["Condition"], function(Condition) {
	"use strict";

	var blackboard = {};

	var get = function(key) {
		return blackboard[key];
	}

	var set = function(key, value) {
		blackboard[key] = value;
	}

	/* Checks a condition against the state.
	the condition string are validated by the Condition module.
	*/
	var isTrue = function(condition) {
		// Parse condition string; if invalid, will throw an error.
		var conditionParts = Condition.parts(condition);

		var valOfParam;
		var param = conditionParts.param;
		var op = conditionParts.op;
		var value = conditionParts.value;
		if (param !== undefined) {
			valOfParam = get(param);
			if (op !== "eq" && op !== "neq" && isNaN(parseFloat(valOfParam))) {
				throw new Error("Tried to perform op '" + op + "' on param '" + param + "' (" + valOfParam + ") but that does not appear to be a number.");
			}
		}
		switch(op) {
			case "forceTrue":
				return true;
			case "forceFalse":
				return false;
			case "eq":
				return valOfParam == value;
			case "neq":
				return valOfParam != value;
			case "gte":
				return valOfParam >= value;
			case "lte":
				return valOfParam <= value;
			case "gt":
				return valOfParam > value;
			case "lt":
				return valOfParam < value;
		}
	}

	/*
	 * Makes a change to the state based on a recognized command.
	 *
	 * Currently handles:
	 *  - @@set PARAM VALUE@@: Sets a variable to a number or string.
	 *  - @@incr PARAM x@@: Increments a numeric variable by x.
	 *  - @@decr PARAM x@@: Decrements a numeric variable by x.
	 *  - @@mult PARAM x@@: Multiplies a numeric variable by x.
	 */
	var change = function(effect) {

		var expect = function(num) {
			if (params.length !== num) {
				throw new Error("Invalid number of params for op '" + op + "' (found " + params.length + ", expected " + num + ") in effect '" + effect + "'");
			}
		}
		var expectNum = function(val) {
			if (val === undefined) {
				set(val, 0);
			} else if (isNaN(parseFloat(val))) {
				throw new Error("Expected in effect '" + effect + "' that '" + val + "' would be a number but it was a " + typeof val);
			}
		}
		var validateNumberParams = function() {
			expect(2);
			var oldVal = get(params[0]);
			if (oldVal === undefined) {
				set(params[0], 0);
				oldVal = 0;
			}
			expectNum(oldVal);
			expectNum(params[1]);
		}

		var params = effect.replace(/\s\s+/g, " ").split(" ");
		var op = params.splice(0, 1)[0];
		var val = params[1];
		if (val === "true") val = true;
		if (val === "false") val = false;
		switch(op) {
			case "set":
				expect(2);
				set(params[0], val);
				break;
			case "incr":
				validateNumberParams();
				set(params[0], get(params[0]) + parseFloat(val));
				break;
			case "decr":
				validateNumberParams();
				set(params[0], get(params[0]) - parseFloat(val));
				break;
			case "mult":
				validateNumberParams();
				set(params[0], get(params[0]) * parseFloat(val));
				break;
			default:
				throw new Error("Invalid op '" + op + "' in effect '" + effect + "'");
		}
	}

	return {
		get: get,
		set: set,
		change: change,
		isTrue: isTrue
	}
});