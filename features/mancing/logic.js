const { sendMessage } = require('../../lib/sender');
const { waitForText, waitForAnyText } = require('../../lib/receiver');

function extractNumbersForItem(text, itemNameOrRegex) {
  const lines = String(text).split(/\r?\n/);
  const re = itemNameOrRegex instanceof RegExp
    ? itemNameOrRegex
    : new RegExp(String(itemNameOrRegex).replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  const nums = [];
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    if (!re.test(line)) continue;
    const m = line.match(/^\s*(\d+)\./);
    if (m) nums.push(Number(m[1]));
  }
  return nums;
}

async function runFishing(client, peer, times = 4, opts = {}) {
  const finishRegex = /SESI MANCING SELESAI!/i;
  let regStatus = 'none';
  if (opts.botUsername && opts.groupId) {
    regStatus = await registerToGroupIfOpen(client, peer, opts.botUsername, opts.groupId);
  }
  for (let i = 0; i < times; i++) {
    console.log(`Mancing dimulai [${i + 1}/${times}]`);
    await sendMessage(client, peer, '/mancing');
    await waitForText(client, peer, finishRegex, { timeoutMs: 300000, pollIntervalMs: 2000, botUsername: opts.botUsername });
    console.log('Mancing selesai');
  }
  await sendMessage(client, peer, '/inventory');
  console.log('Membuka dan memeriksa inventory');
  const invMsg = await waitForText(client, peer, /Inventory/i, { timeoutMs: 120000, pollIntervalMs: 2000, botUsername: opts.botUsername });
  const text = invMsg.message || '';
  await applyInventoryFromText(client, peer, text);
  return { regSuccess: regStatus === 'success' };
}

module.exports = { runFishing, extractNumbersForItem };

async function runFishingLoop(client, peer, times = 4, delayMs = 5000, opts = {}) {
  let cycleCount = 0;
  let regSuccessCount = 0;
  const triggerCycles = opts.triggerCycles ?? 2;
  const triggerRegSuccess = opts.triggerRegSuccess ?? 3;
  while (true) {
    try {
      const { regSuccess } = await runFishing(client, peer, times, opts);
      cycleCount += 1;
      if (regSuccess) regSuccessCount += 1;
      if (opts.botUsername && regSuccessCount >= triggerRegSuccess && cycleCount % triggerCycles === 0) {
        await processInventoryWithBot(client, opts.botUsername);
        regSuccessCount = 0;
      }
    } catch (err) {
      console.error('Loop error:', err);
    }
    console.log('Mulai mancing lagi');
    await new Promise((r) => setTimeout(r, delayMs));
  }
}

module.exports.runFishingLoop = runFishingLoop;

async function runGroupLoop(client, groupPeer, delayMs = 5000, opts = {}) {
  const botUsername = opts.botUsername;
  const groupId = opts.groupId;
  const triggerCycles = opts.triggerCycles ?? 2;
  const triggerRegSuccess = opts.triggerRegSuccess ?? 3;
  let sessionFinishCount = 0;
  let regSuccessCount = 0;
  const finishRegex = /SESI MANCING SELESAI!/i;
  while (true) {
    try {
      const regStatus = await registerToGroupIfOpen(client, groupPeer, botUsername, groupId);
      if (regStatus === 'success') regSuccessCount += 1;
      const finished = await waitForText(client, groupPeer, finishRegex, { timeoutMs: 300000, pollIntervalMs: 2000, botUsername });
      if (finished) {
        console.log('Mancing selesai di grup');
        sessionFinishCount += 1;
      }
      if (regSuccessCount >= triggerRegSuccess && sessionFinishCount >= triggerCycles) {
        await processInventoryWithBot(client, botUsername);
        regSuccessCount = 0;
        sessionFinishCount = 0;
      }
    } catch (err) {
      console.error('Loop grup error:', err);
    }
    console.log('Menunggu pendaftaran berikutnya di grup');
    await new Promise((r) => setTimeout(r, delayMs));
  }
}

module.exports.runGroupLoop = runGroupLoop;

async function processInventoryWithBot(client, botUsername) {
  await sendMessage(client, botUsername, '/inventory');
  console.log('Membuka dan memeriksa inventory (bot pribadi)');
  const invMsg = await waitForText(client, botUsername, /Inventory/i, { timeoutMs: 120000, pollIntervalMs: 2000 });
  const text = invMsg.message || '';
  await applyInventoryFromText(client, botUsername, text);
}

async function applyInventoryFromText(client, peer, text) {
  const favoriteRegs = [
    /Trisu?la Poseidon/i,
    /Naga Laut(?!\s*Emas)/i,
    /Ubur.?ubur Alien(?!.*Kristal)/i,
    /Megalodon/i,
  ];
  const museumRegs = [
    /Naga Laut Emas/i,
    /Ubur.?ubur Alien Kristal/i,
    /Duyung Aurora/i,
    /Ratu Laut Mutiara/i,
    /Raja Atlantis/i,
    /Dewa Naga Laut/i,
  ];
  const lines = String(text).split(/\r?\n/);
  const favNums = [];
  const musNums = [];
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i];
    const m = line.match(/^\s*(\d+)\./);
    if (!m) continue;
    const num = Number(m[1]);
    if (museumRegs.some((re) => re.test(line))) {
      musNums.push(num);
    } else if (favoriteRegs.some((re) => re.test(line))) {
      favNums.push(num);
    }
  }
  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }
  for (const n of favNums) {
    await sendMessage(client, peer, `/favorite ${n}`);
    await sleep(500);
  }
  console.log(`Selesai menambahkan ${favNums.length} item ke favorite`);
  for (const n of musNums) {
    await sendMessage(client, peer, `/museum ${n}`);
    await sleep(500);
  }
  console.log(`Selesai menambahkan ${musNums.length} item ke museum`);
  await sendMessage(client, peer, '/jual semua');
  await sleep(500);
  console.log('Menjual sisa item dengan /jual semua');
}
async function registerToGroupIfOpen(client, groupPeer, botUsername, groupId) {
  try {
    const regMsg = await waitForText(client, groupPeer, /PENDAFTARAN MANCING/i, { timeoutMs: 60000, pollIntervalMs: 2000, botUsername });
    console.log('Pesan pendaftaran bot terdeteksi di grup');
    await sendMessage(client, botUsername, `/start daftar_${groupId}`);
    const result = await waitForAnyText(client, botUsername, [
      /Pendaftaran Berhasil!/i,
      /Pendaftaran Penuh!/i,
      /Pendaftaran Ditutup!/i,
      /memancing di grup lain/i,
    ], { timeoutMs: 120000, pollIntervalMs: 2000 });
    const t = String(result.message || '');
    if (/Pendaftaran Berhasil!/i.test(t)) {
      console.log('Pendaftaran bot: berhasil');
      return 'success';
    } else if (/Pendaftaran Penuh!/i.test(t)) {
      console.log('Pendaftaran bot: gagal (penuh)');
      return 'full';
    } else if (/Pendaftaran Ditutup!/i.test(t)) {
      console.log('Pendaftaran bot: gagal (ditutup)');
      return 'closed';
    } else if (/memancing di grup lain/i.test(t)) {
      console.log('Pendaftaran bot: gagal (sedang memancing di grup lain)');
      return 'busy';
    } else {
      console.log('Pendaftaran bot: pesan tidak dikenal');
      return 'unknown';
    }
  } catch (e) {
    // diam jika tidak ada pendaftaran
    return 'none';
  }
}
