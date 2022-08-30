/////////////////////// IMPORTS //////////////////////////
const { Colors, EmbedBuilder } = require('discord.js');
const ytdl = require('ytdl-core');
const sendError = require('../utils/error.js');
const music_init = require('./createPlayer.js');
const { joinVoiceChannel } = require('@discordjs/voice');

/////////////////////// SOURCE CODE ///////////////////////////
module.exports = {
  async handleVideo(client, video, message, channel, playlist = false) {
    try {
      const serverQueue = message.client.queue.get(message.guild.id);

      const song = {
        id: video.id,
        title: video.title
          ? video.title
          : await ytdl.getBasicInfo(video.shortUrl).videoDetails.media.song,
        url: video.shortUrl,
        thumbnail: video.thumbnails[0].url,
        duration: video.duration,
        isLive: video.isLive,
        author: message.member.user.tag,
        embed: {
          author: { name: 'Tocando agora:' },
          color: Colors.DarkButNotBlack,
          title: `${video.title}`,
          thumbnail: {
            url: `${video.thumbnails[0].url}`,
          },
          fields: [
            {
              name: '> __Duração:__',
              value: '```fix\n' + `${video.duration}` + '\n```',
              inline: true,
            },
            {
              name: '> __Canal:__',
              value: '```fix\n' + `${channel.name}` + '\n```',
              inline: true,
            },
            {
              name: '> __Pedido por:___',
              value: '```fix\n' + `${message.member.user.tag}` + '\n```',
              inline: true,
            },
          ],
        },
      };

      if (!serverQueue) {
        const queueConstruct = {
          textChannel: message.channel,
          voiceChannel: channel,
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

        message.client.queue.set(message.guild.id, queueConstruct);
        queueConstruct.songs.push(song);

        try {
          const connection = joinVoiceChannel({
            guildId: message.guild.id,
            channelId: channel.id,
            adapterCreator: message.guild.voiceAdapterCreator,
          });
          queueConstruct.connection = connection;
          music_init.play(client, message, queueConstruct.songs[0]);
        } catch (error) {
          console.error(`Eu não consegui entrar no canal: ${error}`);
          message.client.queue.delete(message.guild.id);
          return sendError(
            `Eu não consegui entrar no canal: ${error}`,
            message.channel
          );
        }
      } else {
        serverQueue.songs.push(song);
        if (playlist) return;
        let thing = new EmbedBuilder()
          .setTitle(`> __Música adicionada à fila__`)
          .setColor(Colors.DarkButNotBlack)
          .setThumbnail(song.img)
          .setDescription(`[${song.title}](${song.url}) adicionado à fila`)
          .addFields(
            {
              name: '> __**Duração:**__',
              value: '```fix\n' + `${song.duration}` + '\n```',
              inline: true,
            },
            {
              name: '> __**Pedido por:**__',
              value: '```fix\n' + `${message.author.tag}` + '\n```',
              inline: true,
            }
          );
        return serverQueue.textChannel.send({ embeds: [thing] });
      }
      return;
    } catch (e) {
      return console.log(e);
    }
  },
};
