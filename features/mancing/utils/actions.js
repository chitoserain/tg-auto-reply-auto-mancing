const { sendMessage } = require("../../../lib/sender");
const { waitForText } = require("../../../lib/receiver");
const { sleep, randomSleep } = require("../../../lib/utils");
const { parseInventory } = require("./parsing");

async function sendMancing(client, peer) {
    await randomSleep(2000, 5000);
    await sendMessage(client, peer, "/mancing");
}

async function checkInventory(client, peer) {
    await randomSleep(2000, 5000);
    await sendMessage(client, peer, "/inventory");

    const invMsg = await waitForText(client, peer, /Inventory/i, { timeoutMs: 120000 });

    return parseInventory(invMsg.message || "");
}

async function processActions(client, peer, { favNums = [], sellNums = [] }) {
    const priorityActions = [];

    for (const n of favNums) priorityActions.push({ index: n, type: 'fav' });

    priorityActions.sort((a, b) => b.index - a.index);

    for (const action of priorityActions) {
        await randomSleep(2000, 5000);

        if (action.type === 'fav') {
            await sendMessage(client, peer, `/favorite ${action.index}`);

            console.log(`Processed Favorite: ${action.index}`);
        }
    }

    const sellCount = sellNums.length;

    if (sellCount > 0) {
        await randomSleep(2000, 5000);

        const indicesToSell = Array.from({ length: sellCount }, (_, i) => i + 1);
        const cmd = `/jual ${indicesToSell.join(' ')}`;

        await sendMessage(client, peer, cmd);

        console.log(`Processed Bulk Sell: 1 to ${sellCount}`);
    }
}

async function sellAll(client, peer) {
    await randomSleep(2000, 5000);
    await sendMessage(client, peer, "/jual semua");

    console.log("Sold all remaining items.");
}

module.exports = {
    sendMancing,
    checkInventory,
    processActions,
    sellAll,
};
