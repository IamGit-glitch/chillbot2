const { SlashCommandBuilder } = require('discord.js');
const fs = require('fs');

let questions = [];

// Function to read questions from a JSON file
function readQuestions() {
    try {
        const data = fs.readFileSync('./data/questions.json', 'utf8');
        questions = JSON.parse(data);
    } catch (error) {
        questions = [];
    }
}

// Function to save questions to the JSON file
function saveQuestions() {
    try {
        const data = JSON.stringify(questions, null, 4);
        fs.writeFileSync('./data/questions.json', data, 'utf8');
    } catch (error) {
        // Handle error
    }
}

// Function to select a random question
function getRandomQuestion() {
    if (questions.length === 0) {
        return null;
    }

    const randomIndex = Math.floor(Math.random() * questions.length);
    return questions[randomIndex];
}

module.exports = {
    category: 'games',
    data: new SlashCommandBuilder()
        .setName('wyr')
        .setDescription('Would you rather...'),
    async execute(interaction) {
        // Ensure questions are loaded before selecting a random question
        readQuestions();

        // Get a random question
        const question = getRandomQuestion();

        if (!question) {
            return interaction.reply({
                content: 'No questions available.',
                ephemeral: true,
            });
        }

        // Construct the embed message with the question ID, options A and B
        const embedMessage = {
            color: 0xffc0cb, // Embed color (Light Pink)
            title: `[${question.id}] Would You Rather...`,
            description: `**🅰️ ${question.A}**\n\n**or**\n\n**🅱️ ${question.B}**`,
        };

        // Send the embed message and add reactions
        try {
            const sentMessage = await interaction.reply({
                embeds: [embedMessage],
                fetchReply: true,
            });

            // Add reactions to the sent message
            await sentMessage.react('🅰️');
            await sentMessage.react('🅱️');

            // Create a reaction collector
            const filter = (reaction, user) => {
                return ['🅰️', '🅱️'].includes(reaction.emoji.name) && !user.bot;
            };

            const collector = sentMessage.createReactionCollector({ filter, time: 60000 }); // Collect reactions for 60 seconds

            collector.on('collect', (reaction, user) => {
                if (reaction.emoji.name === '🅰️') {
                    question.votes_for_A += 1;
                } else if (reaction.emoji.name === '🅱️') {
                    question.votes_for_B += 1;
                }
                saveQuestions(); // Save the updated questions to the JSON file
            });

        } catch (error) {
            // Handle error
        }
    },
};
