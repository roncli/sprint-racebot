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
    //               #     ##                  #
    //               #    #  #                 #
    //  ###    ##   ###    #     ##    ##    ###
    // ##     # ##   #      #   # ##  # ##  #  #
    //   ##   ##     #    #  #  ##    ##    #  #
    // ###     ##     ##   ##    ##    ##    ###
    /**
     * Sets the seed for the race.
     * @returns {void}
     */
    setSeed() {
        this.seed = Math.floor(Math.random() * 100000000).toString().padStart(8, "0");
    }
}

module.exports = Race;
