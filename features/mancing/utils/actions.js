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

async function processActions(client, peer, { favNums = [], sellNums = [] }) {
    const priorityActions = [];

    for (const n of favNums) priorityActions.push({ index: n, type: 'fav' });

    priorityActions.sort((a, b) => b.index - a.index);

    for (const action of priorityActions) {
        await randomSleep(2000, 5000);

        if (action.type === 'fav') {
            await sendMessage(client, peer, `/favorite ${action.index}`);

            console.log(`Processed Favorite: ${action.index}`);
        }
    }

    const sellCount = sellNums.length;

    if (sellCount > 0) {
        await randomSleep(2000, 5000);

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

async function extractTrisula(client, peer) {
    return extractItem(client, peer, "Trisula Poseidon", /Extract Trisula/i);
}

async function extractKotakCoklat(client, peer) {
    return extractItem(client, peer, "Kotak Coklat", /Extract Coklat/i);
}

async function extractItem(client, peer, itemName, buttonRegex) {
    console.log(`\n[Extraction] Found ${itemName}! Initiating extraction...`);

    await randomSleep(2000, 5000);
    await sendMessage(client, peer, "/extract");

    try {
        const msg = await waitForText(client, peer, /EXTRACT - MATERIALS/i, { timeoutMs: 60000 });

        if (msg && msg.buttons) {
            const allButtons = msg.buttons.flat();
            const extractBtn = allButtons.find(btn => btn.text && buttonRegex.test(btn.text));

            if (extractBtn) {
                extractBtn.client = client;

                await extractBtn.click({ sharePhone: false });

                let confirmMsg = null;

                for (let k = 0; k < 15; k++) {
                    await sleep(2000);

                    const msgs = await client.getMessages(peer, { limit: 1 });

                    if (msgs && msgs.length > 0) {
                        if (/KONFIRMASI EXTRACT/i.test(msgs[0].message) || /Apakah kamu yakin/i.test(msgs[0].message)) {
                            confirmMsg = msgs[0];

                            break;
                        }
                    }
                }

                if (confirmMsg && confirmMsg.buttons) {
                    const cButtons = confirmMsg.buttons.flat();
                    const confirmBtn = cButtons.find(b => b.text && /Ya, Extract Semua/i.test(b.text));

                    if (confirmBtn) {
                        confirmBtn.client = client;

                        await confirmBtn.click({ sharePhone: false });
                    } else {
                        console.error(`[Extraction] Confirmation button 'Ya, Extract Semua' not found for ${itemName}.`);
                    }
                } else {
                    console.error(`[Extraction] Confirmation dialog timed out or no buttons for ${itemName}.`);
                }
            } else {
                console.error(`[Extraction] '${buttonRegex}' button not found in options for ${itemName}.`);
            }
        } else {
            console.error(`[Extraction] No buttons found in extract menu for ${itemName}.`);
        }
    } catch (e) {
        console.error(`[Extraction] Error during extraction of ${itemName}: ${e.message}`);
    }
}

module.exports = {
    sendMancing,
    checkInventory,
    processActions,
    sellAll,
    extractTrisula,
    extractKotakCoklat,
};
