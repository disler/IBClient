//configuration constants
const 	faye = require('faye'),
		iPort = 3333,
		$ = require("jquery");

//dom constants
const 	jqelOutput = $("#output");
const 	jqelInput = $("#input");

class Chat
{	
	constructor(){}

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
				That.PublishEvent(That.fayeClient, "message", {
					sData : sInput,
				});
				jqelInput.val("");
			}
		});
	}

	ConnectToServer()
	{
		this.fayeClient = new faye.Client(`http://localhost:${iPort}/faye`);
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

					const jqelNewMessageDiv = $("<div/>", {
						text : sMessage
					})

					jqelOutput.append(jqelNewMessageDiv);
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
}

const chat = new Chat();
chat.Initialize();
