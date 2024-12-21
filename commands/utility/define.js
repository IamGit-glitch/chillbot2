const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js");
const sqlite3 = require("sqlite3").verbose();

// Initialize the database
const db = new sqlite3.Database("./data/definitions.db", (err) => {
    if (err) {
        console.error("Error opening database:", err);
    } else {
        // Ensure the user_name column exists
        db.run(`ALTER TABLE definitions ADD COLUMN user_name TEXT`, (err) => {
            if (err && err.code !== 'SQLITE_ERROR') {
                console.error("Error adding user_name column:", err);
            }
        });
    }
});

db.serialize(() => {
    // Create the table if it doesn't exist
    db.run(`CREATE TABLE IF NOT EXISTS definitions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        word TEXT NOT NULL,
        definition TEXT NOT NULL,
        user_id TEXT NOT NULL,
        user_name TEXT,
        timestamp TEXT NOT NULL
    )`, (err) => {
        if (err) {
            console.error('Error creating table:', err);
        }
    });
});

const ITEMS_PER_PAGE = 10;

// Function to get paginated definitions
function getDefinitions(offset, limit, callback) {
    db.all(`SELECT * FROM definitions ORDER BY word ASC LIMIT ? OFFSET ?`, [limit, offset], (err, rows) => {
        if (err) {
            console.error("Error fetching definitions:", err);
            callback(err);
        } else {
            callback(null, rows);
        }
    });
}

// Function to get paginated definitions based on search term
function searchDefinitions(term, offset, limit, callback) {
    const searchTerm = `%${term}%`; // For partial matching
    db.all(`SELECT * FROM definitions WHERE word LIKE ? ORDER BY word ASC LIMIT ? OFFSET ?`, [searchTerm, limit, offset], (err, rows) => {
        if (err) {
            console.error("Error searching definitions:", err);
            callback(err);
        } else {
            callback(null, rows);
        }
    });
}

// Function to get total number of definitions
function getDefinitionsCount(callback) {
    db.get(`SELECT COUNT(*) as count FROM definitions`, (err, row) => {
        if (err) {
            console.error("Error fetching definitions count:", err);
            callback(err);
        } else {
            callback(null, row.count);
        }
    });
}

// Function to get total number of definitions based on search term
function searchDefinitionsCount(term, callback) {
    const searchTerm = `%${term}%`;
    db.get(`SELECT COUNT(*) as count FROM definitions WHERE word LIKE ?`, [searchTerm], (err, row) => {
        if (err) {
            console.error("Error fetching search definitions count:", err);
            callback(err);
        } else {
            callback(null, row.count);
        }
    });
}

// Function to add a new definition
function addDefinition(word, definition, userId, userName, callback) {
    const timestamp = new Date().toISOString();
    db.run(`INSERT INTO definitions (word, definition, user_id, user_name, timestamp) VALUES (?, ?, ?, ?, ?)`,
        [word, definition, userId, userName, timestamp],
        function (err) {
            if (err) {
                console.error("Error adding definition:", err);
                callback(err);
            } else {
                callback(null, this.lastID);
            }
        }
    );
}

// Function to edit a definition
function editDefinition(id, definition, userId, callback) {
    db.run(`UPDATE definitions SET definition = ? WHERE id = ? AND user_id = ?`,
        [definition, id, userId],
        function (err) {
            if (err) {
                console.error("Error editing definition:", err);
                callback(err);
            } else if (this.changes === 0) {
                callback(new Error("No matching definition found or you do not have permission to edit this entry."));
            } else {
                callback(null);
            }
        }
    );
}

// Function to delete a definition
function deleteDefinition(id, userId, isModerator, callback) {
    let query = `DELETE FROM definitions WHERE id = ? AND user_id = ?`;
    let params = [id, userId];

    if (isModerator) {
        query = `DELETE FROM definitions WHERE id = ?`;
        params = [id];
    }

    db.run(query, params, function (err) {
        if (err) {
            console.error("Error deleting definition:", err);
            callback(err);
        } else if (this.changes === 0) {
            callback(new Error("No matching definition found or you do not have permission to delete this entry."));
        } else {
            callback(null);
        }
    });
}

// Helper function to truncate a string if it exceeds 4096 characters
function truncateDescription(description) {
    const MAX_LENGTH = 4096;
    if (description.length > MAX_LENGTH) {
        return description.slice(0, MAX_LENGTH - 3) + '...'; // Truncate with ellipsis
    }
    return description;
}

// Function to create an embed
function createEmbed(definitions, page, totalPages, title) {
    let description = definitions.map(def => 
        `- ${def.id.toString().padStart(4, '0')} - ` +
        `**${def.word}:**\n` +
        `${def.definition}\n` +
        `**by** *${def.user_name || 'Unknown'},* ` +
        `*${new Date(def.timestamp).toLocaleDateString()}*\n`
    ).join("\n");

    description = truncateDescription(description); // Ensure description does not exceed limit

    return {
        color: 0x0099ff,
        title: title || `Dictionary Entries (Page ${page + 1}/${totalPages})`,
        description: description || "No entries found.",
        timestamp: new Date(),
    };
}

module.exports = {
    category: "utility",
    data: new SlashCommandBuilder()
        .setName("define")
        .setDescription("Add, edit, delete, view, or search definitions.")
        .addSubcommand(subcommand =>
            subcommand
                .setName("add")
                .setDescription("Add a new definition")
                .addStringOption(option =>
                    option.setName("word")
                        .setDescription("The word or term to define")
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName("definition")
                        .setDescription("The definition of the word or term")
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName("edit")
                .setDescription("Edit an existing definition")
                .addIntegerOption(option =>
                    option.setName("id")
                        .setDescription("The ID of the definition to edit")
                        .setRequired(true))
                .addStringOption(option =>
                    option.setName("definition")
                        .setDescription("The new definition")
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName("delete")
                .setDescription("Delete a definition")
                .addIntegerOption(option =>
                    option.setName("id")
                        .setDescription("The ID of the definition to delete")
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName("view")
                .setDescription("View all definitions with pagination"))
        .addSubcommand(subcommand =>
            subcommand
                .setName("search")
                .setDescription("Search for definitions by term")
                .addStringOption(option =>
                    option.setName("term")
                        .setDescription("The term to search for")
                        .setRequired(true))),
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();
        const userId = interaction.user.id;
        const userName = interaction.user.username;
        const isModerator = interaction.member.roles.cache.some(role => role.name === 'Moderator');

        if (subcommand === "add") {
            const word = interaction.options.getString("word");
            const definition = interaction.options.getString("definition");
            addDefinition(word, definition, userId, userName, (err, id) => {
                if (err) {
                    return interaction.reply({ content: "Error adding definition.", ephemeral: true });
                }
                return interaction.reply({ content: `Definition added with ID: ${id}`, ephemeral: false });
            });
        } else if (subcommand === "edit") {
            const id = interaction.options.getInteger("id");
            const definition = interaction.options.getString("definition");
            editDefinition(id, definition, userId, (err) => {
                if (err) {
                    return interaction.reply({ content: err.message, ephemeral: true });
                }
                return interaction.reply({ content: `Definition with ID: ${id} edited successfully.`, ephemeral: false });
            });
        } else if (subcommand === "delete") {
            const id = interaction.options.getInteger("id");
            deleteDefinition(id, userId, isModerator, (err) => {
                if (err) {
                    return interaction.reply({ content: err.message, ephemeral: true });
                }
                return interaction.reply({ content: `Definition with ID: ${id} deleted successfully.`, ephemeral: false });
            });
        } else if (subcommand === "view") {
            const offset = 0;

            const updatePage = async (interaction, page, totalPages) => {
                const offset = page * ITEMS_PER_PAGE;
                getDefinitions(offset, ITEMS_PER_PAGE, async (err, definitions) => {
                    if (err) {
                        return interaction.reply({ content: "Error fetching definitions.", ephemeral: true });
                    }
                    const embed = createEmbed(definitions, page, totalPages);
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId("prev")
                                .setLabel("Previous")
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(page === 0),
                            new ButtonBuilder()
                                .setCustomId("next")
                                .setLabel("Next")
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(page >= totalPages - 1)
                        );

                    await interaction.update({ embeds: [embed], components: [row] });
                });
            };

            getDefinitionsCount((err, count) => {
                if (err) {
                    return interaction.reply({ content: "Error fetching definitions count.", ephemeral: true });
                }

                const totalPages = Math.ceil(count / ITEMS_PER_PAGE);
                getDefinitions(offset, ITEMS_PER_PAGE, async (err, definitions) => {
                    if (err) {
                        return interaction.reply({ content: "Error fetching definitions.", ephemeral: true });
                    }

                    const page = 0;
                    const embed = createEmbed(definitions, page, totalPages);
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId("prev")
                                .setLabel("Previous")
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(page === 0),
                            new ButtonBuilder()
                                .setCustomId("next")
                                .setLabel("Next")
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(page >= totalPages - 1)
                        );

                    const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

                    const collector = message.createMessageComponentCollector({ time: 60000 });

                    let currentPage = 0;

                    collector.on("collect", async (i) => {
                        if (i.customId === "prev" && currentPage > 0) {
                            currentPage--;
                            await updatePage(i, currentPage, totalPages);
                        } else if (i.customId === "next" && currentPage < totalPages - 1) {
                            currentPage++;
                            await updatePage(i, currentPage, totalPages);
                        }
                    });

                    collector.on("end", async () => {
                        const embed = createEmbed(definitions, currentPage, totalPages);
                        await message.edit({ embeds: [embed], components: [] });
                    });
                });
            });
        } else if (subcommand === "search") {
            const term = interaction.options.getString("term");
            const offset = 0;

            const updatePage = async (interaction, page, totalPages) => {
                const offset = page * ITEMS_PER_PAGE;
                searchDefinitions(term, offset, ITEMS_PER_PAGE, async (err, definitions) => {
                    if (err) {
                        return interaction.reply({ content: "Error searching definitions.", ephemeral: true });
                    }
                    const embed = createEmbed(definitions, page, totalPages, `Search Results for "${term}"`);
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId("prev")
                                .setLabel("Previous")
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(page === 0),
                            new ButtonBuilder()
                                .setCustomId("next")
                                .setLabel("Next")
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(page >= totalPages - 1)
                        );

                    await interaction.update({ embeds: [embed], components: [row] });
                });
            };

            searchDefinitionsCount(term, (err, count) => {
                if (err) {
                    return interaction.reply({ content: "Error fetching search results count.", ephemeral: true });
                }

                const totalPages = Math.ceil(count / ITEMS_PER_PAGE);
                searchDefinitions(term, offset, ITEMS_PER_PAGE, async (err, definitions) => {
                    if (err) {
                        return interaction.reply({ content: "Error searching definitions.", ephemeral: true });
                    }

                    const page = 0;
                    const embed = createEmbed(definitions, page, totalPages, `Search Results for "${term}"`);
                    const row = new ActionRowBuilder()
                        .addComponents(
                            new ButtonBuilder()
                                .setCustomId("prev")
                                .setLabel("Previous")
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(page === 0),
                            new ButtonBuilder()
                                .setCustomId("next")
                                .setLabel("Next")
                                .setStyle(ButtonStyle.Primary)
                                .setDisabled(page >= totalPages - 1)
                        );

                    const message = await interaction.reply({ embeds: [embed], components: [row], fetchReply: true });

                    const collector = message.createMessageComponentCollector({ time: 60000 });

                    let currentPage = 0;

                    collector.on("collect", async (i) => {
                        if (i.customId === "prev" && currentPage > 0) {
                            currentPage--;
                            await updatePage(i, currentPage, totalPages);
                        } else if (i.customId === "next" && currentPage < totalPages - 1) {
                            currentPage++;
                            await updatePage(i, currentPage, totalPages);
                        }
                    });

                    collector.on("end", async () => {
                        const embed = createEmbed(definitions, currentPage, totalPages, `Search Results for "${term}"`);
                        await message.edit({ embeds: [embed], components: [] });
                    });
                });
            });
        }
    },
};
