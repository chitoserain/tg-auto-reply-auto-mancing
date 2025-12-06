const { FAVORITE_ITEMS, MUSEUM_ITEMS } = require("../data/items");

function parseInventory(text) {
    const lines = String(text).split(/\r?\n/);
    const favNums = [];
    const musNums = [];
    const otherNums = [];

    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i];
        const m = line.match(/^\s*(\d+)\./);
        if (!m) continue;
        const num = Number(m[1]);

        if (MUSEUM_ITEMS.some((re) => re.test(line))) {
            musNums.push(num);
        } else if (FAVORITE_ITEMS.some((re) => re.test(line))) {
            favNums.push(num);
        } else {
            otherNums.push(num);
        }
    }

    return { favNums, musNums, otherNums };
}

function parseFavorite(text) {
    const lines = String(text).split(/\r?\n/);
    const trisulaIndices = [];

    for (const line of lines) {
        // Match lines like "1. 🔱 Trisula Poseidon"
        // We look for the number at the start and "Trisula Poseidon" in the text
        const m = line.match(/^\s*(\d+)\.\s+.*Trisula Poseidon/i);
        if (m) {
            trisulaIndices.push(Number(m[1]));
        }
    }
    return trisulaIndices;
}

module.exports = {
    parseInventory,
    parseFavorite,
};
