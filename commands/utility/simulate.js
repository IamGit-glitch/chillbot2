const { SlashCommandBuilder } = require("discord.js");

// Import the checkWins function from your slots command
const { checkWins } = require("../games/slots.js");

// Define the available slot symbols
const slots = ["❄️", "🧠", "🪨", "🥄", "🌖", "⭐", "♾️"];

function simulateGame() {
    // Generate a random slots matrix
    const slotsMatrix = [
        [
            slots[Math.floor(Math.random() * slots.length)],
            slots[Math.floor(Math.random() * slots.length)],
            slots[Math.floor(Math.random() * slots.length)],
        ],
        [
            slots[Math.floor(Math.random() * slots.length)],
            slots[Math.floor(Math.random() * slots.length)],
            slots[Math.floor(Math.random() * slots.length)],
        ],
        [
            slots[Math.floor(Math.random() * slots.length)],
            slots[Math.floor(Math.random() * slots.length)],
            slots[Math.floor(Math.random() * slots.length)],
        ],
    ];

    // Check for wins
    const wins = checkWins(slotsMatrix);

    // Return whether the game was a win or a loss
    return wins.length > 0;
}

function simulateGames(numGames) {
    let wins = 0;
    let losses = 0;

    // Simulate multiple games
    for (let i = 0; i < numGames; i++) {
        if (simulateGame()) {
            wins++;
        } else {
            losses++;
        }
    }

    return { wins, losses };
}

function calculateWinLossPercentage(numGames) {
    const { wins, losses } = simulateGames(numGames);
    const totalGames = wins + losses;
    const winPercentage = (wins / totalGames) * 100;
    const lossPercentage = (losses / totalGames) * 100;

    return { winPercentage, lossPercentage };
}

module.exports = {
    catergory: "games",
    data: new SlashCommandBuilder()
        .setName("simulategames")
        .setDescription(
            "Simulates a specified number of slot games and returns the win/loss percentages.",
        )
        .addIntegerOption((option) =>
            option
                .setName("numgames")
                .setDescription("Number of games to simulate.")
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

        // Get the number of games to simulate from user input
        const numGames = interaction.options.getInteger("numgames");

        // Calculate the win/loss percentages
        const { winPercentage, lossPercentage } =
            calculateWinLossPercentage(numGames);

        // Respond with the win/loss percentages
        return interaction.reply({
            content: `Out of ${numGames} simulated games:\nWin Percentage: ${winPercentage.toFixed(2)}%\nLoss Percentage: ${lossPercentage.toFixed(2)}%`,
            ephemeral: true,
        });
    },
};
