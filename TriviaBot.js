'use strict'
const tmi = require('tmi.js')
const fs = require('fs');


// Valid commands start with:
let commandPrefix = '!'
var questionActive = false;
let activeQuestionNumber;
let defaultBounty = 100;
// Define configuration options:
let opts = {
  questionTime: 60,
  mode: "auto",
  selectMode: "random",
  identity: {
    username: "umbotz",
    password: "oauth:r5ae9w906asiw1qk8bkngdla1eo7le"
  },
  channels: ["#umbotz"],
  "connection": {},
  "options": {}
}

let qnas



// These are the commands the bot knows (defined below):
let knownCommands = {
  echo,
  trivia
}

// Function called when the "echo" command is issued:
function echo(target, context, params) {
  // If there's something to echo:
  if (params.length) {
    // Join the params into a string:
    const msg = params.join(' ')
    // Send it back to the correct place:
    sendMessage(target, context, msg)
  } else { // Nothing to echo
    console.log(`* Nothing to echo`)
  }
}


// trivia functionalities
function trivia(target, context, params) {
  switch (params[0]) {
    case "start":
      if (!questionActive) {
        questionActive = true;
        sendMessage(target, context, "starting trivia");
        let q = selectQuestion(target);
        console.log(q);
        sendMessage(target, context, q.question)
        console.log(target);
        console.log(context);
        let to = setTimeout(function() {
          questionTimeout(target, context)
        }, (opts.questionTime * 1000));


      } else {
        console.log("there is an open trivia question already.");
      }
      break;
    case "save":
      if (params[1] === undefined) {
        sendMessage(target, context, "please provide a file name (e.g. !trivia save fantasy)")

      } else {
        saveFile(qnas, encodeURI(params[1]));
      }
      break;
    case "load":
      if (params[1] === undefined) {
        sendMessage(target, context, "please specify the file name (e.g. !trivia load history)")
      } else {
        loadQna(encodeURI(params[1]))

      }
      break;
  }

}


function selectQuestion(channel) {
  if (opts.selectMode == "random") {
    // get random number for question
    activeQuestionNumber = getRandomInt(0, Object.keys(qnas).length - 1);

  } else if (opts.selectMode == "order") {
    // go to next question
    if (activeQuestionNumber <= Object.keys(qnas).length - 1) {
      activeQuestionNumber++;
    } else {
      activeQuestionNumber = 0;
    }
  }
  return qnas[activeQuestionNumber];
}

function questionTimeout(target, context) {
  console.log("timing out q");
  console.log(target);
  console.log(context);
  if (questionActive) {
    questionActive = false
    sendMessage(target, context, "No one answered the question correctly, closing question.");

  }
}

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}


// Helper function to send the correct type of message:
function sendMessage(target, context, message) {
  if (context['message-type'] === 'whisper') {
    client.whisper(target, message)
  } else {
    client.say(target, message)
  }
}

// Create a client with our options:
let client = new tmi.client(opts)

// Register our event handlers (defined below):
client.on('message', onMessageHandler)
client.on('connected', onConnectedHandler)
client.on('disconnected', onDisconnectedHandler)

// Connect to Twitch:
client.connect()

// Called every time a message comes in:
function onMessageHandler(target, context, msg, self) {
  if (self) {
    return
  } // Ignore messages from the bot

  // This isn't a command since it has no prefix:
  if (msg.substr(0, 1) !== commandPrefix) {
    console.log(`[${target} (${context['message-type']})] ${context.username}: ${msg}`)

    if (questionActive &&
      qnas[activeQuestionNumber].answers.indexOf(`${msg}`) != -1) {
      // handle correct answer
      console.log("correct answer by: " + `${context.username}: ${msg}`);
      sendMessage(target, context, `Correct answer by ${context["display-name"]}: ${msg}`);
      sendMessage(target, context, `!add ${qnas[activeQuestionNumber].bounty !== undefined? qnas[activeQuestionNumber].bounty: defaultBounty} ${context.username}`);
      questionActive = false;

    }
    return;
  }

  // Split the message into individual words:
  const parse = msg.slice(1).split(' ')
  // The command name is the first (0th) one:
  const commandName = parse[0]
  // The rest (if any) are the parameters:
  const params = parse.splice(1)

  // If the command is known, let's execute it:
  if (commandName in knownCommands) {
    // Retrieve the function by its name:
    const command = knownCommands[commandName]
    // Then call the command with parameters:
    command(target, context, params)
    console.log(`* Executed ${commandName} command for ${context.username}`)
  } else {
    console.log(`* Unknown command ${commandName} from ${context.username}`)
  }
}

// Called every time the bot connects to Twitch chat:
function onConnectedHandler(addr, port) {
  qnas = loadFile("demoSetOne");
  opts = loadFile("./../opts");
  console.log(`* Connected to ${addr}:${port}`)
}

// Called every time the bot disconnects from Twitch:
function onDisconnectedHandler(reason) {
  console.log(`Disconnected: ${reason}`)
  process.exit(1)
}



function loadQna(fileName){
  let data = loadFile(fileName);
  if (loaded.Error === undefined) {
    qnas = loaded
  } else {
    sendMessage(target, context, "An Error occured while loading the file: " + loaded.error)
  }
}

function loadFile(fileName) {
  var path = "./sets/" + fileName;
  path = forceJsonFilename(path)
  fs.readFile(path, 'utf8', function readFileCallback(err, data) {
    if (err) {
      console.log(err);
            return err;
    } else {
      return JSON.parse(data);
    }
  });
}

function saveFile(object, fileName) {
  var path = "./sets/" + fileName
  path = forceJsonFilename(path)
  var json = JSON.stringify(object);
  fs.writeFile(path, json, 'utf8', function() {});

}

function forceJsonFilename(path) {
  if (path.substr(path.length - 5) != ".json") {
    return path + ".json"
  }
  return path
}
