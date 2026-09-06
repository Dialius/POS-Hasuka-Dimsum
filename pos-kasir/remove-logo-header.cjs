const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components');
const files = fs.readdirSync(componentsDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  // Skip Login, BukaShift, Checkout since they are special/already fine
  if (['LoginScreen.tsx', 'BukaShiftScreen.tsx', 'CheckoutScreen.tsx'].includes(file)) continue;

  const filePath = path.join(componentsDir, file);
  let content = fs.readFileSync(filePath, 'utf-8');
  let changed = false;

  // We want to remove the logo from the topbar
  // The logo typically looks like:
  // <img src="/Hasuka-logo.png" alt="Hasuka Logo" className="w-8 h-8 object-contain cursor-pointer"  onClick={onBack} />
  // It might be right after the Menu button or inside the header gap-3
  
  // A regex to match the logo image tag in the header
  const logoRegex = /<img src="\/Hasuka-logo\.png"[^>]+onClick=\{onBack\}[^>]*>\s*/g;
  if (logoRegex.test(content)) {
    content = content.replace(logoRegex, '');
    changed = true;
  }

  // Some might not have onClick={onBack} if it was altered
  const logoRegex2 = /<img src="\/Hasuka-logo\.png"[^>]+className="[^"]*cursor-pointer[^"]*"[^>]*>\s*/g;
  if (logoRegex2.test(content)) {
    content = content.replace(logoRegex2, '');
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log(`Removed logo from topbar in ${file}`);
  }
}
