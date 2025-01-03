allstats = ['hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'];
statnames = ["PV", "Attaque", "Défense", "Attaque spéciale", "Défense spéciale", "Vitesse"]

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

function random_matching_ev(frm, iv, minimumValue=false) {
    min = Math.max(0  , (frm.lower - iv)*4    ); if (minimumValue) { return min; }
    max = Math.min(255, (frm.upper - iv)*4 + 3);
    return min + Math.floor((max - min)*Math.random());
}


function range(min, max, step=1) {
    if (max==null) { return range(0, min, step); }

    res = [];
    for (let i = min; i<max; i+=step) { res.push(i); }
    return res;
}

// statMatrix : list of lists of [hp, atk, def, asp, dsp, spe, lvl]
// bstMap : map associating every stage name with its bst
// nature : list of length 6, giving each stat its multiplier
// carac : object { statNo, modulo } or null if not given
function processing(statMatrix, bstMap, nature, carac, hpTxt) {
    // Initializing the list of potential IVs
    let possibleIVs = [];
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
        hpFrm = hp_frame(statMatrix[summaryNo][0], bstMap.get(statMatrix[summaryNo][7])[0], /* level : */ statMatrix[summaryNo][6]);

        // Getting the minimum possible IV value for this stat (mostly usable in the first summary), and filtering accordingly
        minIV = hpFrm.lower - 63;
        if (possibleIVs[0][0                        ] < minIV) { possibleIVs[0] = possibleIVs[0].filter(iv => iv >= minIV); }

        // Same with the maximum possible IV value (mostly usable in the last summaries)
        maxIV = hpFrm.upper;
        if (possibleIVs[0][possibleIVs[0].length - 1] > maxIV) { possibleIVs[0] = possibleIVs[0].filter(iv => iv <= maxIV); }


        for (let statNo = 1; statNo < 6; statNo++) {
            statFrm = other_frame(statMatrix[summaryNo][statNo], bstMap.get(statMatrix[summaryNo][7])[statNo], /* level : */ statMatrix[summaryNo][6], nature[statNo]);

            // Getting the minimum possible IV value for this stat (mostly usable in the first summary), and filtering accordingly
            minIV = statFrm.lower - 63;
            if (possibleIVs[statNo][0                             ] < minIV) { possibleIVs[statNo] = possibleIVs[statNo].filter(iv => iv >= minIV); }

            // Same with the maximum possible IV value (mostly usable in the last summaries)
            maxIV = statFrm.upper;
            if (possibleIVs[statNo][possibleIVs[statNo].length - 1] > maxIV) { possibleIVs[statNo] = possibleIVs[statNo].filter(iv => iv <= maxIV); }
        }
    }

    // Filtering depending on the highest stat given by the characteristic
    if (carac!=null) {
        maxVal = possibleIVs[carac.statNo][possibleIVs[carac.statNo].length - 1];
        for (let statNo = 0; statNo < 6; statNo++) {
            possibleIVs[statNo] = possibleIVs[statNo].filter(iv => iv <= maxVal);
        }
    }

    return possibleIVs;
}

function biased_draw(l) {
    // Draws a random element from the list, with a strong bias towards the end of the list
    let i = l.length - 1;;
    while(i>0 && Math.random()>=0.5 ) { i--; }
    return l[i];
}

function draw_test(size=10) {
    C = [];
    for (i=0; i<size; i++) { C.push(0); }
    rng = range(size);
    for (i=0; i<10000; i++) { C[biased_draw(rng)]++; }
    return C;
}

function sum_attr(l, attr) {
    let s = 0;
    l.forEach(x => { s+=x[attr]; });
    return s;
}

function selectIVs(possibleIVs_base, stats, bsts, nature, pcFilter) {
    let results = [];
    let iterationCount = 0;
    // The selection is repeated if the total of EVs exceeds 510
    while (results.length==0 || sum_attr(results, "ev")>510) {
        results = [];


        // Emergency handle, if a solution hasn't been found after 5 tries
        if (iterationCount>=5) {
            return selectIVs_emergency(possibleIVs_base, stats, bsts, nature, pcFilter);
        }


        // If there are no Hidden Power constraints, we just use the full possible IVs pool.
        let possibleIVs = possibleIVs_base;
        if (pcFilter!=null) {

            // The pcFilter lists all possible values for the binary number that decides Hidden Power type, bits sorted in stat order

            // Take a copy of the possible IVs pool
            possibleIVs = possibleIVs_base;
            // Shuffling the filter, to avoid getting the same value all the time
            let shuffledFilter = pcFilter.sort((a,b) => 0.5 - Math.random());
            // Flag checking if we found a fitting filter
            let failure = true;

            // For every filter, we check if it could fit our possible IVs pool
            for (let filterLine of shuffledFilter) {
                for (let statNo=0; statNo<6; statNo++) {
                    // Filter the values to fit the filter
                    possibleIVs[statNo] = possibleIVs[statNo].filter((x) => (x%2)==filterLine[statNo]);
                }

                // If all stat have possible values, then we can stop this step
                if (!possibleIVs.some(l => l.length==0)) {
                    failure = false;
                    break;
                }
            }
            if (failure) {
                // If the loop is exited without finding an adequate filter, it means there is probably an error with the data.
                return null;
            }
        }
        for (let statNo=0; statNo<6; statNo++) {
            let ivPool = possibleIVs[statNo];
            let iv = biased_draw(ivPool);
            let frm = (statNo==0) ? hp_frame(stats[statNo], bsts[statNo], stats[6]) : other_frame(stats[statNo], bsts[statNo], stats[6], nature[statNo]);
            results.push({ iv: iv, ev: random_matching_ev(frm, iv) });
        }
        iterationCount++;
    }
    return results;
}

// Alternate version of selectIVs, that picks the most optimal values, to see if they even work.
function selectIVs_emergency(possibleIVs_base, stats, bsts, nature, pcFilter) {
    let results = [];
    if (pcFilter==null) {
        // Case 1 : no hidden power value
        // We just get the optimal values : maximum IV, minimum EV in each stat
        for (let statNo=0; statNo<6; statNo++) {
            let ivPool = possibleIVs_base[statNo];
            let iv = ivPool[ivPool.length - 1];
            let frm = (statNo==0) ? hp_frame(stats[statNo], bsts[statNo], stats[6]) : other_frame(stats[statNo], bsts[statNo], stats[6], nature[statNo]);
            results.push({ iv: iv, ev: random_matching_ev(frm, iv, minimumValue=true) });
        }
        // If this optimal result still has too much EVs, then there is no possible solution.
        return (sum_attr(results, "ev")>510) ? null : results;

    } else {
        for (let filterLine of pcFilter) {
            // Case 2 : we have a hidden power value to respect
            // Same principle, but we test with every filter, until we find one working
            results = [];
            possibleIVs = possibleIVs_base;

            for (let statNo=0; statNo<6; statNo++) {
                // Filter the values to fit the filter
                possibleIVs[statNo] = possibleIVs[statNo].filter((x) => (x%2)==filterLine[statNo]);
            }

            // If all stat have possible values, then we can pick values
            if (!possibleIVs.some(l => l.length==0)) {
                // We just get the optimal values : maximum IV, minimum EV in each stat
                for (let statNo=0; statNo<6; statNo++) {
                    let ivPool = possibleIVs[statNo];
                    let iv = ivPool[ivPool.length - 1];
                    let frm = (statNo==0) ? hp_frame(stats[statNo], bsts[statNo], stats[6]) : other_frame(stats[statNo], bsts[statNo], stats[6], nature[statNo]);
                    results.push({ iv: iv, ev: random_matching_ev(frm, iv, minimumValue=true) });
                }
                // If this optimal result still has too much EVs, then there is no possible solution (with this filter).
                if (sum_attr(results, "ev")<=510) { return results; };
            }
        }
        // If we get here, then no filter brought any result
        return null;
    }
}
