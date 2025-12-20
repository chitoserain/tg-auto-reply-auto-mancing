const { waitForAnyText } = require("../../../lib/receiver");
const { sleep, getEnv } = require("../../../lib/utils");
const { sendMancing, checkInventory, processActions } = require("../utils/actions");
const { cleanInventoryLoop } = require("./inventory_check");

async function runBasic(client, primaryPeer, backupPeer = null) {
    const finishRegex = /SESI MANCING SELESAI!/i;
    const fullRegex = /Inventory.*Penuh/i;

    const fishingTimes = Number(getEnv("FISHING_TIMES", 4));
    const inventoryCheckCount = Number(getEnv("INVENTORY_CHECK", 1));

    const timeoutMs = Number(getEnv("FISHING_TIMEOUT_MS", 600000));
    const maxRetries = Number(getEnv("MAX_TIMEOUT_RETRIES", 3));

    let currentPeer = primaryPeer;
    let count = 0;
    let timeoutRetries = 0;

    while (true) {
        count++;

        console.log(`\n[Basic] Mancing #${count} (${currentPeer})`);

        await sendMancing(client, currentPeer);

        try {
            const result = await waitForAnyText(client, currentPeer, [finishRegex, fullRegex], { timeoutMs });

            timeoutRetries = 0;

            if (fullRegex.test(result.message)) {
                console.log("[Basic] Inventory Full detected! Switching to Inventory Cleaning Loop...");

                await cleanInventoryLoop(client, currentPeer);

                continue;
            }
        } catch (e) {
            timeoutRetries++;

            console.error(`[Basic] Timeout waiting for response (${timeoutMs}ms). Retry ${timeoutRetries}/${maxRetries}...`);

            if (timeoutRetries >= maxRetries) {
                if (backupPeer && currentPeer !== backupPeer) {
                    console.log(`[Basic] Primary bot (${currentPeer}) unresponsive. Switching to Backup Bot (${backupPeer})...`);
    
                    currentPeer = backupPeer;
                    timeoutRetries = 0;

                    continue;
                }

                console.error("[Basic] Max retries reached and no backup available. Stopping program.");

                break;
            }

            continue;
        }

        if (count % fishingTimes === 0) {
            console.log("[Basic] Checking inventory...");

            for (let i = 0; i < inventoryCheckCount; i++) {
                try {
                    const { favNums, otherNums } = await checkInventory(client, currentPeer);

                    await processActions(client, currentPeer, { favNums, sellNums: otherNums });
                } catch (e) {
                    console.error(`[Basic] Error during inventory check: ${e.message}. Skipping this check.`);
                }

                if (inventoryCheckCount > 1) await sleep(2000);
            }
        } else {
            console.log(`[Basic] Mancing finished. Next cast immediately.`);
        }
    }
}

module.exports = { runBasic };
