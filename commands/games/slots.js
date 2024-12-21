const { SlashCommandBuilder } = require("discord.js");
const { stripIndents } = require("common-tags");
const fs = require("fs");

// Define the available slot symbols with their respective win multipliers
const slots = [
    { symbol: "🥄", multiplier: 1 },
    { symbol: "🪨", multiplier: 3 },
    { symbol: "❄️", multiplier: 5 },
    { symbol: "🧠", multiplier: 7 },
    { symbol: "🌖", multiplier: 9 },
    { symbol: "⭐", multiplier: 11 },
    { symbol: "♾️", multiplier: 13 }
];
// Define the rare symbol and its multiplier
const rareSymbol = "💎";
const rareSymbolMultiplier = 10; // Multiplier for the reward when rare symbol appears

// Function to read user data from JSON file
function readUserData() {
    try {
        const data = fs.readFileSync("./data/data.json");
        return JSON.parse(data);
    } catch (error) {
        // console.error('Error reading user data:', error);
        return { users: [] };
    }
}

// Function to update and save user data to JSON file
function updateUserData(userData) {
    try {
        const jsonData = JSON.stringify(userData, null, 2);
        fs.writeFileSync("./data/data.json", jsonData);
        // console.log('User data updated successfully.');
    } catch (error) {
        // console.error('Error updating user data:', error);
    }
}

function checkWins(slotsMatrix) {
    const wins = [];

    // Check horizontal wins
    slotsMatrix.forEach((row, index) => {
        let consecutiveSlots = 1;
        let previousSymbol = row[0];

        for (let i = 1; i < 3; i++) {
            if (row[i] === previousSymbol) {
                consecutiveSlots++;
                if (consecutiveSlots === 3) {
                    wins.push("Horizontal win");
                }
            } else {
                consecutiveSlots = 1;
                previousSymbol = row[i];
            }
        }
    });

    // Check vertical wins
    for (let i = 0; i < 3; i++) {
        let consecutiveSlots = 1;
        let previousSymbol = slotsMatrix[0][i];

        for (let j = 1; j < 3; j++) {
            if (slotsMatrix[j][i] === previousSymbol) {
                consecutiveSlots++;
                if (consecutiveSlots === 3) {
                    wins.push("Vertical win");
                }
            } else {
                consecutiveSlots = 1;
                previousSymbol = slotsMatrix[j][i];
            }
        }
    }

    // Check diagonal wins
    const diagonal1 = [slotsMatrix[0][0], slotsMatrix[1][1], slotsMatrix[2][2]];
    const diagonal2 = [slotsMatrix[0][2], slotsMatrix[1][1], slotsMatrix[2][0]];

    const allEqual = (arr) => arr.every((val) => val === arr[0]);

    if (allEqual(diagonal1) && diagonal1[0] !== undefined) {
        wins.push("Diagonal win (top-left to bottom-right)");
    }
    if (allEqual(diagonal2) && diagonal2[0] !== undefined) {
        wins.push("Diagonal win (top-right to bottom-left)");
    }

    console.log("Wins:", wins); // Add this line for debugging

    return wins;
}

// Function to wrap slot symbols
function wrapSlots(slot) {
    if (slot === undefined) return slots[0].symbol;
    return slot;
}

// Export the execute function
module.exports = {
    checkWins,
    category: "games",
    data: new SlashCommandBuilder()
        .setName("slots")
        .setDescription("Play a game of slots.")
        .addIntegerOption((option) =>
            option
                .setName("credits")
                .setDescription("Amount of credits to use for the game.")
                .setRequired(true),
        ),
    async execute(interaction) {
        // Check if the command is being used in a specific channel
        if (interaction.channelId !== "878901585709789204") {
            return interaction.reply({
                content: "This command is not allowed in this channel.",
                ephemeral: true,
            });
        }

        // Get credits to use from user input
        const creditsToUse = interaction.options.getInteger("credits");
        // Get user ID
        const userId = interaction.user.id;
        // Read user data from JSON file
        let userData = readUserData();
        // Find user index in data
        const userIndex = userData.users.findIndex(
            (user) => user.id === userId,
        );

        // If user not found, send message and return
        if (userIndex === -1) {
            return interaction.reply({
                content:
                    "You have not started playing yet. Use the /start command to begin!",
                ephemeral: true,
            });
        }

        // Get user object
        const user = userData.users[userIndex];

        // Update highest credits if current credits exceed it
        user.highestCredits = Math.max(user.highestCredits, user.credits);

        // Check if user has enough credits to play
        if (user.credits < creditsToUse) {
            return interaction.reply({
                content: "You do not have enough credits to play.",
                ephemeral: false,
            });
        }

        // Deduct credits from user
        user.credits -= creditsToUse;
        // Increment games played counter
        user.gamesPlayed++;
        // Update highest bet
        user.highestBet = Math.max(user.highestBet, creditsToUse);

        // Generate random slots matrix
        const slotsMatrix = [
            [
                slots[Math.floor(Math.random() * slots.length)].symbol,
                slots[Math.floor(Math.random() * slots.length)].symbol,
                slots[Math.floor(Math.random() * slots.length)].symbol,
            ],
            [
                slots[Math.floor(Math.random() * slots.length)].symbol,
                slots[Math.floor(Math.random() * slots.length)].symbol,
                slots[Math.floor(Math.random() * slots.length)].symbol,
            ],
            [
                slots[Math.floor(Math.random() * slots.length)].symbol,
                slots[Math.floor(Math.random() * slots.length)].symbol,
                slots[Math.floor(Math.random() * slots.length)].symbol,
            ],
        ];

        let totalWins = 0;
        let reward = 0;
        // Check for wins
        const wins = checkWins(slotsMatrix); // Pass slotsMatrix here
        totalWins = wins.length;

        // Check if the rare symbol appears
        if (Math.random() < 0.001) {
            // Adjust probability as needed
            if (slotsMatrix.length > 0) {
                // Replace a random tile with the rare symbol
                const randomRowIndex = Math.floor(
                    Math.random() * slotsMatrix.length,
                );
                const randomColIndex = Math.floor(
                    Math.random() * slotsMatrix[0].length,
                );
                slotsMatrix[randomRowIndex][randomColIndex] = rareSymbol;

                // Modify reward calculation
                reward = creditsToUse * rareSymbolMultiplier; // Adjust reward by specified multiplier
                totalWins += rareSymbolMultiplier; // Increment total wins by the rare symbol multiplier
            }
        }

        // Calculate reward based on total wins and symbols
        if (totalWins > 0) {
            reward = calculateReward(slotsMatrix, creditsToUse);
        }

        // Update highest win
        user.highestWin = Math.max(user.highestWin, reward);
        // Update average win per game
        user.averageWin =
            (user.averageWin * (user.gamesPlayed - 1) + reward) /
            user.gamesPlayed;

        // Add reward to user's credits
        user.credits += reward;

        // Build result message
        let resultMessage = stripIndents`
        **[ 🎰 | SLOTS ]**
        --------------
        ${slotsMatrix.map((row) => row.map((slot) => wrapSlots(slot)).join(" : ")).join("\n")}
        --------------
        | : : : **${totalWins > 0 ? "WIN!" : "LOST"}** : : : |
        `;

        const lossMessages = [
            "Better luck next time! <3",
            "Oh no! Don't worry, there's always another chance!",
            "It's okay, keep trying! You'll get it!",
            "Aww, you didn't win this time. But keep playing!",
            "No worries! You'll win next time!",
            "Oops! Try again for better luck!",
            "Oh, tough luck! But don't give up!",
        ];

        const winMessages = [
            "Congratulations! You won!",
            "Wow, you're on fire! Another win!",
            "Amazing! You're a slots master!",
            "Incredible luck! Another jackpot!",
            "You did it again! Another win for you!",
            "Unbelievable! You're unstoppable!",
            "Fantastic! Keep those wins coming!",
        ];

        if (totalWins > 0) {
            // Add win message if there are wins
            // Randomly select a win message
            const randomWinMessage =
                winMessages[Math.floor(Math.random() * winMessages.length)];
            resultMessage += `\n${randomWinMessage} You won ${reward} credits (${totalWins} ${totalWins > 1 ? "wins" : "win"}).`;
        } else {
            // Add loss message if no wins
            // Randomly select a loss message
            const randomLossMessage =
                lossMessages[Math.floor(Math.random() * lossMessages.length)];
            resultMessage += `\n${randomLossMessage}`;
        }

        // Update user data with new credits and games played
        userData.users[userIndex] = user;
        updateUserData(userData);

        // Respond with the game result
        return interaction.reply({ content: resultMessage, ephemeral: false });
    },
};

function calculateReward(slotsMatrix, creditsToUse) {
    let reward = 1; // Initialize reward as 1 since we will be multiplying

    // Initialize win multipliers and spoons count
    const winMultipliers = {};
    let spoonsCount = 0;

    // Check for wins in horizontal lines
    slotsMatrix.forEach(row => {
        if (row[0] === row[1] && row[1] === row[2]) {
            if (row[0] === '🥄') {
                spoonsCount++;
            } else {
                if (row[0] in winMultipliers) {
                    winMultipliers[row[0]]++;
                } else {
                    winMultipliers[row[0]] = 1;
                }
            }
        }
    });

    // Check for wins in vertical lines
    for (let i = 0; i < 3; i++) {
        if (slotsMatrix[0][i] === slotsMatrix[1][i] && slotsMatrix[1][i] === slotsMatrix[2][i]) {
            if (slotsMatrix[0][i] === '🥄') {
                spoonsCount++;
            } else {
                if (slotsMatrix[0][i] in winMultipliers) {
                    winMultipliers[slotsMatrix[0][i]]++;
                } else {
                    winMultipliers[slotsMatrix[0][i]] = 1;
                }
            }
        }
    }

    // Check for wins in diagonal lines
    if (slotsMatrix[0][0] === slotsMatrix[1][1] && slotsMatrix[1][1] === slotsMatrix[2][2]) {
        if (slotsMatrix[0][0] === '🥄') {
            spoonsCount++;
        } else {
            if (slotsMatrix[0][0] in winMultipliers) {
                winMultipliers[slotsMatrix[0][0]]++;
            } else {
                winMultipliers[slotsMatrix[0][0]] = 1;
            }
        }
    }
    if (slotsMatrix[0][2] === slotsMatrix[1][1] && slotsMatrix[1][1] === slotsMatrix[2][0]) {
        if (slotsMatrix[0][2] === '🥄') {
            spoonsCount++;
        } else {
            if (slotsMatrix[0][2] in winMultipliers) {
                winMultipliers[slotsMatrix[0][2]]++;
            } else {
                winMultipliers[slotsMatrix[0][2]] = 1;
            }
        }
    }

    // Calculate reward based on the accumulated multipliers and spoons count
    Object.entries(winMultipliers).forEach(([symbol, count]) => {
        const symbolData = slots.find(item => item.symbol === symbol);
        if (!symbolData) {
            console.log("Symbol not found:", symbol);
        } else {
            reward *= Math.pow(symbolData.multiplier, count);
        }
    });

    // Add spoons to the reward separately
    reward += spoonsCount * slots.find(item => item.symbol === '🥄').multiplier;

    // Apply rare symbol multiplier if the rare symbol appeared
    if (slotsMatrix.flat().includes(rareSymbol)) {
        reward *= rareSymbolMultiplier;
    }

    // Apply creditsToUse multiplier
    reward *= creditsToUse;

    return reward;
}
