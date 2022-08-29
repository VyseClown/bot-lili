const { Colors } = require("discord.js");
const play = require("../structures/createPlayer.js");

module.exports = {
    name: "skip",
    description: "Para pular uma música na fila",
    category: "user",
    timeout: 3000,
    aliases: ["skp", "next"],

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
            if (serverQueue.songs.length <= 1) {
                message.reply({ content: "```\n⏩ Música pulada, a fila de músicas terminou.\n```" })
                serverQueue.songs.shift();
                await message.guild.members.me.voice.disconnect();
                await message.client.queue.delete(message.guild.id);
                return;
            } else if (serverQueue.songs.length > 1) {
                serverQueue.prevSongs = [];
                await serverQueue.prevSongs.push(serverQueue.songs[0]);
                if (serverQueue.looping) {
                    await serverQueue.songs.push(serverQueue.songs[0]);
                }
                if (serverQueue.nigthCore) {
                    var random = Math.floor(
                        Math.random() * serverQueue.songs.length
                    );
                    await play.play(client, message, serverQueue.songs[random]);
                    serverQueue.songs.splice(random, 1);
                    return message.reply({ content: "```\n⏩ Próxima música...\n```" })
                }
                message.reply({ content: "```\n⏩ Próxima música...\n```" })
                await serverQueue.songs.shift();
                await play.play(client, message, serverQueue.songs[0]);
                return;
            }
        } catch (e) {
            console.log(e);
            await serverQueue.songs.shift();
            await play.play(client, message, serverQueue.songs[0]);
            return message.reply({ content: "❌ **Erro ao reagir**", ephemeral: true });
        }
        return;
    }
}