/////////////////////// IMPORTS //////////////////////////
const ytlist = require("ytpl");
const dl = require("play-dl");
const sendError = require("../utils/error.js");
const QUEUE_LIMIT = 100;
const { play } = require("../structures/createPlayer.js");
const playlist_init = require("../structures/strPlaylist.js");
const { joinVoiceChannel } = require("@discordjs/voice");
const { ApplicationCommandOptionType, EmbedBuilder, Colors } = require("discord.js");

/////////////////////// SOURCE CODE ///////////////////////////
module.exports = {
    name: "play",
    description: "Para tocar músicas no servidor",
    options: [
        {
            name: "song",
            type: ApplicationCommandOptionType.String,
            description: "Nome ou link da música",
            required: true,
        },
    ],
    usage: [
        process.env.PREFIX_KEY +
        "play [nome da música / link da música / link da playlist]",
    ],
    category: "user",
    timeout: 3000,
    aliases: ["p", "play", "iniciar"],

    async execute(client, message, args) {
        const embederror = new EmbedBuilder()
            .setColor(Colors.DarkButNotBlack)
        var query;
        if (args) {
            query = args[0]
                ? args.join(" ")
                : "" || args.get("song")
                    ? args.get("song").value
                    : args.join(" ");
        }
        const searchString = query || args.join(" ");
        if (!searchString)
            return sendError(
                "Você precisa digitar a música a ser tocada",
                message.channel
            );
        const url = args[0]
            ? args[0].replace(/<(.+)>/g, "$1")
            : "" || searchString || query;
        if (!searchString || !url) {
            embederror.setDescription("```\nComo usar: !p <Link da música ou playlist | Nome da música>\n```")
            return message.reply({
                embeds: [embederror],
                ephemeral: true
            });
        }

        const voiceChannel = message.member.voice.channel;
        if (!voiceChannel) {
            embederror.setDescription("```\n❌ - Você precisa estar em um canal de voz para iniciar uma música.\n```",)
            return message.reply({
                embeds: [embederror],
                ephemeral: true
            });

        }
        const permissions = voiceChannel.permissionsFor(message.client.user);
        if (!permissions.has("CONNECT"))
            return sendError(
                "Eu não teho permissões para conectar nesse canal :(",
                message.channel
            );
        if (!permissions.has("SPEAK"))
            return sendError(
                "Eu não teho permissões para falar nesse canal :(",
                message.channel
            );

        const playlistRegex = /^http(s)?:\/\/(www\.)?youtube.com\/.+list=.+$/;

        var isPlaylist = playlistRegex.test(url);

        const serverQueue = message.client.queue.get(message.guild.id);
        if (serverQueue) {
            if (serverQueue.voiceChannel.id !== message.member.voice.channel.id) {
                embederror.setDescription("```\n❌ - O bot está sendo utilizado em outro canal!\n```")
                message.reply({
                    embeds: [embederror],
                    ephemeral: true
                });
                return;
            }
        }

        if (isPlaylist) {
            try {
                if (serverQueue) {
                    if (
                        serverQueue.songs.length > Math.floor(QUEUE_LIMIT - 1) &&
                        QUEUE_LIMIT !== 0
                    ) {
                        return sendError(
                            `Você não pode adicionar mais de ${QUEUE_LIMIT} músicas na fila.`,
                            message.channel
                        );
                    }
                }
                const playlist = await ytlist(`${url.match(playlistRegex)}`);
                if (!playlist)
                    return sendError("Playlist não encontrada", message.channel);
                const videos = playlist.items;
                for (const video of videos) {
                    await playlist_init.handleVideo(
                        client,
                        video,
                        message,
                        voiceChannel,
                        true
                    );
                }
                return message.reply({
                    embeds: [
                        {
                            color: Colors.DarkButNotBlack,
                            description: `**Playlist adicionada à fila**`,
                            fields: [
                                {
                                    name: "> __Pedido por:__",
                                    value: "```fix\n" + `${message.member.user.tag}` + "\n```",
                                    inline: true,
                                },
                                {
                                    name: "> __Total de músicas:__",
                                    value: "```fix\n" + `${videos.length}` + "\n```",
                                    inline: true,
                                },
                            ],
                        },
                    ],
                });
            } catch {
                try {
                    if (serverQueue) {
                        if (
                            serverQueue.songs.length > Math.floor(QUEUE_LIMIT - 1) &&
                            QUEUE_LIMIT !== 0
                        ) {
                            return sendError(
                                `Você não pode adicionar mais de ${QUEUE_LIMIT} músicas na fila.`,
                                message.channel
                            );
                        }
                    }
                    var searched = await ytlist(searchString).catch(e => {
                        console.log(e);
                        return sendError("Ocorreu um erro ao tentar reproduzir essa playlist.", message.channel);
                    })
                    if (searched.length === 0)
                        return sendError(
                            "Eu não consegui achar essa playlist :(",
                            message.channel
                        );
                    const videos = await searched.items;
                    for (const video of videos) {
                        await playlist_init.handleVideo(
                            client,
                            video,
                            message,
                            voiceChannel,
                            true
                        );
                    }
                    return message.reply({
                        embeds: [
                            {
                                color: Colors.DarkButNotBlack,
                                description: `**Playlist adicionada à fila**`,
                                fields: [
                                    {
                                        name: "> __Pedido por:__",
                                        value: "```fix\n" + `${message.member.user.tag}` + "\n```",
                                        inline: true,
                                    },
                                    {
                                        name: "> __Total de músicas:__",
                                        value: "```fix\n" + `${videos.length}` + "\n```",
                                        inline: true,
                                    },
                                ],
                            },
                        ],
                    });
                } catch (error) {
                    console.log(error);
                }
            }
        } else {
            try {
                dl.authorization();
                await dl.search(`${searchString}`, { limit: 1 }).then(async (x) => {
                    const queueConstruct = {
                        textChannel: message.channel,
                        voiceChannel: voiceChannel,
                        connection: null,
                        audioPlayer: null,
                        resource: null,
                        songs: [],
                        prevSongs: [],
                        volume: 100,
                        nigthCore: false,
                        playing: true,
                        looping: false,
                        songLooping: false,
                    };
                    const song = {
                        title: x[0].title,
                        url: x[0].url,
                        thumbnail: x[0].thumbnails[0].url,
                        duration: x[0].durationRaw,
                        liveStream: x[0].live,
                        author: message.member.user.tag,
                        messageId: null,
                        embed: {
                            color: Colors.DarkButNotBlack,
                            author: { name: "Tocando agora:" },
                            title: `${x[0].title}`,
                            thumbnail: {
                                url: `${x[0].thumbnails[0].url}`,
                            },
                            fields: [
                                {
                                    name: "> __Duração:__",
                                    value:
                                        "```fix\n" +
                                        `${x[0].live ? "🔴 Live" : x[0].durationRaw}` +
                                        "\n```",
                                    inline: true,
                                },
                                {
                                    name: "> __Canal:__",
                                    value: "```fix\n" + `${voiceChannel.name}` + "\n```",
                                    inline: true,
                                },
                                {
                                    name: "> __Pedido por:___",
                                    value: "```fix\n" + `${message.member.user.tag}` + "\n```",
                                    inline: true,
                                },
                            ],
                        },
                    };

                    if (serverQueue) {
                        if (message.guild.members.me.voice.channel.id !== voiceChannel.id)
                            return message.reply({
                                embeds: [
                                    {
                                        color: Colors.DarkButNotBlack,
                                        description: "```\n❌ - Você precisa estar no mesmo canal que eu.\n```",
                                    },
                                ],
                                ephemeral: true
                            });
                        serverQueue.songs.push(song);
                        message
                            .reply({
                                embeds: [
                                    {
                                        color: Colors.DarkButNotBlack,
                                        title: "Adicionado à fila",
                                        description: `[${song.title}](${song.url}) adicionado à fila`,
                                        fields: [
                                            {
                                                name: "> __Duração:__",
                                                value: "```fix\n" + `${song.duration}` + "\n```",
                                                inline: true,
                                            },
                                            {
                                                name: "> __Pedido por:__",
                                                value:
                                                    "```fix\n" + `${message.member.user.tag}` + "\n```",
                                                inline: true,
                                            },
                                        ],
                                    },
                                ],
                            })
                            .catch(console.error);
                        return;
                    } else {
                        queueConstruct.songs.push(song);
                        message.reply({
                            embeds: [
                                {
                                    color: Colors.DarkButNotBlack,
                                    title: "Adicionado à fila",
                                    description: `[${song.title}](${song.url}) adicionado à fila`,
                                    fields: [
                                        {
                                            name: "> __Duração:__",
                                            value:
                                                "```fix\n" +
                                                `${song.duration === "0:00" ? "🔴 Live" : song.duration
                                                }` +
                                                "\n```",
                                            inline: true,
                                        },
                                        {
                                            name: "> __Pedido por:__",
                                            value:
                                                "```fix\n" + `${message.member.user.tag}` + "\n```",
                                            inline: true,
                                        },
                                    ],
                                },
                            ],
                        });
                        await message.client.queue.set(message.guild.id, queueConstruct);
                        try {
                            const connection = await joinVoiceChannel({
                                guildId: message.guild.id,
                                channelId: voiceChannel.id,
                                adapterCreator: message.guild.voiceAdapterCreator,
                            });
                            queueConstruct.connection = connection;
                            play(client, message, queueConstruct.songs[0]);
                        } catch (error) {
                            console.log(error);
                            connection.destroy();
                            client.queue.delete(message.guild.id);
                            return message.reply(
                                "**Ops :(**\n\nAlgo de errado não está certo... Tente novamente",
                                message.channel
                            );
                        }
                    }
                });
            } catch (err) {
                if (
                    err.message.includes(
                        "Cannot read properties of undefined (reading 'title')"
                    )
                ) {
                    console.log(`[VIDEO UNAVAILABLE] ${searchString}`);
                    await message.reply("**Este vídeo está indisponível.**");
                    return;
                }
                console.log(err);
                return;
            }
        }
    },
};
