/**
 * @typedef {import("./race")} Race
 */

const Discord = require("../discord");

//   ###                         #         #
//  #   #                        #         #
//  #       ###   #   #  # ##   ####    ## #   ###   #   #  # ##
//  #      #   #  #   #  ##  #   #     #  ##  #   #  #   #  ##  #
//  #      #   #  #   #  #   #   #     #   #  #   #  # # #  #   #
//  #   #  #   #  #  ##  #   #   #  #  #  ##  #   #  # # #  #   #
//   ###    ###    ## #  #   #    ##    ## #   ###    # #   #   #
/**
 * Initiates a 10 second countdown.
 */
class Countdown {
    //                           #                       #
    //                           #                       #
    //  ##    ##   ###    ###   ###   ###   #  #   ##   ###    ##   ###
    // #     #  #  #  #  ##      #    #  #  #  #  #      #    #  #  #  #
    // #     #  #  #  #    ##    #    #     #  #  #      #    #  #  #
    //  ##    ##   #  #  ###      ##  #      ###   ##     ##   ##   #
    /**
     * Creates a new 10 second countdown.
     * @param {Race} race The race to countdown for.
     */
    constructor(race) {
        this.race = race;
        this.cancelled = false;

        this.race.start = Date.now() + 10000;

        Discord.embedBuilder({
            title: "Race Starts in 10 Seconds",
            description: "Everyone is ready!  The race will start in 10 seconds!"
        });

        setTimeout(async () => {
            if (this.cancelled) {
                return;
            }

            let counter = 5;
            while (counter > 0) {
                if (this.cancelled) {
                    return;
                }

                await Discord.queue(`${counter}...`, this.race.channel);

                counter--;

                await new Promise((resolve) => {
                    setTimeout(resolve, Math.max(this.race.start - Date.now() - 1000 * counter, 1));
                });
            }

            this.race.started = true;

            await Discord.queue("GO!", this.race.channel);

            await this.race.updatePin();
        }, Math.max(this.race.start - Date.now() - 5000, 1));
    }

    //                               ##
    //                                #
    //  ##    ###  ###    ##    ##    #
    // #     #  #  #  #  #     # ##   #
    // #     # ##  #  #  #     ##     #
    //  ##    # #  #  #   ##    ##   ###
    /**
     * Cancels a countdown.
     * @returns {void}
     */
    cancel() {
        if (this.race.started) {
            return;
        }

        this.cancelled = true;
        this.race.start = 0;

        Discord.queue("Countdown aborted.", this.race.channel);
    }
}

module.exports = Countdown;
