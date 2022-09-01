const { EmbedBuilder, Colors } = require('discord.js');

module.exports = {
  name: 'clear',
  description: 'Para limpar mensagens em um chat',
  category: 'staff',
  timeout: 3000,
  aliases: ['limpar'],

  async execute(client, message, args) {
    try {
      if (!message.member.permissions.has('Administrator')) return;
      const amount = args[0] || 100;
      if (!amount || isNaN(amount) || parseInt(amount) < 1) return;
      message.delete();
      const embedAuthor = new EmbedBuilder()
        .setColor(Colors.DarkButNotBlack)
        .setDescription(
          '```diff\n- [APP] MESSAGE DELETE ERROR: SÓ É POSSÍVEL DELETAR MENSAGENS COM MENOS DE 14 DIAS QUE FORAM ENVIADAS\n```'
        )
        .setTimestamp();
      message.channel.bulkDelete(amount, true).catch((e) => {
        console.log(
          '[APP] MESSAGE DELETE ERROR: SÓ É POSSÍVEL DELETAR MENSAGENS COM MENOS DE 14 DIAS QUE FORAM ENVIADAS'
        );
        return message.author.send({ embeds: [embedAuthor] });
      });
      return;
    } catch (e) {
      return console.log(e);
    }
  },
};
