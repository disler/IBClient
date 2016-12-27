"use strict";

const 	Config = require("../initial/config.js"),
		$ = require("jquery");

class settings
{
	constructor()
	{
		this.jqelGenerateNewSessionIDButton = {};
		this.jqelSaveButton = {};
		this.jqelSessionIDInput = {};
		this.jqelUsernameInput = {};
	}

	Initialize()
	{
		this.ConnectToDom();
		this.InitializeDom();
	}

	ConnectToDom()
	{
		//elements
		this.jqelGenerateNewSessionIDButton = $("#generate_new");
		this.jqelSaveButton = $("#save");
		this.jqelSessionIDInput = $("#session_id");
		this.jqelUsernameInput = $("#username");

		//events
		const That = this;
		$(this.jqelGenerateNewSessionIDButton).on("click", (event) =>
		{
			console.log(event);
			That.GenerateNewSessionID();
		});

		$(this.jqelSaveButton).on("click", (event) =>
		{
			console.log("event: ", event);
			That.SaveSettings();
		});
	}

	GenerateNewSessionID()
	{
		const sNewGUID = Config.GenerateNewSessionID();
		this.jqelSessionIDInput.val(sNewGUID);
	}

	InitializeDom()
	{
		const sSessionID = Config.GetGlobalConfig("sessionID");
		const sUsername = Config.GetUserConfig("username");

		this.jqelSessionIDInput.val(sSessionID);
		this.jqelUsernameInput.val(sUsername);
	}

	SaveSettings()
	{
		const sSessionID = this.jqelSessionIDInput.val();
		const sUsername = this.jqelUsernameInput.val();
		Config.SaveConfiguration({
			username:sUsername,
			sessionID:sSessionID
		});
	}

}

module.exports = new settings();
