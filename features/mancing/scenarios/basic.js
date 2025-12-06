const { waitForText, waitForAnyText } = require("../../../lib/receiver");
const { sleep, getEnv } = require("../../../lib/utils");
const { sendMancing, checkInventory, processActions, sellAll } = require("../utils/actions");

async function runBasic(client, peer) {
    const finishRegex = /SESI MANCING SELESAI!/i;
    const fullRegex = /Inventory.*Penuh/i;

    const fishingTimes = Number(getEnv("FISHING_TIMES", 4));
    const inventoryCheckCount = Number(getEnv("INVENTORY_CHECK", 1));

    let count = 0;

    while (true) {
        count++;

        console.log(`\n[Basic] Mancing #${count} `);

        await sendMancing(client, peer);

        try {
            const result = await waitForAnyText(client, peer, [finishRegex, fullRegex], { timeoutMs: 300000 });

            if (fullRegex.test(result.message)) {
                console.log("[Basic] Inventory Full detected! Stopping program.");

                break;
            }
        } catch (e) {
            console.error("Timeout waiting for finish message. Stopping.");

            break;
        }

        if (count % fishingTimes === 0) {
            console.log("[Basic] Checking inventory...");

            for (let i = 0; i < inventoryCheckCount; i++) {
                const { favNums, musNums } = await checkInventory(client, peer);

                await processActions(client, peer, { favNums, musNums });
                await sellAll(client, peer);

                if (inventoryCheckCount > 1) await sleep(2000);
            }
        } else {
            console.log(`[Basic] Mancing finished. Next cast immediately.`);
        }
    }
}

module.exports = { runBasic };
