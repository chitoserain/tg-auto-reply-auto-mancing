const { sleep } = require("../../../lib/utils");
const { checkInventory, processActions } = require("../utils/actions");

async function cleanInventoryLoop(client, peer) {
    console.log("[Inventory Check] Starting Inventory Cleaning Loop...");
    let pageCount = 0;

    while (true) {
        pageCount++;
        console.log(`[Inventory Check] Checking Page/Batch #${pageCount}`);

        const { favNums, otherNums } = await checkInventory(client, peer);
        const sellNums = otherNums;
        const totalItems = favNums.length + sellNums.length;

        console.log(`[Inventory Check] Found ${totalItems} items.`);

        await processActions(client, peer, { favNums, sellNums });

        if (totalItems < 20) {
            console.log("[Inventory Check] Less than 20 items found. Inventory cleared/processed.");

            break;
        }

        console.log("[Inventory Check] 20 items found (Full Page). Continuing to next batch...");
        await sleep(2000);
    }
}

async function runInventoryCheck(client, peer) {
    await cleanInventoryLoop(client, peer);

    console.log("[Inventory Check] Script Finished. Exiting.");

    process.exit(0);
}

module.exports = { runInventoryCheck, cleanInventoryLoop };
