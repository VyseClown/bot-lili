module.exports = async function (client, oldState, newState) {
    if (
        newState.channelId &&
        newState.channel.type === "GUILD_STAGE_VOICE" &&
        newState.guild.me.voice.suppress
    ) {
        try {
            await newState.guild.me.voice.setSuppressed(false);
        } catch (e) {
            return console.log(e);
        }
    }
    // if (!newState.guild.members.me.voice.channelId) {
    //     client.queue.delete(newState.guild.id);
    // }
};
