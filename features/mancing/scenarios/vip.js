const { waitForText, waitForAnyText } = require("../../../lib/receiver");
const { sleep, getEnv, randomSleep } = require("../../../lib/utils");
const { sendMancing, checkInventory, processActions } = require("../utils/actions");
const { sendMessage } = require("../../../lib/sender");
const { parseFavorite } = require("../utils/parsing");

async function runVIP(client, peer, useBoost = false) {
    const finishRegex = /SESI MANCING SELESAI!/i;
    const fullRegex = /Inventory.*Penuh/i;

    const fishingTimes = Number(getEnv("VIP_FISHING_TIMES", 1));
    const inventoryCheckCount = Number(getEnv("VIP_INVENTORY_CHECK", 2));

    let count = 0;

    while (true) {
        count++;

        console.log(`\n[VIP] Mancing #${count}`);

        await sendMancing(client, peer);

        // Execute Boost Strategy if enabled
        if (useBoost) {
            await handleBoostStrategy(client, peer);
        }

        try {
            const result = await waitForAnyText(client, peer, [finishRegex, fullRegex], { timeoutMs: 600000 });

            if (fullRegex.test(result.message)) {
                console.log("[VIP] Inventory Full detected! Stopping program.");

                break;
            }
        } catch (e) {
            console.error("Timeout waiting for finish message. Stopping.");

            break;
        }

        console.log(`[VIP] Checking inventory (${inventoryCheckCount} cycles)...`);

        for (let i = 0; i < inventoryCheckCount; i++) {
            console.log(`[VIP] Post-Fishing Check [${i + 1}/${inventoryCheckCount}]`);

            const { favNums, musNums, otherNums } = await checkInventory(client, peer);

            await processActions(client, peer, { favNums, musNums, sellNums: otherNums });

            if (i < inventoryCheckCount - 1) await sleep(2000);
        }
    }
}

async function handleBoostStrategy(client, peer) {
    console.log("[VIP] Executing Boost Strategy...");
    await randomSleep(2000, 4000);
    await sendMessage(client, peer, "/favorite");

    try {
        const favMsg = await waitForText(client, peer, /Favorite/i, { timeoutMs: 60000 });
        const trisulaIndices = parseFavorite(favMsg.message || "");

        // Sort descending to get the bottom-most items (highest indices)
        // This avoids index shifting issues when removing items
        trisulaIndices.sort((a, b) => b - a);

        // Take top 2 (which are the largest indices)
        const toRetrieve = trisulaIndices.slice(0, 2);

        // We strictly need 2 items to proceed with the strategy
        if (toRetrieve.length === 2) {
            console.log(`[VIP] Retrieving 2 Trisula Poseidon from favorites (Bottom-up): ${toRetrieve.join(", ")}`);

            for (const index of toRetrieve) {
                await randomSleep(2000, 4000);
                await sendMessage(client, peer, `/unfavorite ${index}`);
            }

            await randomSleep(2000, 4000);
            await sendMessage(client, peer, "/boost");
            console.log("[VIP] Boost activated!");
        } else {
            console.log(`[VIP] Not enough Trisula Poseidon found (Found: ${toRetrieve.length}). Skipping boost.`);
        }
    } catch (e) {
        console.error("[VIP] Error in boost strategy:", e);
    }
}

module.exports = { runVIP };
