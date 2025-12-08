const { getEnv, prompt } = require("../../lib/utils");
const { readGroupMessages } = require("../../lib/receiver");
const { runBasic } = require("./scenarios/basic");
const { runVIP } = require("./scenarios/vip");
const { runInventoryCheck } = require("./scenarios/inventory_check");
const { runGroupLoop } = require("./logic");

async function run(client) {
    console.log('\nPilih Skenario Mancing:');
    console.log('1. Basic');
    console.log('2. VIP');
    console.log('3. Group (Legacy)');
    console.log('4. Inventory Check');

    const choice = await prompt('Pilih skenario (1-4): ');

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
        // Legacy group logic
        const groupId = getEnv('GROUP_ID') || (await prompt('Masukkan GROUP_ID: '));
        const peer = await client.getEntity(BigInt(String(groupId)));
        const botUsername = getEnv('BOT_USERNAME') || (await prompt('Masukkan username bot untuk filter di grup: '));
        const triggerCycles = Number(getEnv('GROUP_CYCLE_CHECK', 2));
        const triggerRegSuccess = Number(getEnv('GROUP_REG_TRIGGER', 3));
        const delayMs = Number(getEnv("LOOP_DELAY_MS", 5000));

        console.log(`Threshold grup: cek inventory tiap ${triggerCycles} siklus dan setelah ${triggerRegSuccess} pendaftaran berhasil`);

        await runGroupLoop(client, peer, delayMs, { botUsername, groupId, triggerCycles, triggerRegSuccess });
    } else if (choice.trim() === '4') {
        const peerEnv = getEnv("BOT_PEER");
        const peer = peerEnv || (await prompt("Masukkan username bot/peer: "));

        await runInventoryCheck(client, peer);
    } else {
        console.log("Pilihan tidak valid.");
    }
}

module.exports = { run };
