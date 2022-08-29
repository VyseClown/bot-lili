const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');
const sendError = require("../utils/error.js");

module.exports = {
    name: "ban",
    description: "Para banir um usuário",
    options: [
        {
            name: "usuário",
            type: ApplicationCommandOptionType.User,
            description: "Usuário a ser banido",
            required: true,
        },
        {
            name: "motivo",
            type: ApplicationCommandOptionType.String,
            description: "Motivo do banimento",
            required: false,
        },
    ],
    category: "staff",
    timeout: 3000,
    aliases: ["banir"],

    async execute(client, message, args) {
        if (message.member.roles.cache.has("Administrator")) return message.reply({ content: "```\n❌ Sem permissões.\n```", ephemeral: true })
        var query1;
        var query2;
        try {
            if (args) {
                query1 = args.get("usuário")
                    ? args.get("usuário").value
                    : null || args.join(" ");
                query2 = args.get("motivo")
                    ? args.get("motivo").value
                    : null || args.join(" ");
            }
        } catch (e) {
            if (
                e.message.includes("Cannot read properties of null (reading 'value')")
            ) {
                query1 = null;
                query2 = null;
            }
        }
        const user = message.guild.members.cache.get(query1);
        if (user.bannable) {
            message.reply({ content: "```\n⛔ Usuário banido do servidor!\n```", ephemeral: true });
            return user.ban({ reason: `${query2 ? query2 : "Sem motivo especificado"}` });
        } else {
            return message.reply({ content: "```\n❌ Esse membro não pode ser banido\n```", ephemeral: true })
        }
    }
}