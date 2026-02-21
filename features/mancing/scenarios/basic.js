const { waitForAnyText } = require("../../../lib/receiver");
const { sleep, getEnv } = require("../../../lib/utils");
const { sendMancing, checkInventory, processActions, extractTrisula } = require("../utils/actions");
const { cleanInventoryLoop } = require("./inventory_check");
const { handleVerification } = require("../utils/verification");

async function runBasic(client, primaryPeer, backupPeer = null) {
    const finishRegex = /SESI MANCING SELESAI!/i;
    const fullRegex = /Inventory.*Penuh/i;
    const verificationRegex = /Verifikasi keamanan/i;

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
            const result = await waitForAnyText(client, currentPeer, [finishRegex, fullRegex, verificationRegex], { timeoutMs });

            timeoutRetries = 0;

            if (fullRegex.test(result.message)) {
                console.log("[Basic] Inventory Full detected! Switching to Inventory Cleaning Loop...");

                await cleanInventoryLoop(client, currentPeer);

                continue;
            }

            if (verificationRegex.test(result.message)) {
                await handleVerification(client, currentPeer, result);
                continue;
            }
        } catch (e) {
            timeoutRetries++;

            console.error(`[Basic] Timeout waiting for response (${timeoutMs}ms). Retry ${timeoutRetries}/${maxRetries}...`);

            if (timeoutRetries >= maxRetries) {
                if (backupPeer) {
                    const nextPeer = (currentPeer === primaryPeer) ? backupPeer : primaryPeer;
                    const role = (nextPeer === primaryPeer) ? "Primary" : "Backup";

                    console.log(`[Basic] Max retries reached on ${currentPeer}. Switching to ${role} Bot (${nextPeer})...`);

                    currentPeer = nextPeer;
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
                    const { favNums, otherNums, hasTrisula } = await checkInventory(client, currentPeer);

                    if (hasTrisula) {
                        console.log("[Basic] Trisula Poseidon detected! Pausing check to extract...");

                        await extractTrisula(client, currentPeer);

                        console.log("[Basic] Extraction done. Restarting inventory check for accuracy...");

                        i--;

                        continue;
                    }

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
