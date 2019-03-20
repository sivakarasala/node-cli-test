// Dependencies
const readline = require("readline");
const util = require("util");
const debug = util.debuglog("cli");
const events = require("events");
class _events extends events {}
const e = new _events();
const os = require("os");
const fs = require("fs");
const path = require("path");

// Instantiate the cli module object
const cli = {};

// Input handlers
e.on("man", function(str) {
  cli.responders.help();
});

e.on("help", function(str) {
  cli.responders.help();
});

e.on("exit", function(str) {
  cli.responders.exit();
});

e.on("stats", function() {
  cli.responders.stats();
});

e.on("set", function(str) {
  const extractData = str.trim().slice(3);
  const splitData = extractData.trim().split("=");
  const trimmedData = [];
  for (let item of splitData) {
    if (item.trim() !== "") {
      trimmedData.push(item.trim());
    }
  }
  cli.responders.set(trimmedData);
});

e.on("get", function(str) {
  cli.responders.get(
    str
      .trim()
      .slice(3)
      .trim()
  );
});

// Responder object
cli.responders = {};

// Hepl / Man
cli.responders.help = function() {
  // Codify the commands and their explanations
  const commands = {
    exit: "Kill the CLI (and the rest of the application)",
    man: "Show this help page",
    help: 'Alias of the "man" command',
    stats:
      "Get statistics on the underlying operating system and resource utilization",
    SET: "set props on user config object -- SET username=shambho",
    GET: "get value of prop on user config object -- GET username",
    "GET *": "gets all props on user config object -- GET *"
  };

  // Show a header for the help page that is as wide as the screen
  cli.horizontalLine();
  cli.centered("CLI MANUAL");
  cli.horizontalLine();
  cli.verticalSpace(2);

  // Show each command, followed by its explanation, in white and yellow respectively
  for (let key in commands) {
    if (commands.hasOwnProperty(key)) {
      let value = commands[key];
      let line = "      \x1b[33m " + key + "      \x1b[0m";
      let padding = 60 - line.length;
      for (i = 0; i < padding; i++) {
        line += " ";
      }
      line += value;
      console.log(line);
      cli.verticalSpace();
    }
  }
  cli.verticalSpace(1);

  // End with another horizontal line
  cli.horizontalLine();
};

// Create a vertical space
cli.verticalSpace = function(lines) {
  lines = typeof lines == "number" && lines > 0 ? lines : 1;
  for (i = 0; i < lines; i++) {
    console.log("");
  }
};

// Create a horizontal line across the screen
cli.horizontalLine = function() {
  // Get the available screen size
  const width = process.stdout.columns;

  // Put in enough dashes to go across the screen
  var line = "";
  for (i = 0; i < width; i++) {
    line += "-";
  }
  console.log(line);
};

// Create centered text on the screen
cli.centered = function(str) {
  str = typeof str == "string" && str.trim().length > 0 ? str.trim() : "";

  // Get the available screen size
  const width = process.stdout.columns;

  // Calculate the left padding there should be
  const leftPadding = Math.floor((width - str.length) / 2);

  // Put in left padded spaces before the string itself
  let line = "";
  for (i = 0; i < leftPadding; i++) {
    line += " ";
  }
  line += str;
  console.log(line);
};

// Exit
cli.responders.exit = function() {
  process.exit(0);
};

// Stats
cli.responders.stats = function() {
  const stats = {
    "Load Average": os.loadavg().join(" "),
    "CPU Count": os.cpus().length,
    "Free Memory": os.freemem(),
    Uptime: os.uptime() + " Seconds"
  };

  // Create header for the stats
  cli.horizontalLine();
  cli.centered("SYSTEM STATS");
  cli.horizontalLine();
  cli.verticalSpace(2);

  // Log out each stat
  for (let key in stats) {
    if (stats.hasOwnProperty(key)) {
      let value = stats[key];
      let line = "      \x1b[33m " + key + "      \x1b[0m";
      let padding = 60 - line.length;
      for (i = 0; i < padding; i++) {
        line += " ";
      }
      line += value;
      console.log(line);
      cli.verticalSpace();
    }
  }
  cli.verticalSpace(1);

  // End with another horizontal line
  cli.horizontalLine();
};

// SET responders
cli.responders.set = function(str) {
  if (str.length !== 2) {
    console.log(
      "\x1b[91m%s\x1b[0m",
      'Invalid Input TRY "SET SHIVA=SHAMBHO_123"'
    );
  } else if (!isNaN(str[0]) || !isNaN(str[1])) {
    console.log(
      "\x1b[91m%s\x1b[0m",
      'Invalid input try using string type "SET SHIVA=SHAMBHO_123"'
    );
  } else if (/[~` !#$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/g.test(str[1])) {
    console.log(
      "\x1b[91m%s\x1b[0m",
      "Invalid value for key, use only alphanumeric chars(underscore accepted) --SET SHIVA=SHAMBHO_123--"
    );
  } else {
    let rawdata = fs.readFileSync(
      path.join(__dirname, "./config.json"),
      "utf8"
    );
    let data = {};
    if (rawdata != "") {
      data = JSON.parse(rawdata);
    }
    data[str[0]] = str[1];
    let writeData = JSON.stringify(data);
    fs.writeFileSync(path.join(__dirname, "./config.json"), writeData, "utf8");
  }
};

// GET responders
cli.responders.get = function(str) {
  let rawdata = fs.readFileSync(path.join(__dirname, "./config.json"), "utf8");
  let data = {};
  if (rawdata != "") {
    data = JSON.parse(rawdata);
  }
  if (str == "*") {
    console.log("\x1b[95m%s\x1b[0m", JSON.stringify(data, null, 2));
  } else {
    if (data.hasOwnProperty(str)) {
      console.log("\x1b[95m%s\x1b[0m", `${str}=${data[str]}`);
    } else {
      console.log("\x1b[91m%s\x1b[0m", "Invalid key");
    }
  }
};

// Input processor
cli.processInput = function(str) {
  str = typeof str == "string" && str.trim().length > 0 ? str.trim() : false;
  // Only process the input if the user actually wrote something, otherwise ignore it
  if (str) {
    // Codify the unique strings that identify the different unique questions allowed be the asked
    const uniqueInputs = ["man", "help", "exit", "stats", "set", "get"];

    // Go through the possible inputs, emit event when a match is found
    let matchFound = false;
    let counter = 0;
    uniqueInputs.some(function(input) {
      if (str.toLowerCase().indexOf(input) > -1) {
        matchFound = true;
        // Emit event matching the unique input, and include the full string given
        e.emit(input, str);
        return true;
      }
    });
    // If no match is found, tell the user to try again
    if (!matchFound) {
      console.log(str, "aum");
    }
  }
};

// Init script
cli.init = function() {
  // Send to console, in dark blue
  console.log("\x1b[34m%s\x1b[0m", "Node CLI - try help");

  // Start the interface
  var _interface = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: ">>>"
  });

  // Create an initial prompt
  _interface.prompt();

  // Handle each line of input separately
  _interface.on("line", function(str) {
    // Send to the input processor
    cli.processInput(str);

    // Re-initialize the prompt afterwards
    _interface.prompt();
  });

  // If the user stops the CLI, kill the associated process
  _interface.on("close", function() {
    process.exit(0);
  });
};

// Export the module
module.exports = cli;
