const { Events } = require("discord.js");

module.exports = {
    name: Events.GuildMemberAdd, // Make sure this is correct
    execute(member) {
        // Logging to verify the event triggers when a user joins
        console.log(`${member.user.tag} has joined the server.`);

        // DM Message
        const welcomeMessage = `Welcome to **${member.guild.name}**! 🎉

Some tips to get you started :)
- TL;DR: no gifs & fewer channels until you have reached the first star ⭐ rank role
- you gain the ⭐ roles by being active and sending messages on the server
- more about that in https://discord.com/channels/858622511574679562/891012819624030269/1221447398153388153

type !rank in <#878901585709789204> to check your progress
type !lvlroles in <#878901585709789204> to see all the roles and their amounts

https://media.discordapp.net/attachments/858622511574679566/1234044385168199720/image.png?ex=66c6e964&is=66c597e4&hm=0a7a6bb50a7c9f5d38dc68de39ed982b5f2a6855a7b3c1708b2d7d48e6032c39&=&format=webp&quality=lossless
        `;

        // Attempt to send the DM to the new member
        member.send(welcomeMessage).catch((error) => {
            console.error(`Could not send DM to ${member.user.tag}. Error:`, error);
        });
    },
};
