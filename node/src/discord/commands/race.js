/**
 * @typedef {import("discord.js").GuildMember} DiscordJs.GuildMember
 * @typedef {import("discord.js").TextChannel} DiscordJs.TextChannel
 */

const Discord = require(".."),
    Race = require("../../models/race");

//  ####                         ###              #
//  #   #                       #   #             #
//  #   #   ###    ###    ###   #      ## #    ## #
//  ####       #  #   #  #   #  #      # # #  #  ##
//  # #     ####  #      #####  #      # # #  #   #
//  #  #   #   #  #   #  #      #   #  # # #  #  ##
//  #   #   ####   ###    ###    ###   #   #   ## #
/**
 * A class that handles the race command.
 */
class RaceCmd {
    // #                    #  ##
    // #                    #   #
    // ###    ###  ###    ###   #     ##
    // #  #  #  #  #  #  #  #   #    # ##
    // #  #  # ##  #  #  #  #   #    ##
    // #  #   # #  #  #   ###  ###    ##
    /**
     * Handles the command.
     * @param {DiscordJs.GuildMember} member The member using the command.
     * @param {DiscordJs.TextChannel} channel The channel the command is being used in.
     * @returns {Promise} A promise that returns when the command is done executing.
     */
    static async handle(member, channel) {
        if (channel.parent && channel.parent.id === Discord.raceCategory.id) {
            return;
        }

        // If there are already 20 race rooms, don't create another.
        if (Discord.raceCategory.children.cache.size >= 40) {
            Discord.embedBuilder({
                title: "Too Many Races",
                description: "There are too many races going on at once.  Please join one of them instead!"
            });
            return;
        }

        const race = await Race.createRace();

        await Discord.richQueue(
            Discord.embedBuilder({
                title: "Race Created",
                description: `Visit ${race.channel} to join the race.`
            }),
            channel
        );
    }
}

module.exports = RaceCmd;
