/**
 * @typedef {import("discord.js").GuildMember} DiscordJs.GuildMember
 * @typedef {import("discord.js").TextChannel} DiscordJs.TextChannel
 */

const Countdown = require("./countdown"),
    Discord = require("../discord"),
    Player = require("./player");

//  ####
//  #   #
//  #   #   ###    ###    ###
//  ####       #  #   #  #   #
//  # #     ####  #      #####
//  #  #   #   #  #   #  #
//  #   #   ####   ###    ###
/**
 * A class that represents a race.
 */
class Race {
    //                          #          ###
    //                          #          #  #
    //  ##   ###    ##    ###  ###    ##   #  #   ###   ##    ##
    // #     #  #  # ##  #  #   #    # ##  ###   #  #  #     # ##
    // #     #     ##    # ##   #    ##    # #   # ##  #     ##
    //  ##   #      ##    # #    ##   ##   #  #   # #   ##    ##
    /**
     * Creates a race.
     * @returns {Promise<Race>} A promise that returns the created race.
     */
    static async createRace() {
        const channel = await Discord.createNumberedChannel("race"),
            race = new Race(channel);

        await race.setup();

        Race.races.push(race);
        return race;
    }

    //   #                            #    ###    #
    //  # #                           #     #
    //  #     ##   ###   # #    ###  ###    #    ##    # #    ##
    // ###   #  #  #  #  ####  #  #   #     #     #    ####  # ##
    //  #    #  #  #     #  #  # ##   #     #     #    #  #  ##
    //  #     ##   #     #  #   # #    ##   #    ###   #  #   ##
    /**
     * Formats time into a human-readable format.
     * @param {number} time The time in milliseconds.
     * @returns {string} The time in a human-readable format.
     */
    static formatTime(time) {
        const hours = Math.floor(time / 1000 / 60 / 60),
            minutes = Math.floor(time / 1000 / 60) % 60,
            seconds = Math.floor(time / 1000) % 60,
            milliseconds = time % 1000;

        if (hours > 0) {
            return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`;
        }

        return `${minutes}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`;
    }

    //              #    ###          ##   #                             ##
    //              #    #  #        #  #  #                              #
    //  ###   ##   ###   ###   #  #  #     ###    ###  ###   ###    ##    #
    // #  #  # ##   #    #  #  #  #  #     #  #  #  #  #  #  #  #  # ##   #
    //  ##   ##     #    #  #   # #  #  #  #  #  # ##  #  #  #  #  ##     #
    // #      ##     ##  ###     #    ##   #  #   # #  #  #  #  #   ##   ###
    //  ###                     #
    /**
     * Gets a race by its channel.
     * @param {DiscordJs.TextChannel} channel The channel.
     * @returns {Race} The race.
     */
    static getByChannel(channel) {
        return Race.races.find((r) => r.channel.id === channel.id);
    }

    //                           #                       #
    //                           #                       #
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #
    /**
     * Creates a new race.
     * @param {DiscordJs.TextChannel} channel The channel for the race.
     */
    constructor(channel) {
        /**
         * The channel the race is in.
         * @type {DiscordJs.TextChannel}
         */
        this.channel = channel;

        /**
         * The seed.
         * @type {string}
         */
        this.seed = "";

        /**
         * The players in the race.
         * @type {Player[]}
         */
        this.players = [];

        /**
         * Whether the race has been started.
         * @type {boolean}
         */
        this.started = false;

        /**
         * The start time of the race.
         * @type {number}
         */
        this.start = 0;

        /**
         * The end time of the race.
         * @type {number}
         */
        this.end = 0;

        /**
         * The countdown at the start of the race.
         * @type {Countdown}
         */
        this.countdown = null;

        /**
         * The timeout that will automatically close this race room.
         * @type {NodeJS.Timeout}
         */
        this.autoCloseTimeout = null;
    }

    //       ##
    //        #
    //  ##    #     ##    ###    ##
    // #      #    #  #  ##     # ##
    // #      #    #  #    ##   ##
    //  ##   ###    ##   ###     ##
    /**
     * Closes the race room.
     * @param {DiscordJs.GuildMember} [member] The guild member.
     * @returns {Promise} A promise that resolves when the race room is closed.
     */
    async close(member) {
        // Remove this race from the races array.
        Race.races = Race.races.filter((r) => r !== this);

        if (member) {
            await this.channel.delete(`The race room ${this.channel.name} was closed by ${member}.`);
        } else {
            await this.channel.delete(`The race room ${this.channel.name} was automatically closed after 5 minutes of inactivity.`);
        }
    }

    //    #
    //    #
    //  ###   ##   ###    ##
    // #  #  #  #  #  #  # ##
    // #  #  #  #  #  #  ##
    //  ###   ##   #  #   ##
    /**
     * Indicates that a player has completed a race.
     * @param {DiscordJs.GuildMember} member The guild member.
     * @returns {Promise<Player>} A promise that returns the player.
     */
    async done(member) {
        if (!this.started) {
            await Discord.richQueue(
                Discord.embedBuilder({
                    title: "Race Not Started",
                    description: `Sorry, ${member}, but this race hasn't started yet.`
                }),
                this.channel
            );
            return void 0;
        }

        if (this.end > 0) {
            await Discord.richQueue(
                Discord.embedBuilder({
                    title: "Race Already Finished",
                    description: `Sorry, ${member}, but this race is already finished.`
                }),
                this.channel
            );
            return void 0;
        }

        const player = this.players.find((p) => p.discordId === member.id);
        if (!player) {
            await Discord.richQueue(
                Discord.embedBuilder({
                    title: "Not Entered",
                    description: `Sorry, ${member}, but you have not entered.`
                }),
                this.channel
            );
            return void 0;
        }

        if (player.finish > 0) {
            await Discord.richQueue(
                Discord.embedBuilder({
                    title: "Already Finished",
                    description: `Sorry, ${member}, but you have already finished.`
                }),
                this.channel
            );
            return void 0;
        }

        if (player.forfeit) {
            await Discord.richQueue(
                Discord.embedBuilder({
                    title: "Already Forfeited",
                    description: `Sorry, ${member}, but you have already forfeited.`
                }),
                this.channel
            );
            return void 0;
        }

        player.finish = Date.now();

        // Get the number of finished racers.
        const finishedPlayers = this.players.filter((p) => p.finish > 0),
            finished = finishedPlayers.length;

        const ordinal = finished % 100 >= 11 && finished % 100 <= 13 ? "th" : finished % 10 === 1 ? "st" : finished % 10 === 2 ? "nd" : finished % 10 === 3 ? "rd" : "th";
        await Discord.queue(`${member} has finished ${finished}${ordinal} with **${Race.formatTime(player.finish - this.start)}**.`, this.channel);

        // Get the number of racers still racing.
        const racing = this.players.filter((p) => p.finish === 0 && !p.forfeit).length;

        if (racing === 0) {
            this.end = Date.now();

            const forfeitPlayers = this.players.filter((p) => p.forfeit);

            const message = Discord.embedBuilder({
                title: "Race Ended",
                description: "The race has concluded!",
                fields: []
            });

            if (finishedPlayers.length > 0) {
                message.addFields({
                    name: "Standings",
                    value: finishedPlayers.map((p, index) => `${index + 1}) **${Race.formatTime(p.finish - this.start)}** - <@${p.discordId}>`).join("\n"),
                    inline: true
                });
            }

            if (forfeitPlayers.length > 0) {
                message.addFields({
                    name: "Forfeited Players",
                    value: forfeitPlayers.map((p) => `<@${p.discordId}>`).join("\n"),
                    inline: true
                });
            }

            await Discord.richQueue(message, this.channel);
        }

        await this.updatePin();

        return player;
    }

    //              #
    //              #
    //  ##   ###   ###    ##   ###
    // # ##  #  #   #    # ##  #  #
    // ##    #  #   #    ##    #
    //  ##   #  #    ##   ##   #
    /**
     * Allows a player to enter the race.
     * @param {DiscordJs.GuildMember} member The guild member.
     * @returns {Promise<Player>} A promise that returns the player.
     */
    async enter(member) {
        if (this.started) {
            await Discord.richQueue(
                Discord.embedBuilder({
                    title: "Race Already Started",
                    description: `Sorry, ${member}, but this race has already started.`
                }),
                this.channel
            );
            return void 0;
        }

        const existingPlayer = this.players.find((p) => p.discordId === member.id);
        if (existingPlayer) {
            await Discord.richQueue(
                Discord.embedBuilder({
                    title: "Already Entered",
                    description: `Sorry, ${member}, but you have already entered.  ${existingPlayer.ready ? "Please wait for the race to start." : "Please use `.ready` to indicate you are ready to start."}`
                }),
                this.channel
            );
            return void 0;
        }

        if (this.countdown) {
            this.countdown.cancel();
            this.countdown = null;
        }

        const player = new Player(member);

        this.players.push(player);

        await Discord.richQueue(
            Discord.embedBuilder({
                title: `${member} Entered`,
                description: `${member} has entered!  There ${this.players.length === 1 ? "is" : "are"} now ${this.players.length} ${this.players.length === 1 ? "entry" : "entries"}, with ${this.players.filter((p) => !p.ready).length} remaining to be ready.`
            }),
            this.channel
        );

        await this.updatePin();

        return player;
    }

    //   #                 #          #     #
    //  # #               # #               #
    //  #     ##   ###    #     ##   ##    ###
    // ###   #  #  #  #  ###   # ##   #     #
    //  #    #  #  #      #    ##     #     #
    //  #     ##   #      #     ##   ###     ##
    /**
     * Allows a player to forfeit.
     * @param {DiscordJs.GuildMember} member The guild member.
     * @returns {Promise<Player>} A promise that returns the player.
     */
    async forfeit(member) {
        if (!this.started) {
            await Discord.richQueue(
                Discord.embedBuilder({
                    title: "Race Not Started",
                    description: `Sorry, ${member}, but this race hasn't started yet.`
                }),
                this.channel
            );
            return void 0;
        }

        if (this.end > 0) {
            await Discord.richQueue(
                Discord.embedBuilder({
                    title: "Race Already Finished",
                    description: `Sorry, ${member}, but this race is already finished.`
                }),
                this.channel
            );
            return void 0;
        }

        const player = this.players.find((p) => p.discordId === member.id);
        if (!player) {
            await Discord.richQueue(
                Discord.embedBuilder({
                    title: "Not Entered",
                    description: `Sorry, ${member}, but you have not entered.`
                }),
                this.channel
            );
            return void 0;
        }

        if (player.finish > 0) {
            await Discord.richQueue(
                Discord.embedBuilder({
                    title: "Already Finished",
                    description: `Sorry, ${member}, but you have already finished.`
                }),
                this.channel
            );
            return void 0;
        }

        if (player.forfeit) {
            await Discord.richQueue(
                Discord.embedBuilder({
                    title: "Already Forfeited",
                    description: `Sorry, ${member}, but you have already forfeited.`
                }),
                this.channel
            );
            return void 0;
        }

        player.forfeit = true;

        await Discord.queue(`${member} has forfeited.`, this.channel);

        // Get the number of racers still racing.
        const racing = this.players.filter((p) => p.finish === 0 && !p.forfeit).length;

        if (racing === 0) {
            this.end = Date.now();

            // Get the finished and forfeited racers.
            const finishedPlayers = this.players.filter((p) => p.finish > 0),
                forfeitPlayers = this.players.filter((p) => p.forfeit);

            const message = Discord.embedBuilder({
                title: "Race Ended",
                description: "The race has concluded!",
                fields: []
            });

            if (finishedPlayers.length > 0) {
                message.addFields({
                    name: "Standings",
                    value: finishedPlayers.map((p, index) => `${index + 1}) **${Race.formatTime(p.finish - this.start)}** - <@${p.discordId}>`).join("\n"),
                    inline: true
                });
            }

            if (forfeitPlayers.length > 0) {
                message.addFields({
                    name: "Forfeited Players",
                    value: forfeitPlayers.map((p) => `<@${p.discordId}>`).join("\n"),
                    inline: true
                });
            }

            await Discord.richQueue(message, this.channel);
        }

        await this.updatePin();

        return player;
    }

    // #      #          #
    // #                 #
    // # #   ##     ##   # #
    // ##     #    #     ##
    // # #    #    #     # #
    // #  #  ###    ##   #  #
    /**
     * Kicks a player from the race.
     * @param {DiscordJs.GuildMember} member The guild member doing the command.
     * @param {DiscordJs.GuildMember} kickedMember The guild member being kicked.
     * @returns {Promise} A promise that resolves when the player has been kicked.
     */
    async kick(member, kickedMember) {
        if (this.end > 0) {
            await Discord.richQueue(
                Discord.embedBuilder({
                    title: "Race Already Finished",
                    description: `Sorry, ${member}, but this race has completed.`
                }),
                this.channel
            );
            return;
        }

        const player = this.players.find((p) => p.discordId === kickedMember.id);

        if (!player) {
            await Discord.richQueue(
                Discord.embedBuilder({
                    title: "Not Entered",
                    description: `Sorry, ${member}, but ${kickedMember} has not entered this race.`
                }),
                this.channel
            );
            return;
        }

        this.players = this.players.filter((p) => p.discordId !== kickedMember.id);

        if (this.start === 0) {
            // Get the number of unreadied racers.
            const unreadied = this.players.filter((p) => !p.ready).length;

            if (unreadied === 0 && this.players.length >= 2) {
                this.countdown = new Countdown(this);
            }
        } else if (this.started) {
            // Get the number of racers still racing.
            const racing = this.players.filter((p) => p.finish === 0 && !p.forfeit).length;

            if (racing === 0) {
                this.end = Date.now();

                // Get the finished and forfeited racers.
                const finishedPlayers = this.players.filter((p) => p.finish > 0),
                    forfeitPlayers = this.players.filter((p) => p.forfeit);

                const message = Discord.embedBuilder({
                    title: "Race Ended",
                    description: "The race has concluded!",
                    fields: []
                });

                if (finishedPlayers.length > 0) {
                    message.addFields({
                        name: "Standings",
                        value: finishedPlayers.map((p, index) => `${index + 1}) **${Race.formatTime(p.finish - this.start)}** - <@${p.discordId}>`).join("\n"),
                        inline: true
                    });
                }

                if (forfeitPlayers.length > 0) {
                    message.addFields({
                        name: "Forfeited Players",
                        value: forfeitPlayers.map((p) => `<@${p.discordId}>`).join("\n"),
                        inline: true
                    });
                }

                await Discord.richQueue(message, this.channel);
            }
        }

        await this.updatePin();
    }

    //              #       #
    //              #       #
    // ###    ##   ###    ###   ##   ###    ##
    // #  #  #  #   #    #  #  #  #  #  #  # ##
    // #  #  #  #   #    #  #  #  #  #  #  ##
    // #  #   ##     ##   ###   ##   #  #   ##
    /**
     * Allows a player to reverse a done or forfeit.
     * @param {DiscordJs.GuildMember} member The guild member.
     * @returns {Promise<Player>} A promise that returns the player.
     */
    async notdone(member) {
        if (!this.started) {
            await Discord.richQueue(
                Discord.embedBuilder({
                    title: "Race Not Started",
                    description: `Sorry, ${member}, but this race hasn't started yet.`
                }),
                this.channel
            );
            return void 0;
        }

        const player = this.players.find((p) => p.discordId === member.id);
        if (!player) {
            await Discord.richQueue(
                Discord.embedBuilder({
                    title: "Not Entered",
                    description: `Sorry, ${member}, but you have not entered.`
                }),
                this.channel
            );
            return void 0;
        }

        if (player.finish === 0 && !player.forfeit) {
            await Discord.richQueue(
                Discord.embedBuilder({
                    title: "Already Finished",
                    description: `Sorry, ${member}, but you haven't finished or forfeited.`
                }),
                this.channel
            );
            return void 0;
        }

        player.finish = 0;
        player.forfeit = false;

        await Discord.queue(`${member} has resumed racing.`, this.channel);

        if (this.end > 0) {
            this.end = 0;

            await Discord.richQueue(
                Discord.embedBuilder({
                    title: "Race Resumed",
                    description: "The race has been resumed."
                }),
                this.channel
            );
        }

        await this.updatePin();

        return player;
    }

    //                      #
    //                      #
    // ###    ##    ###   ###  #  #
    // #  #  # ##  #  #  #  #  #  #
    // #     ##    # ##  #  #   # #
    // #      ##    # #   ###    #
    //                          #
    /**
     * Allows a player to indicate that they are ready.
     * @param {DiscordJs.GuildMember} member The guild member.
     * @returns {Promise<Player>} A promise that returns the player.
     */
    async ready(member) {
        if (this.started) {
            await Discord.richQueue(
                Discord.embedBuilder({
                    title: "Race Already Started",
                    description: `Sorry, ${member}, but this race has already started.`
                }),
                this.channel
            );
            return void 0;
        }

        let player = this.players.find((p) => p.discordId === member.id);
        if (player) {
            player.ready = true;

            await Discord.richQueue(
                Discord.embedBuilder({
                    title: `${member} Ready`,
                    description: `${member} has is now ready!  There ${this.players.length === 1 ? "is" : "are"} ${this.players.length} ${this.players.length === 1 ? "entry" : "entries"}, with ${this.players.filter((p) => !p.ready).length} remaining to be ready.`
                }),
                this.channel
            );
        } else {
            if (this.countdown) {
                this.countdown.cancel();
                this.countdown = null;
            }

            player = new Player(member);
            player.ready = true;

            this.players.push(player);

            await Discord.richQueue(
                Discord.embedBuilder({
                    title: `${member} Entered and Ready`,
                    description: `${member} has entered and is now ready!  There ${this.players.length === 1 ? "is" : "are"} ${this.players.length} ${this.players.length === 1 ? "entry" : "entries"}, with ${this.players.filter((p) => !p.ready).length} remaining to be ready.`
                }),
                this.channel
            );
        }

        if (this.players.length >= 2 && this.players.filter((p) => !p.ready).length === 0) {
            this.countdown = new Countdown(this);
        }

        await this.updatePin();

        return player;
    }

    //                          #          #
    //                          #          #
    // ###    ##   # #    ###  ###    ##   ###
    // #  #  # ##  ####  #  #   #    #     #  #
    // #     ##    #  #  # ##   #    #     #  #
    // #      ##   #  #   # #    ##   ##   #  #
    /**
     * Begins a rematch.
     * @param {DiscordJs.GuildMember} member The guild member.
     * @returns {Promise} A promise that resolves when the rematch has been setup.
     */
    async rematch(member) {
        if (this.end === 0) {
            await Discord.richQueue(
                Discord.embedBuilder({
                    title: "Race Already Started",
                    description: `Sorry, ${member}, but there is already an active race.`
                }),
                this.channel
            );
            return;
        }

        await this.setup();
    }

    //               #
    //               #
    //  ###    ##   ###   #  #  ###
    // ##     # ##   #    #  #  #  #
    //   ##   ##     #    #  #  #  #
    // ###     ##     ##   ###  ###
    //                          #
    /**
     * Sets up the race.
     * @returns {Promise} A promise that resolves when the race has been setup.
     */
    async setup() {
        this.seed = Math.floor(Math.random() * 100000000).toString().padStart(8, "0");
        this.players = [];
        this.started = false;
        this.start = 0;
        this.end = 0;

        this.pinnedPost = await Discord.richQueue(
            Discord.embedBuilder({
                title: "New Race",
                description: `Seed: ${this.seed}`,
                fields: [
                    {
                        name: "Commands",
                        value: "`.enter` or `.e` - Enter the race\n`.withdraw` or `.w` - Withdraw from the race\n`.ready` or `.r` - Indicate that you are ready to start\n`.unready` or `.u` - Indicate you are not ready to start"
                    }
                ]
            }),
            this.channel
        );

        const pinnedMessages = await this.channel.messages.fetchPinned();
        for (const pin of pinnedMessages.values()) {
            await pin.unpin("New race starting.");
        }

        if (this.autoCloseTimeout) {
            clearTimeout(this.autoCloseTimeout);
            this.autoCloseTimeout = null;
        }

        // Close this race after 5 minutes.
        this.autoCloseTimeout = setTimeout(async () => {
            await this.close();
        }, 300000);

        await this.pinnedPost.pin("New race starting.");
    }

    //  #     #
    //  #
    // ###   ##    # #    ##
    //  #     #    ####  # ##
    //  #     #    #  #  ##
    //   ##  ###   #  #   ##
    /**
     * Gets the current time of the race.
     * @param {DiscordJs.GuildMember} member The guild member.
     * @returns {Promise} A promise that resolves when the time has been returned.
     */
    async time(member) {
        if (!this.started) {
            await Discord.richQueue(
                Discord.embedBuilder({
                    title: "Race Not Started",
                    description: `Sorry, ${member}, but this race has not started.`
                }),
                this.channel
            );
            return;
        }

        if (this.end > 0) {
            await Discord.richQueue(
                Discord.embedBuilder({
                    title: "Race Already Finished",
                    description: `Sorry, ${member}, but this race has completed.`
                }),
                this.channel
            );
            return;
        }

        Discord.queue(`The current race time is **${Race.formatTime(Date.now() - this.start)}**.`, this.channel);
    }

    //                                  #
    //                                  #
    // #  #  ###   ###    ##    ###   ###  #  #
    // #  #  #  #  #  #  # ##  #  #  #  #  #  #
    // #  #  #  #  #     ##    # ##  #  #   # #
    //  ###  #  #  #      ##    # #   ###    #
    //                                      #
    /**
     * Allows a player to indicate that they are not ready.
     * @param {DiscordJs.GuildMember} member The guild member.
     * @returns {Promise<Player>} A promise that returns the player.
     */
    async unready(member) {
        if (this.started) {
            await Discord.richQueue(
                Discord.embedBuilder({
                    title: "Race Already Started",
                    description: `Sorry, ${member}, but this race has already started.`
                }),
                this.channel
            );
            return void 0;
        }

        const player = this.players.find((p) => p.discordId === member.id);
        if (!player) {
            await Discord.richQueue(
                Discord.embedBuilder({
                    title: "Not Entered",
                    description: `Sorry, ${member}, but you have not entered.`
                }),
                this.channel
            );
            return void 0;
        }

        if (this.countdown) {
            this.countdown.cancel();
            this.countdown = null;
        }

        player.ready = false;

        await Discord.richQueue(
            Discord.embedBuilder({
                title: `${member} Unready`,
                description: `${member} is no longer ready.  There ${this.players.length === 1 ? "is" : "are"} ${this.players.length} ${this.players.length === 1 ? "entry" : "entries"}, with ${this.players.filter((p) => !p.ready).length} remaining to be ready.`
            }),
            this.channel
        );

        await this.updatePin();

        return player;
    }

    //                #         #          ###    #
    //                #         #          #  #
    // #  #  ###    ###   ###  ###    ##   #  #  ##    ###
    // #  #  #  #  #  #  #  #   #    # ##  ###    #    #  #
    // #  #  #  #  #  #  # ##   #    ##    #      #    #  #
    //  ###  ###    ###   # #    ##   ##   #     ###   #  #
    //       #
    /**
     * Updates the pinned post.
     * @returns {Promise} A promise that resolves when the pinned post has been updated.
     */
    async updatePin() {
        if (!this.started && this.start === 0) {
            // If there are no players, automatically close this race after 5 minutes.
            if (this.players.length === 0 && !this.autoCloseTimeout) {
                this.autoCloseTimeout = setTimeout(async () => {
                    await this.close();
                }, 300000);
            } else if (this.autoCloseTimeout) {
                clearTimeout(this.autoCloseTimeout);
                this.autoCloseTimeout = null;
            }

            // Get list of ready players.
            const readyPlayers = this.players.filter((p) => p.ready);

            // Get list of unready players.
            const unreadyPlayers = this.players.filter((p) => !p.ready);

            // Build message.
            const message = Discord.embedBuilder({
                title: "New Race",
                description: `Seed: ${this.seed}`,
                fields: []
            });

            if (readyPlayers.length > 0) {
                message.addFields({
                    name: "Ready Players",
                    value: readyPlayers.map((p) => `<@${p.discordId}>`).join("\n"),
                    inline: true
                });
            }

            if (unreadyPlayers.length > 0) {
                message.addFields({
                    name: "Unready Players",
                    value: `\n${unreadyPlayers.map((p) => `<@${p.discordId}>`).join("\n")}`,
                    inline: true
                });
            }

            message.addFields({
                name: "Commands",
                value: "`.enter` or `.e` - Enter the race\n`.withdraw` or `.w` - Withdraw from the race\n`.ready` or `.r` - Indicate that you are ready to start\n`.unready` or `.u` - Indicate you are not ready to start"
            });

            await Discord.richEdit(this.pinnedPost, message);
        } else if (!this.started && this.start > 0) {
            if (this.autoCloseTimeout) {
                clearTimeout(this.autoCloseTimeout);
                this.autoCloseTimeout = null;
            }

            // Build message.
            const message = Discord.embedBuilder({
                title: "Race Starting",
                description: `Seed: ${this.seed}\nStarting <t:${this.start}:R>`,
                fields: [
                    {
                        name: "Players",
                        value: this.players.map((p) => `<@${p.discordId}>`).join("\n")
                    },
                    {
                        name: "Commands",
                        value: "`.enter` or `.e` - Enter the race\n`.withdraw` or `.w` - Withdraw from the race\n`.ready` or `.r` - Indicate that you are ready to start\n`.unready` or `.u` - Indicate you are not ready to start"
                    }
                ]
            });

            await Discord.richEdit(this.pinnedPost, message);
        } else if (this.started && this.end === 0) {
            if (this.autoCloseTimeout) {
                clearTimeout(this.autoCloseTimeout);
                this.autoCloseTimeout = null;
            }

            // Get list of finished players and sort them by finish time.
            const finishedPlayers = this.players.filter((p) => p.finish > 0).sort((a, b) => a.finish - b.finish);

            // Get list of forfeited players.
            const forfeitPlayers = this.players.filter((p) => p.forfeit);

            // Get list of players still racing.
            const racingPlayers = this.players.filter((p) => p.finish === 0 && !p.forfeit);

            const message = Discord.embedBuilder({
                title: "Race Started",
                description: `Seed: ${this.seed}\nStarted <t:${this.start}:R>`,
                fields: []
            });

            if (finishedPlayers.length > 0) {
                message.addFields({
                    name: "Finished Players",
                    value: finishedPlayers.map((p, index) => `${index + 1}) **${Race.formatTime(p.finish - this.start)}** - <@${p.discordId}>`).join("\n"),
                    inline: true
                });
            }

            if (forfeitPlayers.length > 0) {
                message.addFields({
                    name: "Forfeited Players",
                    value: forfeitPlayers.map((p) => `<@${p.discordId}>`).join("\n"),
                    inline: true
                });
            }

            if (racingPlayers.length > 0) {
                message.addFields({
                    name: "Still Racing",
                    value: racingPlayers.map((p) => `<@${p.discordId}>`).join("\n"),
                    inline: true
                });
            }

            message.addFields({
                name: "Commands",
                value: "`.done` or `.d` - Indicate you completed the race\n`.forfeit` or `.f` - Forfeit the race\n`.undone` or `.u` - Reenter the race if you accidentally completed or forfeited\n`.time` - Get the time elapsed in the race."
            });

            await Discord.richEdit(this.pinnedPost, message);
        } else if (this.started && this.end > 0) {
            if (!this.autoCloseTimeout) {
                this.autoCloseTimeout = setTimeout(async () => {
                    await this.close();
                }, 300000);
            }

            // Get list of finished players and sort them by finish time.
            const finishedPlayers = this.players.filter((p) => p.finish > 0).sort((a, b) => a.finish - b.finish);

            // Get list of forfeited players.
            const forfeitPlayers = this.players.filter((p) => p.forfeit);

            const message = Discord.embedBuilder({
                title: "Race Complete",
                description: `Seed: ${this.seed}\nStarted <t:${this.start}:R>\nEnded <t:${this.end}:R>`,
                fields: []
            });

            if (finishedPlayers.length > 0) {
                message.addFields({
                    name: "Finished Players",
                    value: finishedPlayers.map((p, index) => `${index + 1}) **${Race.formatTime(p.finish - this.start)}** - <@${p.discordId}>`).join("\n"),
                    inline: true
                });
            }

            if (forfeitPlayers.length > 0) {
                message.addFields({
                    name: "Forfeited Players",
                    value: forfeitPlayers.map((p) => `<@${p.discordId}>`).join("\n"),
                    inline: true
                });
            }

            message.addFields({
                name: "Commands",
                value: "`.rematch` - Start a new race in this channel.\n`.undone` or `.u` - Reenter the race if you accidentally completed or forfeited"
            });

            await Discord.richEdit(this.pinnedPost, message);
        }
    }

    //        #     #    #        #
    //              #    #        #
    // #  #  ##    ###   ###    ###  ###    ###  #  #
    // #  #   #     #    #  #  #  #  #  #  #  #  #  #
    // ####   #     #    #  #  #  #  #     # ##  ####
    // ####  ###     ##  #  #   ###  #      # #  ####
    /**
     * Allows a player to withdraw.
     * @param {DiscordJs.GuildMember} member The guild member.
     * @returns {Promise<Player>} A promise that returns the player.
     */
    async withdraw(member) {
        if (this.started) {
            await Discord.richQueue(
                Discord.embedBuilder({
                    title: "Race Already Started",
                    description: `Sorry, ${member}, but this race has already started.  Use \`.forfeit\` to forfeit.`
                }),
                this.channel
            );
            return void 0;
        }

        const player = this.players.find((p) => p.discordId === member.id);
        if (!player) {
            await Discord.richQueue(
                Discord.embedBuilder({
                    title: "Not Entered",
                    description: `Sorry, ${member}, but you have not entered.`
                }),
                this.channel
            );
            return void 0;
        }

        this.players = this.players.filter((p) => p.discordId !== member.id);

        const remainingPlayers = this.players.filter((p) => !p.ready);

        await Discord.richQueue(
            Discord.embedBuilder({
                title: `${member} Withdrawn`,
                description: `${member} has withdrawn.  There ${this.players.length === 1 ? "is" : "are"} now ${this.players.length} ${this.players.length === 1 ? "entry" : "entries"}, with ${remainingPlayers.length} remaining to be ready.`
            }),
            this.channel
        );

        if (remainingPlayers.length === 0 && !this.countdown && this.players.length >= 2) {
            this.countdown = new Countdown(this);
        }

        if (this.countdown && this.players.length < 2) {
            this.countdown.cancel();
            this.countdown = null;
        }

        await this.updatePin();

        return player;
    }
}

/**
 * A list of currently active races.
 * @type {Race[]}
 */
Race.races = [];

module.exports = Race;
