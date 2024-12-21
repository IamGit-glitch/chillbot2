const { SlashCommandBuilder } = require("discord.js");
const fs = require("fs");

// Function to read the user data from the JSON file
function readUserData() {
    try {
        const data = fs.readFileSync("./data/data.json");
        return JSON.parse(data);
    } catch (error) {
        console.error("Error reading user data:", error);
        return { users: [] };
    }
}

module.exports = {
    category: "games",
    data: new SlashCommandBuilder()
        .setName("credits")
        .setDescription("Check your current credits."),
    async execute(interaction) {
        // Check if the command is being used in a specific channel
        if (interaction.channelId !== "878901585709789204") {
            return interaction.reply({
                content: "This command is not allowed in this channel.",
                ephemeral: true,
            });
        }
        // Get the user ID
        const userId = interaction.user.id;
        let userData = readUserData();

        // Find the user in the data
        const user = userData.users.find((user) => user.id === userId);

        if (!user) {
            return interaction.reply({
                content:
                    "You have not started playing yet. Use the /start command to begin!",
                ephemeral: true,
            });
        }

        // Respond with the user's credits
        return interaction.reply({
            content: `Your current credits: ${user.credits}`,
            ephemeral: false,
        });
    },
};
