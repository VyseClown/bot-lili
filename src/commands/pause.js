const { Colors, EmbedBuilder } = require("discord.js");

module.exports = {
    name: "pause",
    description: "Para pausar uma música",
    category: "user",
    timeout: 3000,
    aliases: ["pausar"],

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
        if (!serverQueue.playing) return;
        if (serverQueue) {
            try {
                serverQueue.playing = false;
                serverQueue.audioPlayer.pause();
                await message.reply({ content: "```\n⏸️ Música pausada.\n```" })
            } catch (e) {
                console.log(e);
            }
        } else {
            await message.update({
                embeds: [serverQueue.songs[0].embed],
            });
        }
        return;
    }
}