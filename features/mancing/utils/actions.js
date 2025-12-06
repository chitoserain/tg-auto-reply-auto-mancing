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

async function processActions(client, peer, { favNums = [], musNums = [], sellNums = [] }) {
    // 1. Process Favorite and Museum actions first
    const priorityActions = [];

    for (const n of favNums) priorityActions.push({ index: n, type: 'fav' });
    for (const n of musNums) priorityActions.push({ index: n, type: 'mus' });

    // Sort by index descending to avoid shift issues within this phase
    priorityActions.sort((a, b) => b.index - a.index);

    for (const action of priorityActions) {
        await randomSleep(2000, 5000);

        if (action.type === 'fav') {
            await sendMessage(client, peer, `/favorite ${action.index}`);

            console.log(`Processed Favorite: ${action.index}`);
        } else if (action.type === 'mus') {
            await sendMessage(client, peer, `/add_museum ${action.index}`);

            console.log(`Processed Museum: ${action.index}`);
        }
    }

    // 2. Process Sell actions (Bulk Sell Remaining)
    // The user logic is: if we have 20 items and move 3 to fav/mus, we sell 1..17.
    // So we just need the COUNT of items to sell.
    const sellCount = sellNums.length;

    if (sellCount > 0) {
        await randomSleep(2000, 5000);

        // Generate array [1, 2, ..., sellCount]
        // We reverse it to be safe (e.g. 17 16 ... 1) or just 1..17?
        // The user example was "/jual 1 2 3 ... 17". The order in the command argument usually doesn't matter for bulk,
        // but let's stick to ascending 1..N as per example.
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
