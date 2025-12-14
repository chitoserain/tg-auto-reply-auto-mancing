const { getEnv, prompt } = require("../../lib/utils");
const { runBasic } = require("./scenarios/basic");
const { runVIP } = require("./scenarios/vip");
const { runInventoryCheck } = require("./scenarios/inventory_check");

async function run(client) {
    const peer = await selectBot();

    console.log('\nPilih Skenario Mancing:');
    console.log('1. Basic');
    console.log('2. VIP');
    console.log('3. Inventory Check');

    const choice = await prompt('Pilih skenario (1-3): ');

    if (choice.trim() === '1') {
        await runBasic(client, peer);
    } else if (choice.trim() === '2') {
        const useBoostInput = await prompt("Gunakan Boost Strategy? (y/n): ");
        const useBoost = useBoostInput.toLowerCase() === 'y';

        await runVIP(client, peer, useBoost);
    } else if (choice.trim() === '3') {
        await runInventoryCheck(client, peer);
    } else {
        console.log("Pilihan tidak valid.");
    }
}

async function selectBot() {
    const peerEnv = getEnv("BOT_PEER");

    if (!peerEnv) {
        return await prompt("Masukkan username bot/peer: ");
    }

    const bots = peerEnv.split(',').map(b => b.trim()).filter(b => b);

    if (bots.length === 0) {
        return await prompt("Masukkan username bot/peer: ");
    }

    if (bots.length === 1) {
        return bots[0];
    }

    console.log('\nPilih Bot:');
    bots.forEach((bot, index) => {
        console.log(`${index + 1}. ${bot}`);
    });

    const choice = await prompt(`Pilih bot (1-${bots.length}): `);
    const index = Number(choice) - 1;

    if (index >= 0 && index < bots.length) {
        return bots[index];
    }

    console.log("Pilihan tidak valid, menggunakan bot pertama.");
    return bots[0];
}

module.exports = { run };
