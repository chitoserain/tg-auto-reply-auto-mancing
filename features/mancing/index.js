const { getEnv, prompt } = require("../../lib/utils");
const { runBasic } = require("./scenarios/basic");
const { runVIP } = require("./scenarios/vip");
const { runInventoryCheck } = require("./scenarios/inventory_check");

async function run(client) {
    console.log('\nPilih Skenario Mancing:');
    console.log('1. Basic');
    console.log('2. VIP');
    console.log('3. Inventory Check');

    const choice = await prompt('Pilih skenario (1-3): ');

    if (choice.trim() === '1') {
        const peerEnv = getEnv("BOT_PEER");
        const peer = peerEnv || (await prompt("Masukkan username bot/peer: "));

        await runBasic(client, peer);
    } else if (choice.trim() === '2') {
        const peerEnv = getEnv("BOT_PEER");
        const peer = peerEnv || (await prompt("Masukkan username bot/peer: "));

        const useBoostInput = await prompt("Gunakan Boost Strategy? (y/n): ");
        const useBoost = useBoostInput.toLowerCase() === 'y';

        await runVIP(client, peer, useBoost);
    } else if (choice.trim() === '3') {
        const peerEnv = getEnv("BOT_PEER");
        const peer = peerEnv || (await prompt("Masukkan username bot/peer: "));

        await runInventoryCheck(client, peer);
    } else {
        console.log("Pilihan tidak valid.");
    }
}

module.exports = { run };
