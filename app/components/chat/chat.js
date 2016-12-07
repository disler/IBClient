//configuration constants
const 	faye = require('faye'),
		$ = require("jquery"),
		Config = require("../initial/config.js");

//dom constants
const jqelOutputWrapper = $(".output-wrapper");
const jqelOutput = $("#output");
const jqelInput = $("#input");

//project level constants
const lstCommands = ["/name"];

class Chat
{	
	constructor()
	{
		this.GUID = this.GenerateGUID();
		this.sUsername = Config.GetUserConfig("username") || "";
	}

	Initialize()
	{
		this.ConnectToServer();
		this.ConnectToDom();
	}

	ConnectToDom()
	{
		const That = this;
		jqelInput.on("keyup", function(e)
		{
			const sInput = jqelInput.val();
			if(e.keyCode == 13 && sInput)
			{
				//command
				const sCommand = lstCommands.filter(sCommand => sInput.indexOf(sCommand) === 0)[0];
				if(sCommand)
				{
					That.HandleMessageCommand(sInput);
				}
				//message
				else
				{
					That.PublishEvent(That.fayeClient, "message", {
						sData : sInput,
						sGUID : That.GUID,
						sWho : That.sUsername
					});
				}
				jqelInput.val("");
			}
		});
	}

	ConnectToServer()
	{
		const sFayeConnection = Config.GetFayeConnectionUrl();
		console.log("sFayeConnection: ", sFayeConnection);
		this.fayeClient = new faye.Client(sFayeConnection);
		this.fayeClient = this.AddSubscription(this.fayeClient, "receive");
	}

	AddSubscription(fayeClient, sSubscription)
	{
		const newFayeClient = fayeClient;

		switch(sSubscription.toLowerCase())
		{
			case "receive":
				newFayeClient.subscribe("/message/receive", (oResponse) =>
				{
					const sMessage = oResponse.sData;
					const bMyGuid = oResponse.sGUID === this.GUID;
					const sWho = oResponse.sWho;
					this.AppendMessage(sMessage, bMyGuid, sWho);
				});
			break;
		}

		return newFayeClient;
	}

	PublishEvent(fayeClient, sEventToPublish, oParams)
	{
		switch(sEventToPublish)
		{
			case "message":
				fayeClient.publish("/message/send", oParams);
			break;
		}
	}

	AppendMessage(sMessage, bMyGuid, _sWho)
	{
		let sMessageDivClass = "";
		const sWho = bMyGuid ? "Me" : _sWho ? _sWho : "Anon";
		if(bMyGuid)
			sMessageDivClass = "new-message-me-container"
		else
			sMessageDivClass = "new-message-brothers-container"

		const jqelNewMessageDivWrapper = $("<div/>", {
			class : "new-message-wrapper"
		});

		const jqelNewMessageDivContainer = $("<div/>", {
			class : "new-message-container"
		}).appendTo(jqelNewMessageDivWrapper);

		const jqelNewMessageHeaderTextContainer = $("<div/>", {
			class : "new-message-header-text-container",
			text : sWho
		}).appendTo(jqelNewMessageDivContainer);

		const jqelNewMessageDivBodyContainer = $("<div/>", {
			text : sMessage,
			class : `${sMessageDivClass} new-message-base-container`
		}).appendTo(jqelNewMessageDivContainer);

		jqelOutput.append(jqelNewMessageDivWrapper);

		//keep scroll at bottom
		jqelOutputWrapper[0].scrollTop = jqelOutputWrapper[0].scrollHeight;
	}

	GenerateGUID()
	{
	    var d = new Date().getTime(); 
	    if(window.performance && typeof window.performance.now === "function"){
	        d += performance.now(); //use high-precision timer if available
	    }
	    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
	        var r = (d + Math.random()*16)%16 | 0;
	        d = Math.floor(d/16);
	        return (c=='x' ? r : (r&0x3|0x8)).toString(16);
	    });
	    return uuid;
	}

	HandleMessageCommand(sCommandInput)
	{
		const lstCommandAndParams = sCommandInput.split(" ");
		const sCommand = lstCommandAndParams[0];
		switch(sCommand)
		{
			case "/name":
				const sName = lstCommandAndParams[1];
				if(sName)
				{
					this.sUsername = sName;
					this.AppendMessage(`Your name has been set to ${sName}`, true, "");
				}
			break;
			default:
				console.log(sCommandInput.toLowerCase());
			break;
		}
	}
}

const chat = new Chat();
chat.Initialize();

q = chat;
$$=$
