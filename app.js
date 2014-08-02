// Require the IRC Module
var irc = require("irc");
var fs = require("fs");
var http = require("http");
var https = require("https");
var config = fs.readFileSync("config.json");
config.userName = "IRCMyBot";
config.realName = "GitHub: https://mduk.pw/IRCMyBot";
config = JSON.parse(config);
var allNames = {};
var powerOPS = fs.readFileSync("powerOPS.json");
powerOPS = JSON.parse(powerOPS);
var disconnected = false;

var firstRun = true;

// Create the bot name
var bot = new irc.Client(config.server, config.username, config);
console.log("IRCMyBot: Connected");

// Listen for joins
bot.addListener("join", function(channel, who) {
	if (who !== config.username) {
		console.log(">> " + who + " has joined " + channel);
	}else{
		bot.say(channel, "Hello! I am " + config.username + "! Type !help for a list of commands.");
	}
	
	if (!firstRun)
	{
		bot.send("NAMES", channel);
	}else{
		firstRun = false;
	}
});

setInterval(function() {

	if (!disconnected)
	{
		config['channels'].forEach(function(k) {
			bot.send("NAMES", k);
		});
	}

}, 10000); // get the names every 10 seconds

function htmlEntities(str) {
	return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function isPOP(nick)
{
	if (nick in powerOPS)
	{
		return true;
	}else{
		return false;
	}
}

function isOP(nick, chan)
{
	if (allNames[chan][nick] == "@")
	{
		return true;
	}else{
		return false;
	}
}

function isVoice(nick, chan)
{
	if (allNames[chan][nick] == "+")
	{
		return true;
	}else{
		return false;
	}
}

function isNormal(nick, chan)
{
	if (allNames[chan][nick] === "")
	{
		return true;
	}else{
		return false;
	}
}

// Listen for messages
bot.addListener("message", function(nick, channel, message) {
	if (channel.substr(0,1) == "#") // This /has/ to be here.
	{
		if (message == "!help") {
			if (isPOP(nick)) {
				bot.say(nick, ">> PowerOP Commands <<");
				bot.say(nick, "++++++++++++++++++++++");
				bot.say(nick, "!explode — Disconnects bot.");
				bot.say(nick, "!part <channel> — Bot /parts with the channel.");
				bot.say(nick, "!join <channel> — Bot /joins channel.");
				bot.say(nick, "!nick <nick> — Bot changes nickname.");
			}
			if (isOP(nick, channel)) {
				bot.say(nick, "Available Commands");
				bot.say(nick, "++++++++++++++++++");
				bot.say(nick, "!help — Displays the list of available commands.");
				bot.say(nick, "!info — Displays information about the bot.");
				bot.say(nick, "!count — Displays the user count of the channel.");
				bot.say(nick, "!ping — Ping Pong.");
				bot.say(nick, "!@ or !ops — Sends a message to all online OPs.");
				bot.say(nick, "!b <nick> [reason] — Bans a user with an optional reason.");
				bot.say(nick, "!hb <nick> [reason] — Bans a user's hostname with an optional reason.");
				bot.say(nick, "!ub <nick> — Unbans a user.");
				bot.say(nick, "!uhb <nick> — Unbans a user's hostname.");
				bot.say(nick, "!q <nick> — Quiets a user.");
				bot.say(nick, "!uq <nick> — Unquiets a user.");
				bot.say(nick, "!k <nick> [reason] — Kicks a user from the channel.");
			}else{
				if (isVoice(nick, channel)) {
					bot.say(nick, "Available Commands");
					bot.say(nick, "++++++++++++++++++");
					bot.say(nick, "!help — Displays the list of available commands.");
					bot.say(nick, "!info — Displays information about the bot.");
					bot.say(nick, "!count — Displays the user count of the channel.");
					bot.say(nick, "!ping — Ping Pong.");
					bot.say(nick, "!@ or !ops — Sends a message to all online OPs.");
				}else{
					if (isNormal(nick, channel)) {
						bot.say(nick, "Available Commands");
						bot.say(nick, "++++++++++++++++++");
						bot.say(nick, "!help — Displays the list of available commands.");
						bot.say(nick, "!info — Displays information about the bot.");
						bot.say(nick, "!count — Displays the user count of the channel.");
						bot.say(nick, "!ping — Ping Pong.");
					}
				}
			}
		}
		
		if (message == "!info")
		{
			bot.say(nick, "Hello, I'm " + config.username + "!");
			bot.say(nick, "I am powered by IRCMyBot, so I'm open source!");
			bot.say(nick, "GitHub: https://mduk.pw/IRCMyBot • #IRCMyBot @ Freenode.net • Created by https://the.matrixdevuk.pw/");
		}
		
		if (message == "!ping")
		{
			bot.say(channel, nick + ": PONG! (/^_^)/ \\(^_^\\)");
		}
		
		if (message == "!count")
		{
			bot.say(channel, nick + ": There are " + Object.keys(allNames[channel]).length + " users in this channel.");
		}
		
		if (message == "!@" || message == "!ops")
		{
			if (isVoice(nick, channel) || isOP(nick, channel))
			{
				for (var k in allNames[channel]) {
					if (allNames[channel][k] == "@")
					{
						bot.say(k, "Hey, sorry to disturb you!");
						bot.say(k, nick + " over at " + channel + " is a voiced or OP'd user and has requested an OP looks at the chat.");
					}
				}
			}else{
				bot.say(channel, nick + ": Sorry! You must be voiced or above to use that command.");
			}
		}
		
		if (message.substr(0,2) == "!b")
		{
			if (isOP(config.username, channel))
			{
				if (isOP(nick, channel))
				{
					var stripped_message = message.replace("!b ", "");
					var name = stripped_message.split(" ")[0];
					if (name !== "")
					{
						if (stripped_message.split(" ").length > 2)
						{
							var reason = stripped_message.replace(name + " ", "");
							bot.send("MODE", channel, "+b", name);
							bot.send("KICK", channel, name);
							bot.say(name, "You have been banned from " + channel + " by " + nick);
							bot.say(name, "Reason: " + reason);
						}else{
							bot.send("MODE", channel, "+b", name);
							bot.send("KICK", channel, name);
							bot.say(name, "You have been banned from " + channel + " by " + nick);
							bot.say(name, "No reason was specified.");
						}
					}else{
						bot.say(channel, nick + ": Usage: !b <nick> [reason]");
					}
				}else{
					bot.say(channel, nick + ": Sorry! You must be OP to use that command.");
				}
			}else{
				bot.say(channel, nick + ": [ERROR] I couldn't complete that action because I need +o.");
			}
		}
		
		if (message.substr(0,3) == "!hb")
		{
			if (isOP(config.username, channel))
			{
				if (isOP(nick, channel))
				{
					var stripped_message = message.replace("!hb ", "");
					var name = stripped_message.split(" ")[0];
					if (name !== "")
					{
						var host;
						bot.whois(name, function(whois) {
							host = whois.host;
							if (host !== "")
							{
								if (stripped_message.split(" ").length > 2)
								{
									var reason = stripped_message.replace(name + " ", "");
									bot.send("MODE", channel, "+b", "*!*@" + host);
									bot.send("KICK", channel, name);
									bot.say(name, "You have been host banned from " + channel + " by " + nick);
									bot.say(name, "Reason: " + reason);
								}else{
									bot.send("MODE", channel, "+b", "*!*@" + host);
									bot.send("KICK", channel, name);
									bot.say(name, "You have been host banned from " + channel + " by " + nick);
									bot.say(name, "No reason was specified.");
								}
							}else{
								bot.say(nick, nick + ": [ERROR] I couldn't retrieve the hostname of " + name + ".");
							}
						});
					}else{
						bot.say(channel, nick + ": Usage: !hb <nick> [reason]");
					}
				}else{
					bot.say(channel, nick + ": Sorry! You must be OP to use that command.");
				}
			}else{
				bot.say(channel, nick + ": [ERROR] I couldn't complete that action because I need +o.");
			}
		}
		
		if (message.substr(0,4) == "!uhb")
		{
			if (isOP(config.username, channel))
			{
				if (isOP(nick, channel))
				{
					var name = message.split(" ")[0];
					if (name !== "")
					{
						var host;
						bot.whois(name, function(whois) {
							host = whois.host;
							if (host !== "")
							{
								bot.send("MODE", channel, "-b", "*!*@" + host);
								bot.send("KICK", channel, name);
								bot.say(name, "You have been host banned from " + channel + " by " + nick);
							}else{
								bot.say(nick, nick + ": [ERROR] I couldn't retrieve the hostname of " + name + ".");
							}
						});
					}else{
						bot.say(channel, nick + ": Usage: !uhb <nick> [reason]");
					}
				}else{
					bot.say(channel, nick + ": Sorry! You must be OP to use that command.");
				}
			}else{
				bot.say(channel, nick + ": [ERROR] I couldn't complete that action because I need +o.");
			}
		}
		
		if (message.substr(0,2) == "!k")
		{
			if (isOP(config.username, channel))
			{
				if (isOP(nick, channel))
				{
					var stripped_message = message.replace("!k ", "");
					var name = stripped_message.split(" ")[0];
					if (name !== "")
					{
						if (stripped_message.split(" ").length > 2)
						{
							var reason = stripped_message.replace(name + " ", "");
							bot.send("KICK", channel, name);
							bot.say(name, "You have been kicked from " + channel + " by " + nick);
							bot.say(name, "Reason: " + reason);
						}else{
							bot.send("KICK", channel, name);
							bot.say(name, "You have been kicked from " + channel + " by " + nick);
							bot.say(name, "No reason was specified.");
						}
					}else{
						bot.say(channel, nick + ": Usage: !k <nick> [reason]");
					}
				}else{
					bot.say(channel, nick + ": Sorry! You must be OP to use that command.");
				}
			}else{
				bot.say(channel, nick + ": [ERROR] I couldn't complete that action because I need +o.");
			}
		}
		
		if (message.substr(0,3) == "!ub")
		{
			if (isOP(config.username, channel))
			{
				if (isOP(nick, channel))
				{
					var name = message.replace("!ub ", "");
					if (name !== "")
					{
						bot.send("MODE", channel, "-b", name);
						bot.say(name, "You have been unbanned from " + channel + " by " + nick);
					}else{
						bot.say(channel, nick + ": Usage: !ub <nick>");
					}
				}else{
					bot.say(channel, nick + ": Sorry! You must be OP to use that command.");
				}
			}else{
				bot.say(channel, nick + ": [ERROR] I couldn't complete that action because I need +o.");
			}
		}
		
		if (message.substr(0,2) == "!q")
		{
			if (isOP(config.username, channel))
			{
				if (isOP(nick, channel))
				{
					var stripped_message = message.replace("!q ", "");
					var name = stripped_message.split(" ")[0];
					if (name !== "")
					{
						if (stripped_message.split(" ").length > 2)
						{
							var reason = stripped_message.replace(name + " ", "");
							bot.send("MODE", channel, "+q", name);
							bot.say(name, "You have been silenced in " + channel + " by " + nick);
							bot.say(name, "Reason: " + reason);
						}else{
							bot.send("MODE", channel, "+q", name);
							bot.say(name, "You have been silenced in " + channel + " by " + nick);
							bot.say(name, "No reason was specified.");
						}
					}else{
						bot.say(channel, nick + ": Usage: !q <nick> [reason]");
					}
				}else{
					bot.say(channel, nick + ": Sorry! You must be OP to use that command.");
				}
			}else{
				bot.say(channel, nick + ": [ERROR] I couldn't complete that action because I need +o.");
			}
		}
		
		if (message.substr(0,3) == "!uq")
		{
			if (isOP(config.username, channel))
			{
				if (isOP(nick, channel))
				{
					var name = message.replace("!uq ", "");
					if (name !== "")
					{
						bot.send("MODE", channel, "-q", name);
						bot.say(name, "You have been unsilenced in " + channel + " by " + nick);
					}else{
						bot.say(channel, nick + ": Usage: !uq <nick>");
					}
				}else{
					bot.say(channel, nick + ": Sorry! You must be OP to use that command.");
				}
			}else{
				bot.say(channel, nick + ": [ERROR] I couldn't complete that action because I need +o.");
			}
		}
	}
});

// Listen for PM's
bot.addListener("pm", function(nick, message) {
	if (message == "!explode")
	{
		bot.whois(nick, function(content) {
			if (content !== "" && isPOP(nick))
			{
				if (content['accountinfo'] == 'is logged in as')
				{
					bot.send("QUIT", "IRCMyBot :: https://mduk.pw/IRCMyBot");
					disconnected = true;
				}else{
					bot.say(nick, "You must be identified with the services to complete this action.");
				}
			}else{
				bot.say(nick, "You must be identified with the services to complete this action.");
			}
		});
	}
	
	if (message.substr(0,5) == "!part")
	{
		bot.whois(nick, function(content) {
			if (content !== "" && isPOP(nick))
			{
				if (content['accountinfo'] == 'is logged in as')
				{
					if (message.replace("!part ", "") !== "")
					{
						var channel = message.replace("!part ", "");
						if (channel.substr(0,1) !== "#")
						{
							bot.part("#" + channel, "IRCMyBot :: https://mduk.pw/IRCMyBot");
						}else{
							bot.part(channel, "IRCMyBot :: https://mduk.pw/IRCMyBot");
						}
					}else{
						bot.say(nick, "Usage: !part #<channel>");
					}
				}else{
					bot.say(nick, "You must be identified with the services to complete this action.");
				}
			}else{
				bot.say(nick, "You must be identified with the services to complete this action.");
			}
		});
	}
	
	if (message.substr(0,5) == "!join")
	{
		bot.whois(nick, function(content) {
			if (content !== "" && isPOP(nick))
			{
				if (content['accountinfo'] == 'is logged in as')
				{
					if (message.replace("!join ", "") !== "")
					{
						var channel = message.replace("!join ", "");
						if (channel.substr(0,1) !== "#")
						{
							bot.join("#" + channel);
						}else{
							bot.join(channel);
						}
					}else{
						bot.say(nick, "Usage: !join #<channel>");
					}
				}else{
					bot.say(nick, "You must be identified with the services to complete this action.");
				}
			}else{
				bot.say(nick, "You must be identified with the services to complete this action.");
			}
		});
	}
	
	if (message.substr(0,5) == "!nick")
	{
		bot.whois(nick, function(content) {
			if (content !== "" && isPOP(nick))
			{
				if (content['accountinfo'] == 'is logged in as')
				{
					if (message.replace("!nick ", "") !== "")
					{
						var nickname = message.replace("!nick ", "");
						bot.send("NICK", nickname);
					}else{
						bot.say(nick, "Usage: !nick <nick>");
					}
				}else{
					bot.say(nick, "You must be identified with the services to complete this action.");
				}
			}else{
				bot.say(nick, "You must be identified with the services to complete this action.");
			}
		});
	}
	
	if (message == "!whois!")
	{
		bot.whois(nick, function(whois) {
			bot.say(nick, JSON.stringify(whois));
		});
	}
});

bot.on('names', function(channel, names) {
	allNames[channel] = names;
	console.log("Updated " + channel + " names.");
	console.log(allNames);
});

bot.on('error', function(e) { console.log("--{{ ERROR }}--"); });