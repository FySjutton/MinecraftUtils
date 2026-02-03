export var data = {
    enchants: {
        protection: {
            levelMax: "4",
            weight: "1",
            incompatible: ["blast_protection", "fire_protection", "projectile_protection"],
            items: ["helmet", "chestplate", "leggings", "boots", "turtle_shell"],
            name: "Protection"
        },
        aqua_affinity: {
            levelMax: "1",
            weight: "2",
            incompatible: [],
            items: ["helmet", "turtle_shell"],
       		name: "Aqua Affinity"
		},
        bane_of_arthropods: {
            levelMax: "5",
            weight: "1",
            incompatible: ["smite", "sharpness", "density", "breach"],
            items: ["sword", "axe", "mace", "spear"],
       		name: "Bane of Arthropods"
		},
        blast_protection: {
            levelMax: "4",
            weight: "2",
            incompatible: ["fire_protection", "protection", "projectile_protection"],
            items: ["helmet", "chestplate", "leggings", "boots", "turtle_shell"],
       		name: "Blast Protection"
		},
        channeling: {
            levelMax: "1",
            weight: "4",
            incompatible: ["riptide"],
            items: ["trident"],
       		name: "Channeling"
		},
        depth_strider: {
            levelMax: "3",
            weight: "2",
            incompatible: ["frost_walker"],
            items: ["boots"],
       		name: "Depth Strider"
		},
        efficiency: {
            levelMax: "5",
            weight: "1",
            incompatible: [],
            items: ["pickaxe", "shovel", "axe", "hoe", "shears"],
       		name: "Efficiency"
		},
        feather_falling: {
            levelMax: "4",
            weight: "1",
            incompatible: [],
            items: ["boots"],
       		name: "Falling Falling"
		},
        fire_aspect: {
            levelMax: "2",
            weight: "2",
            incompatible: [],
            items: ["sword", "mace", "spear"],
       		name: "Fire Aspect"
		},
        fire_protection: {
            levelMax: "4",
            weight: "1",
            incompatible: ["blast_protection", "protection", "projectile_protection"],
            items: ["helmet", "chestplate", "leggings", "boots", "turtle_shell"],
       		name: "Fire Aspect"
		},
        flame: {
            levelMax: "1",
            weight: "2",
            incompatible: [],
            items: ["bow"],
       		name: "Flame"
		},
        fortune: {
            levelMax: "3",
            weight: "2",
            incompatible: ["silk_touch"],
            items: ["pickaxe", "shovel", "axe", "hoe"],
       		name: "Fortune"
		},
        frost_walker: {
            levelMax: "2",
            weight: "2",
            incompatible: ["depth_strider"],
            items: ["boots"],
       		name: "Frost Walker"
		},
        impaling: {
            levelMax: "5",
            weight: "2",
            incompatible: [],
            items: ["trident"],
       		name: "Impaling"
		},
        infinity: {
            levelMax: "1",
            weight: "4",
            incompatible: ["mending"],
            items: ["bow"],
       		name: "Infinity"
		},
        knockback: {
            levelMax: "2",
            weight: "1",
            incompatible: [],
            items: ["sword", "spear"],
       		name: "Knockback"
		},
        looting: {
            levelMax: "3",
            weight: "2",
            incompatible: [],
            items: ["sword", "spear"],
       		name: "Looting"
		},
        loyalty: {
            levelMax: "3",
            weight: "1",
            incompatible: ["riptide"],
            items: ["trident"],
       		name: "Loyalty"
		},
        luck_of_the_sea: {
            levelMax: "3",
            weight: "2",
            incompatible: [],
            items: ["fishing_rod"],
       		name: "Luck of the Sea"
		},
        lunge: {
            levelMax: "3",
            weight: "1",
            incompatible: [],
            items: ["spear"],
       		name: "Lunge"
		},
        lure: {
            levelMax: "3",
            weight: "2",
            incompatible: [],
            items: ["fishing_rod"],
       		name: "Lure"
		},
        mending: {
            levelMax: "1",
            weight: "2",
            incompatible: ["infinity"],
            items: ["helmet", "chestplate", "leggings", "boots", "pickaxe", "shovel", "axe", "sword", "hoe", "brush", "fishing_rod",
                "bow", "shears", "flint_and_steel", "carrot_on_a_stick", "warped_fungus_on_a_stick", "shield", "elytra", "trident",
                "turtle_shell", "crossbow", "mace", "spear"
            ],
       		name: "Mending"
		},
        multishot: {
            levelMax: "1",
            weight: "2",
            incompatible: ["piercing"],
            items: ["crossbow"],
       		name: "Multishot"
		},
        piercing: {
            levelMax: "4",
            weight: "1",
            incompatible: ["multishot"],
            items: ["crossbow"],
       		name: "Piercing"
		},
        power: {
            levelMax: "5",
            weight: "1",
            incompatible: [],
            items: ["bow"],
       		name: "Power"
		},
        projectile_protection: {
            levelMax: "4",
            weight: "1",
            incompatible: ["protection", "blast_protection", "fire_protection"],
            items: ["helmet", "chestplate", "leggings", "boots", "turtle_shell"],
       		name: "Projectile Protection"
		},
        punch: {
            levelMax: "2",
            weight: "2",
            incompatible: [],
            items: ["bow"],
       		name: "Punch"
		},
        quick_charge: {
            levelMax: "3",
            weight: "1",
            incompatible: [],
            items: ["crossbow"],
       		name: "Quick Charge"
		},
        respiration: {
            levelMax: "3",
            weight: "2",
            incompatible: [],
            items: ["helmet", "turtle_shell"],
       		name: "Respiration"
		},
        riptide: {
            levelMax: "3",
            weight: "2",
            incompatible: ["channeling", "loyalty"],
            items: ["trident"],
       		name: "Riptide"
		},
        sharpness: {
            levelMax: "5",
            weight: "1",
            incompatible: ["bane_of_arthropods", "smite"],
            items: ["sword", "axe", "spear"],
       		name: "Sharpness"
		},
        silk_touch: {
            levelMax: "1",
            weight: "4",
            incompatible: ["fortune"],
            items: ["pickaxe", "shovel", "axe", "hoe"],
       		name: "Silk Touch"
		},
        smite: {
            levelMax: "5",
            weight: "1",
            incompatible: ["bane_of_arthropods", "sharpness", "density", "breach"],
            items: ["sword", "axe", "mace", "spear"],
       		name: "Smite"
		},
        soul_speed: {
            levelMax: "3",
            weight: "4",
            incompatible: [],
            items: ["boots"],
       		name: "Soul Speed"
		},
        sweeping_edge: {
            levelMax: "3",
            weight: "2",
            incompatible: [],
            items: ["sword"],
       		name: "Sweeping Edge"
		},
        swift_sneak: {
            levelMax: "3",
            weight: "4",
            incompatible: [],
            items: ["leggings"],
       		name: "Swift Sneak"
		},
        thorns: {
            levelMax: "3",
            weight: "4",
            incompatible: [],
            items: ["helmet", "chestplate", "leggings", "boots", "turtle_shell"],
       		name: "Thorns"
		},
        unbreaking: {
            levelMax: "3",
            weight: "1",
            incompatible: [],
            items: ["helmet", "chestplate", "leggings", "boots", "pickaxe", "shovel", "axe", "sword", "hoe", "brush", "fishing_rod",
                "bow", "shears", "flint_and_steel", "carrot_on_a_stick", "warped_fungus_on_a_stick", "shield", "elytra", "trident",
                "turtle_shell", "crossbow", "mace", "spear"
            ],
       		name: "Unbreaking"
		},
        curse_of_binding: {
            levelMax: "1",
            weight: "4",
            incompatible: [],
            items: ["helmet", "chestplate", "leggings", "boots", "elytra", "pumpkin", "helmet", "turtle_shell"],
       		name: "Curse of Binding"
		},
        curse_of_vanishing: {
            levelMax: "1",
            weight: "4",
            incompatible: [],
            items: ["helmet", "chestplate", "leggings", "boots", "pickaxe", "shovel", "axe", "sword", "hoe", "brush", "fishing_rod",
                "bow", "shears", "flint_and_steel", "carrot_on_a_stick", "warped_fungus_on_a_stick", "shield", "elytra", "pumpkin",
                "helmet", "trident", "turtle_shell", "crossbow", "mace", "spear"
            ],
       		name: "Curse of Vanishing"
		},
        density: {
            levelMax: "5",
            weight: "1",
            incompatible: ["breach", "smite", "bane_of_arthropods"],
            items: ["mace"],
       		name: "Density"
		},
        breach: {
            levelMax: "4",
            weight: "2",
            incompatible: ["density", "smite", "bane_of_arthropods"],
            items: ["mace"],
       		name: "Breach"
		},
        wind_burst: {
            levelMax: "3",
            weight: "2",
            incompatible: [],
            items: ["mace"],
       		name: "Wind Burst"
		}
    },
    items: {
        helmet: 'Helmet',
        chestplate: 'Chestplate',
        leggings: 'Leggings',
        boots: 'Boots',
        turtle_shell: 'Turtle Helmet',
        elytra: 'Elytra',

        sword: 'Sword',
        axe: 'Axe',
        mace: 'Mace',
        spear: 'Spear',

        trident: 'Trident',
        bow: 'Bow',
        crossbow: 'Crossbow',

        pickaxe: 'Pickaxe',
        shovel: 'Shovel',
        hoe: 'Hoe',
        shield: 'Shield',
        brush: 'Brush',

        fishing_rod: 'Fishing Rod',
        shears: 'Shears',
        flint_and_steel: 'Flint and Steel',
        carrot_on_a_stick: 'Carrot on a Stick',
        warped_fungus_on_a_stick: 'Warped Fungus on a Stick',
        pumpkin: 'Pumpkin',
        book: 'Book',
    }
};