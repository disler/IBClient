"use strict";

const 	Config = require("../initial/config.js"),
		$ = require("jquery");

const 	jqelGenerateNewSessionIDButton = $("#generate_new"),
		jqelSaveButton = $("#save"),
		jqelSessionIDInput = $("#session_id"),
		jqelUsernameInput = $("#username");

class settings
{
	constructor(){}

	Initialize()
	{
		this.ConnectToDom();
		this.InitializeDom();
	}

	ConnectToDom()
	{
		const That = this;
		jqelGenerateNewSessionIDButton.on("click", (event) =>
		{
			That.GenerateNewSessionID();
		});

		jqelSaveButton.on("click", (event) =>
		{
			That.SaveSettings();
		});
	}

	GenerateNewSessionID()
	{
		const sNewGUID = Config.GenerateNewSessionID();
		jqelSessionIDInput.val(sNewGUID);
	}

	InitializeDom()
	{
		const sSessionID = Config.GetGlobalConfig("sessionID");
		const sUsername = Config.GetUserConfig("username");

		jqelSessionIDInput.val(sSessionID);
		jqelUsernameInput.val(sUsername);
	}

	SaveSettings()
	{
		const sSessionID = jqelSessionIDInput.val();
		const sUsername = jqelUsernameInput.val();
		Config.SaveConfiguration({
			username:sUsername,
			sessionID:sSessionID
		});
	}

}

const _settings = new settings();
_settings.Initialize();