//configuration constants
let	$ = require("jquery"),
	moment = require("moment"),
	Config = require("../initial/config.js");

//dom constants


//project level constants
const lstCommands = ["/name"];

class Chat
{	
	constructor()
	{
		this.GUID = this.GenerateGUID();
		this.sUsername = Config.GetUserConfig("username") || "";
		this.sSessionID = Config.GetGlobalConfig("sessionID");

		this.jqelOutputWrapper = {};
		this.jqelOutput = {};
		this.jqelInput = {};
	}

	Initialize()
	{
		this.ConnectToDom();
		this.ConnectToServer();
		this.QueryInitialChat();
	}

	QueryInitialChat()
	{
		this.PublishEvent(this.fayeClient, "init", {
			sSessionID : this.sSessionID,
			sGUID : this.GUID,
			sWho : this.sUsername
		});
	}

	ConnectToDom()
	{
		//setup elements
		this.jqelOutputWrapper = $(".output-wrapper");
		this.jqelOutput = $("#output");
		this.jqelInput = $("#input");

		//setup events
		const That = this;
		$(this.jqelInput).on("keyup",  (e) =>
		{
			const sInput = That.jqelInput.val();
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
					const dtCreatedTime = new Date();
					That.PublishEvent(That.fayeClient, "message", {
						sData : sInput,
						sGUID : That.GUID,
						sWho : That.sUsername,
						sSessionID : That.sSessionID,
						dtCreatedTime : dtCreatedTime
					});
				}
				That.jqelInput.val("");
			}
		});
	}

	ConnectToServer()
	{
		this.fayeClient = Config.GetFayeInstance();
		this.fayeClient = this.AddSubscription(this.fayeClient, "receive");
		this.fayeClient = this.AddSubscription(this.fayeClient, "init");
	}

	AddSubscription(fayeClient, sSubscription)
	{
		const newFayeClient = fayeClient;

		switch(sSubscription.toLowerCase())
		{
			case "init":
				const sInitChannel = `/chat/init/receive/${this.GUID}`;
				newFayeClient.unsubscribe(sInitChannel);
				newFayeClient.subscribe(sInitChannel, (oResponse, sub_) => 
				{
					const lstMessages = oResponse.lstPreviousChatMessages;

					//order the dates
					lstMessages.sort((a, b) =>
					{
						return new Date(a.dtCreatedTime) <= new Date(b.dtCreatedTime) ? 0 : 1;
					});

					lstMessages.forEach((oMessage) =>
					{
						// console.log("oMessage: ", oMessage);
						const sMessage = oMessage.sMessage;
						const bIsMe = oMessage.sWho === this.sUsername;
						const sWho = oMessage.sWho;
						const dtCreatedTime = oMessage.dtCreatedTime;
						this.AppendMessage(sMessage, bIsMe, sWho, dtCreatedTime);
					});

				});
			break;
			case "receive":
				const sReceiveChannel = `/chat/message/receive/${this.sSessionID}`;
				newFayeClient.unsubscribe(sReceiveChannel);
				newFayeClient.subscribe(sReceiveChannel, (oResponse) =>
				{
					const sMessage = oResponse.sData;
					const bIsMe = oResponse.sGUID === this.GUID;
					const sWho = oResponse.sWho;
					const dtCreatedTime = oResponse.dtCreatedTime;
					this.AppendMessage(sMessage, bIsMe, sWho, dtCreatedTime);
				});
			break;
		}

		return newFayeClient;
	}

	PublishEvent(fayeClient, sEventToPublish, oParams)
	{
		switch(sEventToPublish)
		{
			case "init":
				fayeClient.publish(`/chat/init/send/${this.sSessionID}`, oParams);
			break;
			case "message":
				fayeClient.publish(`/chat/message/send/${this.sSessionID}`, oParams);
			break;
		}
	}

	AppendMessage(_sMessage, bMyGuid, _sWho, _sDate="")
	{
		//classes to be set
		let sMessageDivClass = "";
		let sMessageContainerDivClass = "";
		
		//determine who sent the message
		const sWho = bMyGuid ? "" : _sWho ? _sWho : "Anon";

		//format the date
		let sCurrentDate = moment(_sDate).format('MM/DD/YY h:mm:ss a') 
						|| moment().format('MM/DD/YY h:mm:ss a');

		//set our message
		let sMessage = `${_sMessage}`;

		if(bMyGuid)
		{
			sMessageContainerDivClass = "new-message-me-position-container";
			sMessageDivClass = "new-message-me-container"
		}
		else
		{
			sMessageContainerDivClass = "new-message-brothers-position-container";
			sMessageDivClass = "new-message-brothers-container"
		}

		const jqelNewMessageDivWrapper = $("<div/>", {
			class : "new-message-wrapper"
		});

		const jqelNewMessageDivContainer = $("<div/>", {
			class : `${sMessageContainerDivClass} new-message-container`
		}).appendTo(jqelNewMessageDivWrapper);

		const jqelNewMessageHeaderTextContainer = $("<div/>", {
			class : "new-message-header-text-container",
			text : sWho
		}).appendTo(jqelNewMessageDivContainer);
		
		const jqelNewMessageDateHeaderTextContainer = $("<div/>", {
			class : "new-message-header-text-date-container",
			text : sCurrentDate
		}).appendTo(jqelNewMessageDivContainer);

		const jqelNewMessageDivBodyContainer = $("<div/>", {
			text : sMessage,
			class : `${sMessageDivClass} new-message-base-container`
		}).appendTo(jqelNewMessageDivContainer);

		this.jqelOutput.append(jqelNewMessageDivWrapper);

		//keep scroll at bottom
		this.jqelOutputWrapper[0].scrollTop = this.jqelOutputWrapper[0].scrollHeight;
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

module.exports = new Chat();