const { FAVORITE_ITEMS } = require("../data/items");

function parseInventory(text) {
    const lines = String(text).split(/\r?\n/);
    const favNums = [];
    const otherNums = [];

    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i];
        const m = line.match(/^\s*(\d+)\./);
        if (!m) continue;
        const num = Number(m[1]);

        if (FAVORITE_ITEMS.some((re) => re.test(line))) {
            favNums.push(num);
        } else {
            otherNums.push(num);
        }
    }

    return { favNums, otherNums };
}

function parseFavorite(text) {
    const lines = String(text).split(/\r?\n/);
    const trisulaIndices = [];

    for (const line of lines) {
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
