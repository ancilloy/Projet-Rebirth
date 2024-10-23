function hp_stat(base, iv, ev, lvl) {
    return Math.floor( (2*base + iv + Math.floor(ev/4) ) * lvl / 100 ) + lvl + 10;
}

function other_stat(base, iv, ev, lvl, nature) {
    return Math.floor( ( Math.floor( ( 2*base + iv + Math.floor(ev/4) ) * lvl / 100 ) + 5 ) * nature );
}

function hp_frame(stat, base, iv, lvl) {
    return {
        lower : 4 *          ( (stat - lvl - 10) * 100/lvl - 2*base - iv ),
        upper : 4 * Math.ceil( (stat - lvl - 9 ) * 100/lvl - 2*base - iv )
    }
}

function other_frame(stat, base, iv, lvl, nature) {
    return {
        lower : 4 *          (          ( stat      / nature - 5) * 100/lvl - 2*base - iv ),
        upper : 4 * Math.ceil( Math.ceil((stat + 1) / nature - 5) * 100/lvl - 2*base - iv )
    }
}

//export { hp_stat, hp_frame, other_stat, other_frame };
