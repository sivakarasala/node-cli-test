const cli = require("./lib/cli");

const app = {};

app.init = function() {
  cli.init();
};

app.init();

module.exports = app;
