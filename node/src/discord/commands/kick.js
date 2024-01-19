/**
 * @typedef {import("discord.js").GuildMember} DiscordJs.GuildMember
 * @typedef {import("discord.js").TextChannel} DiscordJs.TextChannel
 */

const Discord = require(".."),
    Race = require("../../models/race"),

    idParse = /^<@!?(?<id>\d+)>$/;

//  #   #    #           #       ###              #
//  #  #                 #      #   #             #
//  # #     ##     ###   #   #  #      ## #    ## #
//  ##       #    #   #  #  #   #      # # #  #  ##
//  # #      #    #      ###    #      # # #  #   #
//  #  #     #    #   #  #  #   #   #  # # #  #  ##
//  #   #   ###    ###   #   #   ###   #   #   ## #
/**
 * A class that handles the kick command.
 */
class KickCmd {
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
     * @param {string} param The command parameters.
     * @returns {Promise} A promise that returns when the command is done executing.
     */
    static async handle(member, channel, param) {
        if (!member.roles.cache.has(Discord.staffRole.id)) {
            return;
        }

        const race = Race.getByChannel(channel);

        if (!race) {
            return;
        }

        if (!idParse.test(param)) {
            return;
        }

        const kickedMember = Discord.findGuildMemberById(idParse.exec(param).groups.id);

        if (!kickedMember) {
            return;
        }

        await race.kick(member, kickedMember);
    }
}

module.exports = KickCmd;
