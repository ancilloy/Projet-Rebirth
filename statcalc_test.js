//import { hp_stat, hp_frame, other_stat, other_frame } from "./modules/statcalc.mjs";

let datapoints = [
    {
        name : "Bleuette",
        lvl : 28,
        hp : { stat :  83, base :  70, iv : 20, ev :   5 },
        other_stats : [
            { stat :  39, base :  60, iv : 20, ev :  11, nature: 0.9 },
            { stat :  52, base :  75, iv : 20, ev :   2, nature: 1   },
            { stat :  82, base : 110, iv : 31, ev :   4, nature: 1.1 },
            { stat :  52, base :  75, iv : 20, ev :   1, nature: 1   },
            { stat :  62, base :  90, iv : 20, ev :  29, nature: 1   }
        ]
    },
    {
        name : "Moria",
        lvl : 29,
        hp : { stat :  75, base :  60, iv :  1, ev :  22 },
        other_stats : [
            { stat :  61, base :  85, iv : 20, ev :  23, nature: 1   },
            { stat :  31, base :  40, iv :  9, ev :  13, nature: 1   },
            { stat :  31, base :  30, iv : 31, ev :   2, nature: 1   },
            { stat :  33, base :  45, iv :  7, ev :   0, nature: 1   },
            { stat :  48, base :  68, iv :  6, ev :  39, nature: 1   }
        ]
    }
];

datapoints.forEach(poke => {
    let c_hp = hp_stat(poke.hp.base, poke.hp.iv, poke.hp.ev, poke.lvl);
    if (c_hp != poke.hp.stat) {
        console.log(`Erreur dans le calcul de la stat de PV de ${poke.name} au niveau ${poke.lvl}.`);
        console.log(poke.hp);
        console.log(`Valeur calculée : ${c_hp}`);
    }

    let c_hp_frame = hp_frame(poke.hp.stat, poke.hp.base, poke.hp.iv, poke.lvl);
    if (c_hp_frame.lower > poke.hp.ev || c_hp_frame.upper <= poke.hp.ev) {
        console.log(`Erreur dans le calcul de la frame de PV de ${poke.name} au niveau ${poke.lvl}.`);
        console.log(poke.hp);
        console.log(`Frame calculée :`);
        console.log(c_hp_frame);
    }

    poke.other_stats.forEach(s => {
        let c_stat = other_stat(s.base, s.iv, s.ev, poke.lvl, s.nature);
        if (c_stat != s.stat) {
            console.log(`Erreur dans le calcul de la stat de ${poke.name} au niveau ${poke.lvl}.`);
            console.log(s);
            console.log(`Valeur calculée : ${c_stat}`);
        }

        let c_stat_frame = other_frame(s.stat, s.base, s.iv, poke.lvl, s.nature);
        if (c_stat_frame.lower > s.ev || c_stat_frame.upper <= s.ev) {
            console.log(`Erreur dans le calcul de la frame de stat de ${poke.name} au niveau ${poke.lvl}.`);
            console.log(s);
            console.log(`Frame calculée :`);
            console.log(c_stat_frame);
        }
    });
});
