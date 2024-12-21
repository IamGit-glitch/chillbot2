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

// Function to update and save the user data to the JSON file
function updateUserData(userData) {
    try {
        const jsonData = JSON.stringify(userData, null, 2);
        fs.writeFileSync("./data/data.json", jsonData);
        console.log("User data updated successfully.");
    } catch (error) {
        console.error("Error updating user data:", error);
    }
}

module.exports = {
    category: "games",
    data: new SlashCommandBuilder()
        .setName("start")
        .setDescription("Register and start playing slots!"),
    cooldown: "1m", // Cooldown set to 1 minute
    async execute(interaction) {
        // Check if the command is being used in a specific channel
        if (interaction.channelId !== "878901585709789204") {
            return interaction.reply({
                content: "This command is not allowed in this channel.",
                ephemeral: true,
            });
        }

        const userId = interaction.user.id;
        let userData = readUserData();
        // Check if the user already exists in the data
        const existingUserIndex = userData.users.findIndex(
            (user) => user.id === userId,
        );
        if (existingUserIndex !== -1) {
            const existingUser = userData.users[existingUserIndex];
            if (existingUser.credits > 0) {
                return interaction.reply({
                    content:
                        "You still have credits! You cannot register again.",
                    ephemeral: true,
                });
            } else {
                // If existing user with 0 credits tries to use the command again
                userData.users[existingUserIndex].credits = 1000; // Reset credits to starter value
                updateUserData(userData);
                return interaction.reply({
                    content: "You've been given your starter credits again!",
                    ephemeral: true,
                });
            }
        } else {
            // Add the user to the data
            userData.users.push({
                id: userId,
                credits: 1000, // Initial credits
                gamesPlayed: 0, // Initial games played
            });
            updateUserData(userData);
            return interaction.reply({
                content:
                    "You have been registered! You received 1000 credits to start.",
                ephemeral: true,
            });
        }
    },
};
