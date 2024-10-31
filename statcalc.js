allstats = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];

function hp_stat(base, iv, ev, lvl) {
    return Math.floor( (2*base + iv + Math.floor(ev/4) ) * lvl / 100 ) + lvl + 10;
}

function other_stat(base, iv, ev, lvl, nature) {
    return Math.floor( ( Math.floor( ( 2*base + iv + Math.floor(ev/4) ) * lvl / 100 ) + 5 ) * nature );
}

function hp_frame(stat, base, lvl) {            // calculates a frame for   iv + floor(ev/4)
    frm = {
        lower : (stat - lvl - 10) * 100/lvl - 2*base,
        upper : (stat - lvl - 9 ) * 100/lvl - 2*base
    }
    frm.lower = Math.ceil(frm.lower);
    frm.upper = Number.isInteger(frm.upper) ? frm.upper - 1 : Math.floor(frm.upper);

    while (hp_stat(base, frm.lower, 0, lvl) != stat) { frm.lower++; }
    while (hp_stat(base, frm.upper, 0, lvl) != stat) { frm.upper--; }
    return frm;
}

function other_frame(stat, base, lvl, nature) { // calculates a frame for   iv + floor(ev/4)
    frm = {
        lower :          ( stat      / nature - 5) * 100/lvl - 2*base,
        upper : Math.ceil((stat + 1) / nature - 5) * 100/lvl - 2*base
    }
    frm.lower = Math.ceil(frm.lower);
    frm.upper = Number.isInteger(frm.upper) ? frm.upper - 1 : Math.floor(frm.upper);

    while (other_stat(base, frm.lower, 0, lvl, nature) != stat) { frm.lower++; }
    while (other_stat(base, frm.upper, 0, lvl, nature) != stat) { frm.upper--; }
    return frm;
}


function range(min, max, step=1) {
    if (max==null) { return range(0, min, step); }

    res = [];
    for (let i = min; i<max; i+=step) { res.push(i); }
    return res;
}

// statMatrix : list of lists of [hp, atk, def, asp, dsp, spe, lvl]
// bstMatrix : list of lists of base stats for every stage of statMatrix
// nature : list of length 6, giving each stat its multiplier
// carac : object { statNo, modulo } or null if not given
function processing(statMatrix, bstMatrix, nature, carac, hpTxt) {
    // Initializing the list of potential IVs
    possibleIVs = [];
    for (let i=0; i<6; i++) { possibleIVs.push(range(32)); }

    // Filter values depending on characteristics
    if (carac != null) {
        possibleIVs[carac.statNo] = possibleIVs[carac.statNo].filter(iv => (iv % 5) == carac.modulo);
    }

    // Filter values depending on HP type
    for (let statNo = 0; statNo < 6; statNo++) {
        if (hpTxt.charAt(statNo) != "?") {
            modulo = parseInt(hpTxt.charAt(statNo));
            possibleIVs[statNo] = possibleIVs[statNo].filter(iv => (iv % 2) == modulo);
        }
    }

    // Filter values depending on given stats
    for (let summaryNo = 0; summaryNo < statMatrix.length; summaryNo++) {
        hpFrm = hp_frame(statMatrix[summaryNo][0], bstMatrix[summaryNo][0], /* level : */ statMatrix[summaryNo][6]);

        // Getting the minimum possible IV value for this stat (mostly usable in the first summary), and filtering accordingly
        minIV = hpFrm.upper;
        if (possibleIVs[0][0                        ] < minIV) { possibleIVs[0] = possibleIVs[0].filter(iv => iv >= minIV); }

        // Same with the maximum possible IV value (mostly usable in the last summaries)
        maxIV = hpFrm.lower - 63;
        if (possibleIVs[0][possibleIVs[0].length - 1] > maxIV) { possibleIVs[0] = possibleIVs[0].filter(iv => iv <= maxIV); }


        for (let statNo = 1; statNo < 6; statNo++) {
            statFrm = other_frame(statMatrix[summaryNo][statNo], bstMatrix[summaryNo][statNo], /* level : */ statMatrix[summaryNo][6], nature[statNo]);

            // Getting the minimum possible IV value for this stat (mostly usable in the first summary), and filtering accordingly
            minIV = statFrm.upper;
            if (possibleIVs[statNo][0                             ] < minIV) { possibleIVs[statNo] = possibleIVs[statNo].filter(iv => iv >= minIV); }

            // Same with the maximum possible IV value (mostly usable in the last summaries)
            maxIV = statFrm.lower - 63;
            if (possibleIVs[statNo][possibleIVs[statNo].length - 1] > maxIV) { possibleIVs[statNo] = possibleIVs[statNo].filter(iv => iv <= maxIV); }
        }
    }

    if (carac!=null) {
        maxVal = possibleIVs[carac.statNo][possibleIVs[carac.statNo].length - 1];
        for (let statNo = 0; statNo < 6; statNo++) {
            possibleIVs[statNo] = possibleIVs[statNo].filter(iv => iv <= maxVal);
        }
    }

    return possibleIVs;
}

//export { hp_stat, hp_frame, other_stat, other_frame };
