const {
  createAudioPlayer,
  createAudioResource,
  entersState,
  VoiceConnectionStatus,
  AudioPlayerStatus,
} = require("@discordjs/voice");
const { EmbedBuilder, Colors } = require("discord.js");
const ytdl2 = require("play-dl");
const sendError = require("../utils/error.js");

/////////////////////// SOURCE CODE ///////////////////////////
module.exports.play = async (client, message, song) => {
  const serverQueue = message.client.queue.get(message.guild.id);
  if (!song) {
    await message.client.queue.delete(message.guild.id);
    if (serverQueue) {
      return serverQueue.connection.disconnect();
    }
  }
  try {
    ytdl2.authorization();
    var stream = await ytdl2.stream(song.url);
  } catch (error) {
    if (serverQueue) {
      if (serverQueue.loop) {
        let lastSong = serverQueue.songs.shift();
        serverQueue.songs.push(lastSong);
        module.exports.play(client, message, serverQueue.songs[0]);
      } else {
        serverQueue.songs.shift();
        module.exports.play(client, message, serverQueue.songs[0]);
      }
    }
  }

  try {
    serverQueue.audioPlayer = createAudioPlayer();
    serverQueue.resource = createAudioResource(stream.stream, {
      inlineVolume: true,
      inputType: stream.type,
    });
    serverQueue.audioPlayer.play(serverQueue.resource);
    await entersState(
      serverQueue.connection,
      VoiceConnectionStatus.Ready,
      30_000
    );
    serverQueue.connection.subscribe(serverQueue.audioPlayer);
  } catch (error) {
    if (serverQueue) {
      if (
        error.message.includes(
          "Cannot read properties of undefined (reading 'stream')"
        )
      ) {
        sendError(
          "Ocorreu um erro ao tentar reproduzir esta música...",
          serverQueue.textChannel
        );
        await serverQueue.songs.shift();
        return module.exports.play(client, message, serverQueue.songs[0]);
      }
      console.log(error);
      return sendError(
        "Ocorreu um erro na reprodução, tente novamente...",
        serverQueue.textChannel
      );
    }
    console.log(error);
    return sendError(
      "Alguma coisa desastrosa aconteceu, tente novamente...",
      message.channel
    );
  }
  try {
    var embedMusic = new EmbedBuilder()
      .setAuthor({ name: "Tocando agora:" })
      .setColor(Colors.DarkButNotBlack)
      .setTitle(serverQueue.songs[0].title)
      .setThumbnail(serverQueue.songs[0].thumbnail);

    if (
      serverQueue.songs[0].duration === "0:00" ||
      serverQueue.songs[0].liveStream
    ) {
      embedMusic.addFields([
        { name: "> __**Duração:**__", value: "```fix\n🔴 Live\n```", inline: true }
      ])
    } else {
      embedMusic.addFields([
        { name: "> __**Duração:**__", value: "```fix\n" + `${serverQueue.songs[0].duration}` + "\n```", inline: true }
      ])
    }
    embedMusic.addFields([
      { name: "> __**Canal:**__", value: "```fix\n" + `${message.guild.members.me.voice.channel.name ? message.guild.members.me.voice.channel.name : "Not provided"}` + "\n```", inline: true },
      { name: "> __**Pedido por:**__", value: "```fix\n" + `${serverQueue.songs[0].author}` + "\n```", inline: true },
    ])

    var playingMessage = await serverQueue.textChannel.send({
      embeds: [song.embed],
    });
    serverQueue.songs[0].messageId = playingMessage.id
    serverQueue.audioPlayer.on("stateChange", async (oldState, newState) => {
      if (
        newState.status === AudioPlayerStatus.Idle &&
        oldState.status !== AudioPlayerStatus.Idle
      ) {
        await playingMessage.edit({ embeds: [song.embed], components: [] });
        if (serverQueue.looping) {
          let lastSong = serverQueue.songs.shift();
          serverQueue.songs.push(lastSong);
          return module.exports.play(client, message, serverQueue.songs[0]);
        }
        if (serverQueue.nigthCore) {
          if (!serverQueue.songLooping) {
            var random = Math.floor(Math.random() * serverQueue.songs.length);
            await this.play(client, message, serverQueue.songs[random]);
            await serverQueue.songs.splice(random, 1);
            return;
          }
        }
        if (!serverQueue.songLooping) await serverQueue.songs.shift();
        return module.exports.play(client, message, serverQueue.songs[0]);
      }
    });
  } catch (error) {
    console.log(error);
  }
};
