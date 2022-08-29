// -- BIBLIOTECAS E IMPORTS -- //
const sendError = require("../utils/error.js");
const ms = require("ms");

// -- EXPORT EVENT -- //
module.exports = async function (client, message) {
  try {
    var prefix = process.env.PREFIX
    const args = message.content.split(/ +/g);
    const commandName = args
      .shift()
      .slice(prefix.length)
      .toLowerCase();
    const cmd =
      client.commands.get(commandName) ||
      client.commands.find(
        (cmd) => cmd.aliases && cmd.aliases.includes(commandName)
      );

    if (
      !message.content.toLowerCase().startsWith(prefix) ||
      !message.guild ||
      message.author.bot
    )
      return;
    if (cmd) {
      if (cmd.timeout) {
        if (client.timeout.has(`${cmd.name}${message.author.id}`))
          return sendError(
            `Aguarde ${ms(
              client.timeout.get(`${cmd.name}${message.author.id}`) -
              Date.now(),
              { long: true }
            )} para usar esse comando novamente.`,
            message.channel
          );
        cmd.execute(client, message, args);
        client.timeout.set(
          `${cmd.name}${message.author.id}`,
          Date.now() + cmd.timeout
        );
        setTimeout(() => {
          client.timeout.delete(`${cmd.name}${message.author.id}`);
        }, cmd.timeout);
      }
    }
  } catch (e) {
    console.log(e);
    return sendError(
      "Alguma coisa desastrosa aconteceu :( Tente novamente...",
      message.channel
    );
  }
};
