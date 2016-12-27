let 	Traceroute = require('nodejs-traceroute'),
		$ = require("jquery");

let jqelAddressInput = $("#address"),
		jqelTable = $("#trace_table"),
		jqelStatus = $("#status"),
		jqelTableHeader = $("#trace_header");

class traceroute
{
	constructor()
	{
		this.Tracer = {};

		//@STATE
		this.sCurrentTraceTarget = "";
	}

	Initialize()
	{
		this.ConnectToDom();
		this.ConnectTracer();
	}

	ConnectToDom()
	{
		const That = this;
		$(document).on("keypress", jqelAddressInput, (evt) =>
		{
			if(evt.which === 13)
			{
				const sAddressFromInput = jqelAddressInput.val();
				if(sAddressFromInput)
				{
					That.Trace(sAddressFromInput);
				}
			}
		});
	}

	ConnectTracer()
	{
		this.Tracer = new Traceroute();
		this.Tracer.on('pid', (pid) => 
		{
            this.TraceStart(pid);
        })
        .on('destination', (destination) => 
        {
        	this.TraceDestination(destination);
        })
        .on('hop', (hop) => 
        {
        	this.TraceHop(hop);
        })
        .on('close', (code) => 
        {
        	this.TraceClose(code);
        });
	}

	Trace(sAddress, oOptions)
	{
		try
		{
			this.ConnectTracer();
			this.Tracer.trace(sAddress);
			this.sCurrentTraceTarget = sAddress;
			this.UpdateStatus("Tracing route to " + this.sCurrentTraceTarget);
		} catch(e)
		{
			this.UpdateStatus("Invalid Address ", e.toString());
			console.log(e);
		}

	}

	TraceStart(sPid)
	{
        console.log(`pid: ${sPid}`);
	}

	TraceDestination(sDestination)
	{
        console.log(`destination: ${sDestination}`);
	}

	TraceHop(oHop)
	{


		const iHopCount = oHop.hop,
				sAddress = oHop.ip,
				sRoundTripTime = oHop.rtt1,
				sTargetAddress = this.sCurrentTraceTarget;

		const jqelRow = $("<tr/>");
		const jqelHopColumn = $("<td/>", {html:iHopCount}).appendTo(jqelRow);
		const jqelAddressColumn = $("<td/>", {html:sAddress}).appendTo(jqelRow);
		const jqelRoundTripTimeColumn = $("<td/>", {html:sRoundTripTime}).appendTo(jqelRow);
		const jqelTargetAddress = $("<td/>", {html:sTargetAddress}).appendTo(jqelRow);

		jqelTableHeader.after(jqelRow);
	}

	TraceClose(sCode)
	{
		if(sCode == "0")
			this.UpdateStatus("success");
		else
			this.UpdateStatus("error");	

        console.log(`close: code ${sCode}`);
	}

	UpdateStatus(sMessage)
	{
		jqelStatus.html(sMessage);
		setTimeout(function()
		{
			jqelStatus.html("");
		}, 2500);
	}
}

module.exports = new traceroute();