const { sleep } = require("../../../lib/utils");
const { checkInventory, processActions } = require("../utils/actions");

async function runInventoryCheck(client, peer) {
    console.log("[Inventory Check] Starting Inventory Check Loop...");
    let pageCount = 0;

    while (true) {
        pageCount++;
        console.log(`[Inventory Check] Checking Page/Batch #${pageCount}`);

        const { favNums, sellNums } = await checkInventory(client, peer);
        const totalItems = favNums.length + sellNums.length;

        console.log(`[Inventory Check] Found ${totalItems} items.`);

        await processActions(client, peer, { favNums, sellNums });

        if (totalItems < 20) {
            console.log("[Inventory Check] Less than 20 items found. Inventory cleared/processed. Stopping.");
            break;
        }

        console.log("[Inventory Check] 20 items found (Full Page). Continuing to next batch...");
        await sleep(2000);
    }
}

module.exports = { runInventoryCheck };
