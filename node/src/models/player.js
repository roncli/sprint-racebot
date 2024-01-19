/**
 * @typedef {import("discord.js").GuildMember} DiscordJs.GuildMember
 */

//  ####    ##
//  #   #    #
//  #   #    #     ###   #   #   ###   # ##
//  ####     #        #  #   #  #   #  ##  #
//  #        #     ####  #  ##  #####  #
//  #        #    #   #   ## #  #      #
//  #       ###    ####      #   ###   #
//                       #   #
//                        ###
/**
 * A class that represents a player.
 */
class Player {
    //                           #                       #
    //                           #                       #
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #
    /**
     * Creates a new player.
     * @param {DiscordJs.GuildMember} member The Discord member.
     */
    constructor(member) {
        /**
         * The player's Discord ID.
         * @type {string}
         */
        this.discordId = member.id;

        /**
         * Whether the player is ready.
         * @type {boolean}
         */
        this.ready = false;

        /**
         * Whether the player has forfeited.
         * @type {boolean}
         */
        this.forfeit = false;

        /**
         * The player's finish time.
         * @type {number}
         */
        this.finish = 0;
    }
}

module.exports = Player;
