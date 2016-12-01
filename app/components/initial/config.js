const fs = require("fs");
const DEFAULT_FAYE_LOCAL_PORT = 3333;

class Config
{
	constructor()
	{
		this.oConfig = {};
		this.oPaths = {};
	}

	Initialize()
	{
		if(this.oPaths)
		{
			if(this.oPaths.sConfigFile)
				this.LoadAndStoreConfigurationFile(this.oPaths.sConfigFile);
		}

		this.ResetExport();
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

	GetGlobalConfig()
	{
		if(this.oConfig.global.hotReload)
			return this.oConfig.global.hotReload;
		return false;
	}

	ResetExport()
	{
		//on configuration change reset the export value for 'require("config.js")' for future importers
		module.exports = this;		
	}

	GetDefaultConfiguration()
	{
		return {
			global : {
				production : false,
				faye : {
					"productionServerUrl" : "",
					"debugServerUrl" : `http://localhost:${DEFAULT_FAYE_LOCAL_PORT}/faye`
				}
			},
			user : {
				"username":""
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