const { Colors } = require("discord.js");

module.exports = {
    name: "resume",
    description: "Para resumir uma música",
    category: "user",
    timeout: 3000,
    aliases: ["resumir"],

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
    if (serverQueue.playing) return;
    if (serverQueue) {
        try {
            serverQueue.playing = true;
            serverQueue.audioPlayer.unpause();
            await message.reply({ content: "```\n▶️ Música resumida.\n```" })
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