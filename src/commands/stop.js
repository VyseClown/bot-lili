const { Colors } = require("discord.js");

module.exports = {
    name: "stop",
    description: "Para parar a fila de músicas",
    category: "user",
    timeout: 3000,
    aliases: ["parar"],

    async execute(client, message, args) {
        const serverQueue = message.client.queue.get(message.guild.id);
        if (!serverQueue) {
            await message.update({
                embeds: [
                    {
                        color: Colors.Red,
                        description:
                            "```\n❌ - Fila de músicas finalizada.\n```",
                    },
                ],
                components: []
            });
            return;
        }
        if (!message.member.voice.channel) {
            message.reply({
                embeds: [
                    {
                        color: Colors.Red,
                        description:
                            "```\n❌ - Você precisa estar em um canal de voz para reagir!\n```",
                    },
                ],
                ephemeral: true,
            });
            return;
        }
        if (serverQueue.voiceChannel.id !== message.member.voice.channel.id) {
            message.reply({
                embeds: [
                    {
                        color: Colors.Red,
                        description:
                            "```\n❌ - O bot está sendo utilizado em outro canal.\n```",
                    },
                ],
                ephemeral: true,
            });
            return;
        }

        try {
            await message.reply({ content: "```\n⏹️ Fila de músicas finalizada.\n```" })
            await serverQueue.connection.disconnect();
            await client.queue.delete(message.guild.id);
            return;
        } catch (e) {
            console.log(e);
        }
        return;
    }
}