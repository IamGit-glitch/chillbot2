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

module.exports = {
    data: new SlashCommandBuilder()
        .setName('results')
        .setDescription('Displays the results of the last "Would You Rather" question')
        .addIntegerOption(option =>
            option.setName('id')
                .setDescription('The ID of the question to show results for')
                .setRequired(true)), // This defines the required ID argument
    async execute(interaction) {
        const questionId = interaction.options.getInteger('id'); // Retrieve the ID argument

        // Ensure questions are loaded before accessing them
        readQuestions();

        const question = questions.find(q => q.id === questionId);

        if (!question) {
            return interaction.reply({
                content: `Question with ID ${questionId} not found.`,
                ephemeral: true,
            });
        }

        const totalVotes = question.votes_for_A + question.votes_for_B;
        const percentageA = totalVotes ? ((question.votes_for_A / totalVotes) * 100).toFixed(2) : 0;
        const percentageB = totalVotes ? ((question.votes_for_B / totalVotes) * 100).toFixed(2) : 0;

        const resultsMessage = {
            color: 0xADD8E6, // Embed color (Light Blue)
            title: `[${question.id}] Results`,
            description: `**🅰️ ${question.A}**\nVotes: ${question.votes_for_A} (${percentageA}%)\n\n**🅱️ ${question.B}**\nVotes: ${question.votes_for_B} (${percentageB}%)`,
        };

        return interaction.reply({ embeds: [resultsMessage], ephemeral: false });
    },
};
