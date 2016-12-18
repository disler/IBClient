//project constants
const electron = require('electron')
const {ipcRenderer} = require('electron');
const fs = require("fs-extra");
const path = require('path')
const $ = require("jquery");
const Config = require("./config.js");
const {APPLICATION_APP_DATA_PATH, APPLICATION_APP_BASE_PATH} = ipcRenderer.sendSync("request-app-paths");
const {bLoadExternalApps} = ipcRenderer.sendSync("should-load-external-apps");

//app level constants
const COMPONENTS_DIR_NAME = "external_components";
const CONFIG_FILE_NAME = "config.json";
const CONFIG_DIR_NAME = "config";
const DEFAULT_CONFIGURATION_JSON = Config.GetDefaultConfiguration();

//dom level constants
const jqelHead = $("head");
const jqelHeaderApps = $("#apps");

class Initial
{
	constructor(){
		//constants to be set once
		this.CONFIG_DIRECTORY_PATH = "";
		this.CONFIG_FILE_PATH = "";
		this.COMPONENTS_DIRECTORY_PATH = "";
		this.APP_BASE_PATH = "";
		this.APP_DATA_PATH = "";
		this.APP_COMPONENTS_DIR_PATH = "";
		this.sCurrentView = "welcome";

		this.Configure();
        this.ConnectToDom();

	}

	ConnectToDom()
	{
		const That = this;
		$(document).on("click", ".header-app-container", function(evt)
		{
			const sAppName = this.getAttribute("app");
			That.ChangeView(sAppName);
		});

        //show username to user on app startup
        const sUsername = Config.GetUserConfig('username');
        $('span.username').text(sUsername);
	}

	Configure()
	{
		//set a reference for block use
		const config = Config;

		//application root directory
		this.APP_BASE_PATH = APPLICATION_APP_BASE_PATH;

		//data storage directory
		this.APP_DATA_PATH = APPLICATION_APP_DATA_PATH;

		//create configuration defaults
		const oApplicationPaths = this.CreateDefaultFilesAndGetApplicationPaths(APPLICATION_APP_BASE_PATH, APPLICATION_APP_DATA_PATH);

		//set the paths on the configuration class so that all furture callers can use it
		config.SetPaths(oApplicationPaths);

		//load the configuration file and reset it's instance
		config.Initialize();

		//get the list of external applications to load
		const lstApps = config.GetApplications();

		//import externally loaded applications
		if(bLoadExternalApps)
			this.ImportApplications(lstApps, oApplicationPaths.sComponentsDirectory, oApplicationPaths.sApplicationComponentsRunnableDirectory);

	}

	ImportApplications(lstApps, sComponentsFromDir, sComponentsToDir)
	{
		//for each app - if it doesn't already exists in the components directory import the directory, create a link tag for each, and insert it's icon
		lstApps.forEach(oAppData => 
		{
			//if this an external application attempt to load it
			if(oAppData.builtIntoCore === false)
			{
				//get the application name
				const sAppName = oAppData.name;

				//if the app exists already overwrite it
				const sImportToLocation = path.join(sComponentsToDir, sAppName);

				//if we should import the given application
				let bDoImportApplication = this.ValidAppForImport(oAppData, lstApps, sImportToLocation);

				//if we can import
				if(bDoImportApplication === true)
				{
					//copy the directory contents from the external app componets to the internal app components
					fs.copy(sComponentsFromDir, sComponentsToDir, function(err)
					{
						if(!err)
						{
							//append html link node to head dom
							jqelHead.append($("<link/>", {
								id : sAppName,
								rel : "import",
								href : `./app/components/${sAppName}/${oAppData.html}`
							}));

							//append icon to header section
							jqelHeaderApps.prepend($("<div/>", {
								app : `${sAppName}`,
								class : "header-app-container",
								html : $("<img/>", {
									class : "header-app-img",
									src : `./app/components/${sAppName}/${oAppData.iconInRelativePath}`
								})
							}));
						}
					}); 
				}
			}
		});
	}

	ValidAppForImport(oAppData, lstApps, sImportToLocation)
	{
		//if this app already exists
		if(fs.existsSync(sImportToLocation))
		{
			//if there is another app that's built into the core - you cannot overwrite it
			if(lstApps.filter(oAppDataOther => oAppDataOther.name == oAppData.name && oAppDataOther.builtIntoCore).length > 0)
			{
				//do nothing - we cannot overwrite core applications	
				return false;
			}
			//if the we do not have config overwrite permissions
			else if(!oAppData.overwrite)
			{
				return false;
			}
			//if we already installed an app like this and it's not a core app then overwrite it
			else
			{
				return true;
			}
		}
		//the app doesn't exist - overwrite it
		else
		{
			return true;
		}
	}

	CreateDefaultFilesAndGetApplicationPaths(sAppBasePath, sAppDataPath)
	{
		const sConfigDirectory = this.CONFIG_DIRECTORY_PATH = path.join(sAppDataPath, CONFIG_DIR_NAME);
		const sConfigFile = this.CONFIG_FILE_PATH = path.join(sConfigDirectory, CONFIG_FILE_NAME);
		const sComponentsDirectory = this.COMPONENTS_DIRECTORY_PATH = path.join(sConfigDirectory, COMPONENTS_DIR_NAME);
		
		//create config/*
		if(false === fs.existsSync(sConfigDirectory))
			fs.mkdirSync(sConfigDirectory);

		//create config/config.json
		if(false === fs.existsSync(sConfigFile))
			fs.writeFileSync(sConfigFile, JSON.stringify(DEFAULT_CONFIGURATION_JSON, null, "\t"));

		//create config/components/*
		if(false === fs.existsSync(sComponentsDirectory))
			fs.mkdirSync(sComponentsDirectory);

		//just set the application componenets directory
		const sApplicationComponentsRunnableDirectory = path.join(sAppBasePath, "app", "components");

		//return paths es6 object key instant-constructor
		return {
			sConfigDirectory,
			sConfigFile,
			sComponentsDirectory,
			sApplicationComponentsRunnableDirectory
		};
	}

	ChangeView(sViewName)
	{
		if(this.sCurrentView === sViewName)
			return;

		let oContentNode = "";
		let link = document.querySelector(`link[id="${sViewName}"]`);
		if(link)
		{
			//import the contents of the links template dom
			let template = link.import.querySelector(`.${sViewName}-template`);
			
			//copy the contents into a new node
			if(template)
				oContentNode = document.importNode(template.content, true);
		}

		if(oContentNode)
		{
			document.getElementById("content").innerHTML = "";
			document.getElementById("content").appendChild(oContentNode);
			this.sCurrentView = sViewName;
		}
	}
}


const init = new Initial();
