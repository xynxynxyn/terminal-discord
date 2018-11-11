const fs = require("fs");
const configObject = require("./config.json");
function generate_config() {
  if (process.env.SUDO_UID !== undefined) {
    console.log("Script is running as root user, aborting...");
    console.log("Please see the Installation section of the README");
    process.exit(0);
  }
  let homedir = process.env.HOME;
  let configDirPath;
  if (fs.existsSync(homedir + "/.config")) {
    configDirPath = homedir + "/.config/terminal-discord";
  } else {
    configDirPath = homedir + "/.terminal-discord";
  }
  let configFilePath = configDirPath + "/config.json";
  console.log("Does config directory exist: " + fs.existsSync(configDirPath));
  console.log("Does config file exist: " + fs.existsSync(configFilePath));
  if (!fs.existsSync(configDirPath)) {
    console.log("\nGenerating config directory at " + configDirPath);
    fs.mkdirSync(configDirPath);
  }
  if (!fs.existsSync(configFilePath)) {
    console.log(
      "\nGenerating default configuration file at " +
        configFilePath +
        " inside config directory.\n"
    );
    fs.writeFileSync(
      configFilePath,
      JSON.stringify(configObject, undefined, 4)
    );
  } else {
    console.log("terminal-discord config already exists.");
  }
}

generate_config();
