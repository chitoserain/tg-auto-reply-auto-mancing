const { sendMessage } = require("../../../lib/sender");
const { waitForText } = require("../../../lib/receiver");
const { prompt, sleep, randomSleep } = require("../../../lib/utils");

async function runBuyUmpan(client, peer) {
    console.log("\n[Buy Umpan] Memulai skenario beli umpan...");

    const countInput = await prompt("Berapa kali beli umpan? ");
    const count = parseInt(countInput);

    if (isNaN(count) || count <= 0) {
        console.log("Input tidak valid. Membatalkan.");
        return;
    }

    const baitName = "Umpan Celestial";
    console.log(
        `\n[Buy Umpan] Akan membeli '${baitName}' sebanyak ${count} kali (Qty: 10x per transaksi).`
    );

    const equipInput = await prompt(
        "Apakah umpan mau dipakai langsung setelah beli? (y/n): "
    );
    const shouldEquip = equipInput.toLowerCase().trim() === "y";

    let totalCoins = 0;
    let totalBait = 0;

    for (let i = 1; i <= count; i++) {
        console.log(`\n[Buy Umpan] Transaksi ke-${i} dari ${count}...`);

        try {
            await randomSleep(2000, 4000);

            if (i === 1) {
                await sendMessage(client, peer, "/shop");

                const shopMsg = await waitForText(
                    client,
                    peer,
                    /Toko Peralatan Memancing/i,
                    { timeoutMs: 30000 }
                );

                if (!shopMsg || !shopMsg.buttons) {
                    throw new Error("Gagal membuka toko.");
                }

                const allButtons = shopMsg.buttons.flat();
                const umpanBtn = allButtons.find(
                    (b) => b.text && /Umpan/i.test(b.text)
                );

                if (!umpanBtn) {
                    throw new Error("Tombol 'Umpan' tidak ditemukan.");
                }

                // console.log("[Buy Umpan] Klik tombol 'Umpan'...");
                umpanBtn.client = client;

                await umpanBtn.click({ sharePhone: false });
            } else {
                const msgs = await client.getMessages(peer, { limit: 3 });
                let lihatLagiBtn = null;

                for (const msg of msgs) {
                    if (msg.buttons) {
                        const flat = msg.buttons.flat();
                        const found = flat.find(
                            (b) => b.text && /Lihat Umpan Lagi/i.test(b.text)
                        );

                        if (found) {
                            lihatLagiBtn = found;
                            break;
                        }
                    }
                }

                if (!lihatLagiBtn) {
                    console.log(
                        "[Buy Umpan] Tombol 'Lihat Umpan Lagi' tidak ketemu, fallback ke /shop."
                    );

                    await sendMessage(client, peer, "/shop");

                    const shopMsg = await waitForText(
                        client,
                        peer,
                        /Toko Peralatan Memancing/i,
                        { timeoutMs: 30000 }
                    );

                    if (shopMsg && shopMsg.buttons) {
                        const uBtn = shopMsg.buttons
                            .flat()
                            .find((b) => b.text && /Umpan/i.test(b.text));

                        if (uBtn) {
                            uBtn.client = client;

                            await uBtn.click({ sharePhone: false });
                        }
                    }
                } else {
                    // console.log("[Buy Umpan] Klik tombol 'Lihat Umpan Lagi'...");

                    lihatLagiBtn.client = client;

                    await lihatLagiBtn.click({ sharePhone: false });
                }
            }

            await sleep(2000);

            const baitListMsgs = await client.getMessages(peer, { limit: 3 });
            let baitBtn = null;

            for (const msg of baitListMsgs) {
                if (msg.buttons) {
                    const flat = msg.buttons.flat();
                    const found = flat.find((b) => b.text && b.text.includes(baitName));

                    if (found) {
                        baitBtn = found;
                        break;
                    }
                }
            }

            if (!baitBtn) {
                throw new Error(`Tombol '${baitName}' tidak ditemukan.`);
            }

            // console.log(`[Buy Umpan] Klik tombol '${baitBtn.text}'...`);
            baitBtn.client = client;

            await baitBtn.click({ sharePhone: false });
            await sleep(2000);

            const qtyMsgs = await client.getMessages(peer, { limit: 3 });
            let qtyBtn = null;

            for (const msg of qtyMsgs) {
                if (msg.buttons) {
                    const flat = msg.buttons.flat();

                    const found = flat.find((b) => b.text && b.text.trim() === "10x");
                    if (found) {
                        qtyBtn = found;
                        break;
                    }
                }
            }

            if (!qtyBtn) {
                throw new Error("Tombol '10x' tidak ditemukan.");
            }

            // console.log(`[Buy Umpan] Klik tombol '${qtyBtn.text}'...`);
            qtyBtn.client = client;

            await qtyBtn.click({ sharePhone: false });

            totalCoins += 1000000;
            totalBait += 30;

            console.log(
                `[Buy Umpan] Transaksi sukses. Total Koin: ${totalCoins.toLocaleString()}, Total Umpan: ${totalBait}`
            );

            // console.log("[Buy Umpan] Menunggu konfirmasi pembelian...");

            await sleep(3000);

            if (i === count) {
                if (shouldEquip) {
                    console.log(
                        "[Buy Umpan] Pembelian terakhir selesai. Opsi 'Pakai Umpan' aktif. Mencari 'Lihat Peralatan'..."
                    );

                    const successMsgs = await client.getMessages(peer, { limit: 3 });
                    let equipMenuBtn = null;

                    for (const msg of successMsgs) {
                        if (msg.buttons) {
                            const flat = msg.buttons.flat();
                            const found = flat.find(
                                (b) => b.text && /Lihat Peralatan/i.test(b.text)
                            );

                            if (found) {
                                equipMenuBtn = found;
                                break;
                            }
                        }
                    }

                    if (equipMenuBtn) {
                        // console.log(`[Buy Umpan] Klik '${equipMenuBtn.text}'...`);
                        equipMenuBtn.client = client;

                        await equipMenuBtn.click({ sharePhone: false });
                        await sleep(2000);

                        const equipMsgs = await client.getMessages(peer, { limit: 3 });
                        let useBaitBtn = null;

                        for (const msg of equipMsgs) {
                            if (msg.buttons) {
                                const flat = msg.buttons.flat();

                                const found = flat.find(
                                    (b) => b.text && /Pakai.*Umpan Celestial/i.test(b.text)
                                );

                                if (found) {
                                    useBaitBtn = found;
                                    break;
                                }
                            }
                        }

                        if (useBaitBtn) {
                            // console.log(`[Buy Umpan] Klik '${useBaitBtn.text}'...`);
                            useBaitBtn.client = client;

                            await useBaitBtn.click({ sharePhone: false });

                            console.log("[Buy Umpan] Umpan Celestial telah dipasang!");
                        } else {
                            console.error(
                                "[Buy Umpan] Tombol 'Pakai Umpan Celestial' tidak ditemukan di menu peralatan."
                            );
                        }
                    } else {
                        console.error(
                            "[Buy Umpan] Tombol 'Lihat Peralatan' tidak ditemukan setelah pembelian terakhir."
                        );
                    }
                } else {
                    console.log(
                        "[Buy Umpan] Pembelian selesai. Lewati pemasangan umpan."
                    );
                }
            } else {
                console.log(
                    "[Buy Umpan] Lanjut ke pembelian berikutnya..."
                );
            }
        } catch (e) {
            console.error(`[Buy Umpan] Error pada transaksi ke-${i}: ${e.message}`);
        }
    }

    console.log("\n========================================");
    console.log(`[Buy Umpan] SKENARIO SELESAI`);
    console.log(`Total Transaksi : ${count} kali`);
    console.log(`Total Koin      : ${totalCoins.toLocaleString()} Coins`);
    console.log(`Total Umpan     : ${totalBait} Umpan`);
    console.log("========================================");

    process.exit(0);
}

module.exports = { runBuyUmpan };
