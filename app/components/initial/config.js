const fs = require("fs"),
 	faye = require('faye'),
	{ipcRenderer} = require('electron');
 	
const DEFAULT_FAYE_LOCAL_PORT = 3333;

class Config
{
	constructor()
	{
		this.oConfig = {};
		this.oPaths = {};
		this.oServices = {};
	}

	Initialize()
	{
		if(this.oPaths)
		{
			if(this.oPaths.sConfigFile)
				this.LoadAndStoreConfigurationFile(this.oPaths.sConfigFile);

			const sFayeConnection = this.GetFayeConnectionUrl();

			//load faye and store on the configurations services property
			this.oServices.Faye = new faye.Client(sFayeConnection);
		}

		this.ResetExport();
	}

	GenerateNewSessionID()
	{
		const sNewGUID = this.GenerateGUID();
		this.oConfig.global.sessionID = sNewGUID;
		return sNewGUID;
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

	GetFayeInstance()
	{
		return this.oServices.Faye;
	}

	LoadAndStoreConfigurationFile(sConfigFilePath)
	{
		const sConfig = fs.readFileSync(sConfigFilePath);
		if(sConfig)
			this.oConfig = JSON.parse(sConfig);
	}

	GetApplications()
	{
		let lstExternalApplicationData = [];
		if(this.oConfig.apps)
		{	
			//ensure the app has all the required configuration fields
			lstExternalApplicationData = this.oConfig.apps.filter(oAppData => {
				if(oAppData.builtIntoCore === true)
					return oAppData.id && oAppData.name;
				else
					return 	oAppData.id && 
							oAppData.name && 
							oAppData.relativePath !== undefined && 
							oAppData.html !== undefined && 
							oAppData.iconInRelativePath !== undefined;
			});
		}

		return lstExternalApplicationData;
	}

	SetPaths(_oPaths)
	{
		this.oPaths = _oPaths;
		this.ResetExport();
	}

	SetConfiguration(_oConfig)
	{
		this.oConfig = _oConfig;
		this.ResetExport();
	}

    // grabs username field from config.json in appdata
	GetUserConfig(sFieldName)
	{
		return this.oConfig.user[sFieldName];
	}

	GetFayeConnectionUrl()
	{
		if(this.oConfig.global.production === false)
			return this.oConfig.global.faye.debugServerUrl;
		else
			return this.oConfig.global.faye.productionServerUrl;
	}

	GetGlobalConfig(sKey)
	{
		if(this.oConfig.global[sKey])
			return this.oConfig.global[sKey];
		return false;
	}

	ResetExport()
	{
		//on configuration change reset the export value for 'require("config.js")' for future importers
		module.exports = this;		
	}

	/*

	*/
	SaveConfiguration(oFieldAndValue)
	{
		if(oFieldAndValue.username)
			this.oConfig.user.username = oFieldAndValue.username;
		if(oFieldAndValue.sessionID)
			this.oConfig.global.sessionID = oFieldAndValue.sessionID;

		this.SaveConfigurationFile(this.oConfig);
	}

	SaveConfigurationFile(oNewConfig)
	{
		const sNewConfig = JSON.stringify(oNewConfig, null, "\t");
		fs.writeFile(this.oPaths.sConfigFile, sNewConfig, {flag: "w"}, function(err)
		{
			if(err)
			{
				console.log("err: ", err);
			}
			else
			{
				console.log("success");

				//restart the application on success to reload configuration
				ipcRenderer.sendSync("restart");
			}
		});
	}

	GetDefaultConfiguration()
	{
		return {
			user : {
				"username":"New User"
			},
			global : {
				sessionID : "d3e32d75-4bb3-41d7-bf78-3c8162571012",
				production : true,
				faye : {
					"productionServerUrl" : "http://10.0.0.99:3333/faye",
					"debugServerUrl" : `http://localhost:${DEFAULT_FAYE_LOCAL_PORT}/faye`
				}
			},
			apps : [
				{
					"id":"72c67a0f-4389-4084-91b2-650ea8cf310e", 
					"name":"chat", 
					"builtIntoCore":true
				}
			]
		}
	}
}

//export a default file
module.exports = new Config();
