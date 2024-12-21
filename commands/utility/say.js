const { SlashCommandBuilder } = require("discord.js");

module.exports = {
	category: "utility",
	data: new SlashCommandBuilder()
		.setName("say")
		.setDescription("Make the bot say something.")
		.addStringOption((option) =>
			option
				.setName("message")
				.setDescription("The message for the bot to say.")
				.setRequired(true),
		),
	async execute(interaction) {
		// Check if the user is you
		if (interaction.user.id !== "269163491049340928") {
			return interaction.reply({
				content: "You are not authorized to use this command.",
				ephemeral: true,
			});
		}

		const message = interaction.options.getString("message", true);

		// Respond to the user (ephemeral response)
		await interaction.reply({
			content: `You said: ${message}`,
			ephemeral: true,
		});

		// Make the bot say the message in the channel
		await interaction.channel.send(message);
	},
};
