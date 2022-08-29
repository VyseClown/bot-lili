/////////////////////// IMPORTS //////////////////////////
const { Client, Collection, Routes, Partials } = require('discord.js');
const {
  Channel,
  GuildMember,
  Message,
  Reaction,
  ThreadMember,
  User,
  GuildScheduledEvent,
} = Partials;
const dotenv = require('dotenv');
const { readdirSync, readdir } = require('fs');
const { AudioPlayer } = require('@discordjs/voice');
const { REST } = require('@discordjs/rest');

/////////////////////// ENGINE CONFIG //////////////////////////
dotenv.config();
const client = new Client({
  intents: 131071,
  partials: [
    Channel,
    GuildMember,
    Message,
    Reaction,
    ThreadMember,
    User,
    GuildScheduledEvent,
  ],
});
const configVars = {
  token: process.env.TOKEN,
};
client.commands = new Collection();
client.queue = new Collection();
client.timeout = new Collection();
client.player = new AudioPlayer();
client.slashCommands = new Collection();

const commands = readdirSync(`./src/commands`).filter((file) =>
  file.endsWith('.js')
);
for (const file of commands) {
  const cmd = require(`./commands/${file}`);
  if (cmd.category != 'ceo') {
    client.slashCommands.set(cmd.name, cmd);
  }
  client.commands.set(cmd.name, cmd);
}
console.log('[SOURCE] COMMANDS RELOADED');

readdir(__dirname + '/events/', (err, files) => {
  if (err) return console.error(err);
  files.forEach((file) => {
    const event = require(__dirname + `/events/${file}`);
    let eventName = file.split('.')[0];
    client.on(eventName, event.bind(null, client));
  });
});
console.log('[SOURCE] EVENTS RELOADED');

const rest = new REST({ version: '10' }).setToken(configVars.token);

(async () => {
  try {
    console.log('[SOURCE] STARTING GLOBAL COMMANDDS...');

    await rest.put(Routes.applicationCommands('1012930271424806973'), {
      body: client.slashCommands,
    });

    console.log('[SOURCE] GLOBAL COMMANDDS STARTED');
  } catch (error) {
    console.error(error);
  }
})();

/////////////////////// SOURCE CODE //////////////////////////
client.login(configVars.token);
