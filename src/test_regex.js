
const text = "add expense 250 for cleaning";

const patterns = [
    {
        name: 'ADD_EXPENSE',
        // Paste the EXACT regex from the file here
        regex: /\b(add|log|record)\s+(expense|cost|spending|payout)\s+(?:of\s+)?(\d+(?:\.\d+)?)\s*(?:rupees|rs|inr)?\s*(?:for|on)\s+(.+)/i
    },
    {
        name: 'ADD_ITEM_QTY',
        regex: /\b(add|give|need|want|tharu|venam|edu)\s+(\d+(?:\.\d+)?)\s*(?:(kg|g|gm|gram|grams|pcs|nos|liter|litre|l|ml))?\s+(.+)/i
    },
    {
        name: 'ADD_ITEM_GENERIC',
        regex: /\b(add|give|need|want|tharu|venam|edu)\s+(.+)/i
    }
];

console.log(`Testing text: "${text}"`);

for (const p of patterns) {
    const match = text.match(p.regex);
    if (match) {
        console.log(`MATCHED: ${p.name}`);
        console.log(match);
        break;
        // IntentEngine breaks on first match, so order matters.
    } else {
        console.log(`FAILED: ${p.name}`);
    }
}
