const { waitForAnyText } = require("../../../lib/receiver");
const { sleep, getEnv, randomSleep } = require("../../../lib/utils");
const { sendMancing, checkInventory, processActions } = require("../utils/actions");
const { sendMessage } = require("../../../lib/sender");
const { cleanInventoryLoop } = require("./inventory_check");

async function runVIP(client, primaryPeer, backupPeer = null, useBoost = false) {
    const finishRegex = /SESI MANCING SELESAI!/i;
    const fullRegex = /Inventory.*Penuh/i;

    const fishingTimes = Number(getEnv("VIP_FISHING_TIMES", 1));
    const inventoryCheckCount = Number(getEnv("VIP_INVENTORY_CHECK", 2));

    const timeoutMs = Number(getEnv("FISHING_TIMEOUT_MS", 600000));
    const maxRetries = Number(getEnv("MAX_TIMEOUT_RETRIES", 3));

    let currentPeer = primaryPeer;
    let count = 0;
    let timeoutRetries = 0;

    while (true) {
        count++;

        console.log(`\n[VIP] Mancing #${count} (${currentPeer})`);

        await sendMancing(client, currentPeer);

        if (useBoost) {
            await handleBoostStrategy(client, currentPeer);
        }

        try {
            const result = await waitForAnyText(client, currentPeer, [finishRegex, fullRegex], { timeoutMs });

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
                if (backupPeer && currentPeer !== backupPeer) {
                    console.log(`[VIP] Primary bot (${currentPeer}) unresponsive. Switching to Backup Bot (${backupPeer})...`);

                    currentPeer = backupPeer;
                    timeoutRetries = 0;

                    continue;
                }

                console.error("[VIP] Max retries reached and no backup available. Stopping program.");

                break;
            }

            continue;
        }

        console.log(`[VIP] Checking inventory (${inventoryCheckCount} cycles)...`);

        for (let i = 0; i < inventoryCheckCount; i++) {
            console.log(`[VIP] Post-Fishing Check [${i + 1}/${inventoryCheckCount}]`);

            try {
                const { favNums, otherNums } = await checkInventory(client, currentPeer);

                await processActions(client, currentPeer, { favNums, sellNums: otherNums });
            } catch (e) {
                console.error(`[VIP] Error during inventory check: ${e.message}. Skipping this check.`);
            }

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
