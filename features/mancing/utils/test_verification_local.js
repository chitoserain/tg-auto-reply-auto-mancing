const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });
const { handleVerification } = require("./verification");

// Mock Client
const mockClient = {
    sendMessage: async (peer, text) => console.log(`[MockClient] Sending to ${peer}:`, text)
};

// Start Function to Create Button
const createButton = (text) => ({
    text,
    click: async () => console.log(`[MockButton] Clicked button "${text}"`)
});

// Mock Message for Math
const mathMessage = {
    message: `🎣 Verifikasi Keamanan

Kamu sudah mancing beberapa kali.
Jawab pertanyaan berikut untuk melanjutkan:

🔢 VERIFIKASI BOT

Berapa hasil dari:
15 - 5 = ?

⏰ Pilih jawaban dalam 1 menit!`,
    buttons: [
        [createButton("10"), createButton("15"), createButton("20"), createButton("25")]
    ]
};

// Mock Message for Emoji Count
const emojiMessage = {
    message: `🎣 Verifikasi Keamanan

Kamu sudah mancing beberapa kali.
Jawab pertanyaan berikut untuk melanjutkan:

🐟 VERIFIKASI BOT

Hitung berapa ikan:
🐙 🐙 🐙 🐙 🐙 🐙 🐙

⏰ Pilih dalam 1 menit!`,
    buttons: [
        [createButton("5"), createButton("6"), createButton("7"), createButton("8")]
    ]
};

// Mock Message for Sequence
const sequenceMessage = {
    message: `🎣 Verifikasi Keamanan

Kamu sudah mancing beberapa kali.
Jawab pertanyaan berikut untuk melanjutkan:

🧮 VERIFIKASI BOT

Lanjutkan pola:
1, 3, 5, 7, __?

⏰ Pilih dalam 1 menit!`,
    buttons: [
        [createButton("7"), createButton("8"), createButton("9"), createButton("11")]
    ]
};

async function runTests() {
    console.log("--- Testing Math ---");
    await handleVerification(mockClient, "bot", mathMessage);

    console.log("\n--- Testing Emoji Count ---");
    await handleVerification(mockClient, "bot", emojiMessage);

    console.log("\n--- Testing Sequence ---");
    await handleVerification(mockClient, "bot", sequenceMessage);
}

runTests();
