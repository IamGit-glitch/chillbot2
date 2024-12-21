const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Ban all the baddies!')
        .addUserOption(option =>
            option.setName('target1')
                .setDescription('Insert baddie name here')
                .setRequired(true))
        .addUserOption(option =>
            option.setName('target2')
                .setDescription('One more please'))
        .addUserOption(option =>
            option.setName('target3')
                .setDescription('One more please'))
        .addUserOption(option =>
            option.setName('target4')
                .setDescription('One more please'))
        .addUserOption(option =>
            option.setName('target5')
                .setDescription('One more please')),

    async execute(interaction) {
        // Check if the interaction is in a guild
        if (!interaction.inGuild()) {
            return interaction.reply({ content: "This command can only be used in a server.", ephemeral: true });
        }

        // Check for Moderator role
        if (!interaction.member.roles.cache.has('878949527724371978')) {
            return interaction.reply({ content: "You are not allowed to use this :)", ephemeral: true });
        }

        // Collect mentioned users
        const targets = Array.from({ length: 5 }, (_, i) => interaction.options.getUser(`target${i + 1}`)).filter(Boolean);
        const bannedUsers = [];

        for (const user of targets) {
            try {
                const memberToBan = await interaction.guild.members.fetch(user.id);
                await memberToBan.ban({ reason: 'You been a meanie.' });
                bannedUsers.push(`<@${user.id}>`); // Use user ID for mention format
            } catch (error) {
                console.error(`Failed to ban user ${user.tag}:`, error);
                return interaction.reply({ content: `Failed to ban user ${user.tag}: ${error.message}`, ephemeral: true });
            }
        }

        // Respond with the banned users
        return interaction.reply({
            content: bannedUsers.length > 0 ? `Successfully banned: ${bannedUsers.join(', ')}` : "No users were banned.",
            ephemeral: false,
        });
    },
};
