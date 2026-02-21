const detectType = require("./detect_type");
const { solveMath, solveEmojiCount } = require("./local_solvers");
const askGroq = require("../../../services/groq_client");
const { sleep } = require("../../../lib/utils");

async function handleVerification(client, peer, message) {
    console.log(`\n[Security] Verification detected!`);

    // Extract the question text (removing the "Verifikasi keamanan..." header if needed, 
    // but the detectors usually work on the whole text or we can pass the whole text)
    const text = message.message || "";

    // Detect type
    const type = detectType(text);
    console.log(`[Security] Type detected: ${type}`);

    let answer = null;

    try {
        // Solve based on type
        if (type === 'math') {
            // Extract math expression roughly or let the solver handle extraction if it was robust
            // The provided solver expects "expr", but detectType checks regex.
            // Let's extract the math part specifically if needed, or pass text if solver handles it.
            // Looking at local_solvers.js, solveMath takes 'expr' and does `replace` then `eval`.
            // It might fail if text contains extra chars.
            // Let's try to extract the math part: digit space operator space digit
            const match = text.match(/([\d]+\s*[+\-×x*]\s*[\d]+)/);
            if (match) {
                answer = solveMath(match[0]);
            } else {
                console.log("[Security] math detected but regex failed to extract, trying Groq fallback.");
                answer = await askGroq(text);
            }
        } else if (type === 'emoji_count') {
            answer = solveEmojiCount(text);
        } else {
            // 'sequence', 'emoji_select', 'unknown' -> Use AI
            console.log(`[Security] Using AI solver for ${type}...`);
            answer = await askGroq(text);
        }

        console.log(`[Security] Solved Answer: ${answer}`);

        if (answer === null || answer === undefined) {
            console.error("[Security] Failed to find an answer.");
            return;
        }

        // Find and click button
        await clickButtonByText(client, message, String(answer));


    } catch (e) {
        console.error(`[Security] Error solving: ${e.message}`);
    }
}

async function clickButtonByText(client, message, answerText) {
    if (!message.buttons) {
        console.log("[Security] No buttons found in message.");
        return;
    }

    const flatButtons = message.buttons.flat();

    // Find exact match or match containing the answer
    // For math/numbers, exact match is safest (trimmed)
    const targetButton = flatButtons.find(btn =>
        btn.text && btn.text.toString().trim() == answerText.toString().trim()
    );

    if (targetButton) {
        console.log(`[Security] Clicking button: "${targetButton.text}"`);

        // Ensure client is attached if not already (common pattern in GramJS)
        if (!targetButton.client) {
            targetButton.client = client;
        }

        // Use the button's own click method
        await targetButton.click({ sharePhone: false });
    } else {
        console.log(`[Security] Button with text "${answerText}" not found. Available buttons:`);
        flatButtons.forEach(b => process.stdout.write(`[${b.text}] `));
        console.log("");
    }
}

module.exports = { handleVerification };
