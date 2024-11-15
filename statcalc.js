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

function random_matching_ev(frm, iv) {
    min = Math.max(0  , (frm.lower - iv)*4    );
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
    //console.log("Initializing the list of potential IVs");
    possibleIVs = [];
    for (let i=0; i<6; i++) { possibleIVs.push(range(32)); }
    //console.log(possibleIVs);

    // Filter values depending on characteristics
    if (carac != null) {
        //console.log("Filter values depending on characteristics");
        possibleIVs[carac.statNo] = possibleIVs[carac.statNo].filter(iv => (iv % 5) == carac.modulo);
        //console.log(possibleIVs);
    }

    // Filter values depending on HP type
    //console.log("Filter values depending on HP type");
    for (let statNo = 0; statNo < 6; statNo++) {
        if (hpTxt.charAt(statNo) != "?") {
            modulo = parseInt(hpTxt.charAt(statNo));
            possibleIVs[statNo] = possibleIVs[statNo].filter(iv => (iv % 2) == modulo);
        }
    }
    //console.log(possibleIVs);

    // Filter values depending on given stats
    //console.log("Filter values depending on given stats");
    for (let summaryNo = 0; summaryNo < statMatrix.length; summaryNo++) {
        //console.log(`HP stat ${statMatrix[summaryNo][0]} at level ${statMatrix[summaryNo][6]}`);
        hpFrm = hp_frame(statMatrix[summaryNo][0], bstMap.get(statMatrix[summaryNo][7])[0], /* level : */ statMatrix[summaryNo][6]);

        // Getting the minimum possible IV value for this stat (mostly usable in the first summary), and filtering accordingly
        minIV = hpFrm.lower - 63;
        if (possibleIVs[0][0                        ] < minIV) { possibleIVs[0] = possibleIVs[0].filter(iv => iv >= minIV); }

        // Same with the maximum possible IV value (mostly usable in the last summaries)
        maxIV = hpFrm.upper;
        if (possibleIVs[0][possibleIVs[0].length - 1] > maxIV) { possibleIVs[0] = possibleIVs[0].filter(iv => iv <= maxIV); }

        //console.log(possibleIVs);


        for (let statNo = 1; statNo < 6; statNo++) {
            //console.log(`${allstats[statNo]} stat ${statMatrix[summaryNo][statNo]} at level ${statMatrix[summaryNo][6]}`);
            statFrm = other_frame(statMatrix[summaryNo][statNo], bstMap.get(statMatrix[summaryNo][7])[statNo], /* level : */ statMatrix[summaryNo][6], nature[statNo]);
            //console.log(statFrm);

            // Getting the minimum possible IV value for this stat (mostly usable in the first summary), and filtering accordingly
            minIV = statFrm.lower - 63;
            if (possibleIVs[statNo][0                             ] < minIV) { possibleIVs[statNo] = possibleIVs[statNo].filter(iv => iv >= minIV); }

            // Same with the maximum possible IV value (mostly usable in the last summaries)
            maxIV = statFrm.upper;
            if (possibleIVs[statNo][possibleIVs[statNo].length - 1] > maxIV) { possibleIVs[statNo] = possibleIVs[statNo].filter(iv => iv <= maxIV); }

            //console.log(possibleIVs);
        }
    }

    if (carac!=null) {
        //console.log("Filter values depending on characteristics - round 2");
        maxVal = possibleIVs[carac.statNo][possibleIVs[carac.statNo].length - 1];
        for (let statNo = 0; statNo < 6; statNo++) {
            possibleIVs[statNo] = possibleIVs[statNo].filter(iv => iv <= maxVal);
        }
        //console.log(possibleIVs);
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

function sum(l) {
    let s = 0;
    l.forEach(x => { s+=x; });
    return s;
}

function selectIVs(possibleIVs, stats, bsts, nature) {
    results = [];
    while (results==[] || sum(results)>510)
    results = [];
    for (let statNo=0; statNo<6; statNo++) {
        let iv = biased_draw(possibleIVs[statNo]);
        let frm = (statNo==0) ? hp_frame(stats[statNo], bsts[statNo], stats[6]) : other_frame(stats[statNo], bsts[statNo], stats[6], nature[statNo]);
        results.push({ iv: iv, ev: random_matching_ev(frm, iv) });
    }
    return results;
}

//export { hp_stat, hp_frame, other_stat, other_frame };
