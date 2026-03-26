export const getCardTier = (user) => {
    if (!user) return 'locked';

    const { gamesPlayed = 0, averageRating = 0, profileCompleted } = user;

    // Locked card if profile incomplete
    if (!profileCompleted && !user.avatar) {
        return 'locked';
    }

    // Gold: 50+ games OR 4.5+ rating
    if (gamesPlayed >= 50 || averageRating >= 4.5) {
        return 'gold';
    }

    // Silver: 10+ games played
    if (gamesPlayed >= 10) {
        return 'silver';
    }

    // Bronze: default for complete profiles
    return 'bronze';
};

export const calculateStats = (user) => {
    if (!user) return { pac: 0, sho: 0, pas: 0, dri: 0, def: 0, phy: 0 };

    const {
        speedRating = 50,
        attackRating = 50,
        defenseRating = 50,
        staminaRating = 50,
        gamesPlayed = 0,
        totalGoals = 0,
        totalAssists = 0,
        averageRating = 0
    } = user;

    // Scale 0-100 internal ratings to 1-99 FIFA style
    const scale = (value) => Math.max(1, Math.min(99, Math.round(value * 0.99)));

    // Calculate shooting based on goals per game
    const goalsPerGame = gamesPlayed > 0 ? (totalGoals / gamesPlayed) : 0;
    const shooting = Math.min(99, 40 + (goalsPerGame * 20) + (attackRating * 0.4));

    // Calculate passing based on assists per game
    const assistsPerGame = gamesPlayed > 0 ? (totalAssists / gamesPlayed) : 0;
    const passing = Math.min(99, 40 + (assistsPerGame * 25) + (attackRating * 0.4));

    return {
        pac: scale(speedRating),
        sho: Math.round(shooting),
        pas: Math.round(passing),
        dri: scale((attackRating + speedRating) / 2),
        def: scale(defenseRating),
        phy: scale(staminaRating)
    };
};

export const calculateOverall = (stats, position) => {
    let overall;

    switch (position?.toUpperCase()) {
        case 'GK':
            overall = (stats.def * 0.4) + (stats.phy * 0.3) + (stats.pas * 0.2) + (stats.pac * 0.1);
            break;
        case 'DEF':
            overall = (stats.def * 0.35) + (stats.phy * 0.25) + (stats.pac * 0.2) + (stats.pas * 0.2);
            break;
        case 'MID':
            overall = (stats.pas * 0.3) + (stats.dri * 0.25) + (stats.def * 0.2) + (stats.phy * 0.15) + (stats.pac * 0.1);
            break;
        case 'FWD':
            overall = (stats.sho * 0.35) + (stats.pac * 0.25) + (stats.dri * 0.25) + (stats.pas * 0.15);
            break;
        default:
            overall = (stats.pac + stats.sho + stats.pas + stats.dri + stats.def + stats.phy) / 6;
    }

    return Math.max(40, Math.min(99, Math.round(overall)));
};
