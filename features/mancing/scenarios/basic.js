const { waitForText, waitForAnyText } = require("../../../lib/receiver");
const { sleep, getEnv } = require("../../../lib/utils");
const { sendMancing, checkInventory, processActions } = require("../utils/actions");

async function runBasic(client, peer) {
    const finishRegex = /SESI MANCING SELESAI!/i;
    const fullRegex = /Inventory.*Penuh/i;

    const fishingTimes = Number(getEnv("FISHING_TIMES", 4));
    const inventoryCheckCount = Number(getEnv("INVENTORY_CHECK", 1));

    const timeoutMs = Number(getEnv("FISHING_TIMEOUT_MS", 330000));
    const maxRetries = Number(getEnv("MAX_TIMEOUT_RETRIES", 3));

    let count = 0;
    let timeoutRetries = 0;

    while (true) {
        count++;

        console.log(`\n[Basic] Mancing #${count} `);

        await sendMancing(client, peer);

        try {
            const result = await waitForAnyText(client, peer, [finishRegex, fullRegex], { timeoutMs });

            timeoutRetries = 0;

            if (fullRegex.test(result.message)) {
                console.log("[Basic] Inventory Full detected! Stopping program.");

                break;
            }
        } catch (e) {
            timeoutRetries++;

            console.error(`[Basic] Timeout waiting for response (${timeoutMs}ms). Retry ${timeoutRetries}/${maxRetries}...`);

            if (timeoutRetries >= maxRetries) {
                console.error("[Basic] Max retries reached. Stopping program.");

                break;
            }

            continue;
        }

        if (count % fishingTimes === 0) {
            console.log("[Basic] Checking inventory...");

            for (let i = 0; i < inventoryCheckCount; i++) {
                const { favNums, musNums, otherNums } = await checkInventory(client, peer);

                await processActions(client, peer, { favNums, musNums, sellNums: otherNums });

                if (inventoryCheckCount > 1) await sleep(2000);
            }
        } else {
            console.log(`[Basic] Mancing finished. Next cast immediately.`);
        }
    }
}

module.exports = { runBasic };
