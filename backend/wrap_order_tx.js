const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'routes', 'orders.js');
let code = fs.readFileSync(filePath, 'utf8');

const startStr = '    // Create order with items';
const endStr = '    // Emit to cashier via WebSocket';

const startIndex = code.indexOf(startStr);
const endIndex = code.indexOf(endStr, startIndex);

if (startIndex > -1 && endIndex > -1) {
  let before = code.slice(0, startIndex);
  let after = code.slice(endIndex);
  
  let targetBlock = code.slice(startIndex, endIndex);
  
  // Replace await prisma. with await tx.
  targetBlock = targetBlock.replace(/await prisma\./g, 'await tx.');
  // Change const order to order =
  targetBlock = targetBlock.replace('const order = await tx.order.create', 'order = await tx.order.create');
  
  // Wrap it in a transaction
  targetBlock = `    let order;\n    await prisma.$transaction(async (tx) => {\n  ${targetBlock.split('\\n').join('\\n  ')}    });\n\n`;
  
  fs.writeFileSync(filePath, before + targetBlock + after);
  console.log("Successfully wrapped order creation in transaction.");
} else {
  console.log("Indices not found");
}
