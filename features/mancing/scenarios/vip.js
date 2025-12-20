const { waitForAnyText } = require("../../../lib/receiver");
const { sleep, getEnv, randomSleep } = require("../../../lib/utils");
const { sendMancing, checkInventory, processActions } = require("../utils/actions");
const { sendMessage } = require("../../../lib/sender");
const { cleanInventoryLoop } = require("./inventory_check");


async function runVIP(client, peer, useBoost = false) {
    const finishRegex = /SESI MANCING SELESAI!/i;
    const fullRegex = /Inventory.*Penuh/i;

    const fishingTimes = Number(getEnv("VIP_FISHING_TIMES", 1));
    const inventoryCheckCount = Number(getEnv("VIP_INVENTORY_CHECK", 2));

    const timeoutMs = Number(getEnv("FISHING_TIMEOUT_MS", 600000));
    const maxRetries = Number(getEnv("MAX_TIMEOUT_RETRIES", 3));

    let count = 0;
    let timeoutRetries = 0;

    while (true) {
        count++;

        console.log(`\n[VIP] Mancing #${count}`);

        await sendMancing(client, peer);

        if (useBoost) {
            await handleBoostStrategy(client, peer);
        }

        try {
            const result = await waitForAnyText(client, peer, [finishRegex, fullRegex], { timeoutMs });

            timeoutRetries = 0;

            if (fullRegex.test(result.message)) {
                console.log("[VIP] Inventory Full detected! Switching to Inventory Cleaning Loop...");

                await cleanInventoryLoop(client, currentPeer);

                continue;
            }
        } catch (e) {
            timeoutRetries++;

            console.error(`[VIP] Timeout waiting for response (${timeoutMs}ms). Retry ${timeoutRetries}/${maxRetries}...`);

            if (timeoutRetries >= maxRetries) {
                console.error("[VIP] Max retries reached. Stopping program.");

                break;
            }

            continue;
        }

        console.log(`[VIP] Checking inventory (${inventoryCheckCount} cycles)...`);

        for (let i = 0; i < inventoryCheckCount; i++) {
            console.log(`[VIP] Post-Fishing Check [${i + 1}/${inventoryCheckCount}]`);

            const { favNums, otherNums } = await checkInventory(client, peer);

            await processActions(client, peer, { favNums, sellNums: otherNums });

            if (i < inventoryCheckCount - 1) await sleep(2000);
        }
    }
}

async function handleBoostStrategy(client, peer) {
    console.log("[VIP] Executing Boost Strategy...");

    await randomSleep(2000, 4000);
    await sendMessage(client, peer, "/boost");

    console.log("[VIP] Boost activated!");
}

module.exports = { runVIP };
