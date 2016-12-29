//configuration constants
let	$ = require("jquery"),
	moment = require("moment"),
	Config = require("../initial/config.js"),
	// JS Opener Victor Costan
	// description: opens programs, websites, and folder locations using node.js
	// github: https://github.com/pwnall/node-open/blob/master/lib/open.js
	open = require('open');

//dom constants


//project level constants
const lstCommands = ["/name"];
const lstComSuffixes = [".com", ".net", ".org", ".eu"];

function aTagClick(_target) {
	alert(_target);
	return;
}

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
	
	// Displays external links as clickable elements.
	// Returns an html string.
	ParseMessage(_sMessage)
	{
		let _divMessage = $("<div/>");
		let _sHTMLMessage = "";
		let _comIndex = -1;
		let _lstWords = _sMessage.split(" ");
		let _lstLinks = _lstWords;
		let _newTag;
		
		// Search throughout the sMessage for seperate chunks.
		for(let i = 0; i < _lstWords.length; i++) {
			
			_comIndex = -1;
			_newTag = $("<span/>", {
				text : _lstWords[i]
			});
			
			// search through each individual word for '.com'
			for(let j = 0; j < lstComSuffixes.length; j++) {
				if( ( _comIndex = _lstWords[i].indexOf( lstComSuffixes[j] ) ) != -1) {
					
					break;
				}
			}
			
			// when a link is found, run this code.
			if(_comIndex !== -1) { console.log("_comIndex",_comIndex);
				//_lstWords[i] = `<a href="javascript:void(0);" data-href="${_lstLinks[i]}" onclick="open('${_lstLinks[i]}')">${_lstLinks[i]}</a>`;
				_newTag = document.createElement("a"); 
				_newTag.href = "#";
				_newTag.innerHTML = _lstLinks[i];
				
				// We must set a custom a tag attribute because without it
				// the selected i index would iterate and call the incorrect
				// index.
				_newTag.indexHref = i;
				
				_newTag.onclick = function(e) {  
					//console.log("list: ",_newTag.indexHref,_lstLinks[0]);
					open( _lstLinks[this.indexHref] );
				};
				_newTag = $(_newTag);
			}
			
			// Put the word back in. (now containing the a tags)
			_newTag.appendTo(_divMessage);
			//_sHTMLMessage = _sHTMLMessage + _lstWords[i] + ((i < _lstWords.length) ? "" : " ");
			
		}
		
		return _divMessage;
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
		
		let sHTMLMessage = this.ParseMessage(sMessage);
		
		const jqelNewMessageDivBodyContainer = $("<div/>", {
			html : sHTMLMessage,
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