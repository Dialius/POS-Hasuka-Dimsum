const fs = require('fs');
const path = require('path');

const componentsDir = path.join(__dirname, 'src', 'components');
const filesToFix = [
  'ManageProductsScreen.tsx',
  'ManagePromoScreen.tsx',
  'QrMenuScreen.tsx',
  'ReportScreen.tsx',
  'SettingsScreen.tsx',
  'StokOpnameScreen.tsx',
  'OwnerDashboardScreen.tsx',
  'PettyCashScreen.tsx'
];

for (const file of filesToFix) {
  const filePath = path.join(componentsDir, file);
  if (fs.existsSync(filePath)) {
    let content = fs.readFileSync(filePath, 'utf-8');
    let changed = false;

    // Add Menu import if not exists
    if (!content.includes('Menu } from \'lucide-react\'')) {
      content = content.replace(/\} from 'lucide-react'/, ', Menu } from \'lucide-react\'');
    }

    // Add useSidebar import
    if (!content.includes('useSidebar')) {
      content = content.replace(
        /import \{ [^}]+ \} from 'lucide-react'/,
        "$&" + "\nimport { useSidebar } from '../context/SidebarContext'"
      );
    }

    // Add toggleSidebar to component body
    const compRegex = /export default function [A-Za-z]+\([^)]*\) \{/;
    if (!content.includes('const { toggleSidebar } = useSidebar()')) {
      content = content.replace(compRegex, "$&\n  const { toggleSidebar } = useSidebar();\n");
    }

    // Add the Menu button to the TopBar right before the Logo
    // The logo is typically: <img src="/Hasuka-logo.png"
    const logoRegex = /(<img src="\/Hasuka-logo\.png"[^>]+>)/g;
    
    // We only want to inject the button in the Desktop Topbar, which usually has hidden md:flex
    // Or just next to the logo on screens that have back button.
    // Let's replace the first occurrence of the logo in the topbar with Button + Logo
    const menuBtn = `
          <button onClick={toggleSidebar} className="p-2 -ml-2 rounded-xl text-textPrimary hover:bg-surface transition-colors hidden md:flex">
            <Menu size={22} />
          </button>
          $1`;

    if (!content.includes('<Menu size={22} />')) {
      // Find the first logo which is in the TopBar
      content = content.replace(/(<div className="flex items-center gap-3">\s*)(<img src="\/Hasuka-logo\.png"[^>]+>)/, "$1" + menuBtn.replace('$1', '$2'));
      
      // For QrMenuScreen which might not have exactly that wrapper
      if (file === 'QrMenuScreen.tsx') {
         content = content.replace(/(<div className="flex items-center gap-3 mb-4">\s*)(<img src="\/Hasuka-logo\.png"[^>]+>)/, "$1" + menuBtn.replace('$1', '$2'));
      }
      
      changed = true;
    }

    if (changed) {
      fs.writeFileSync(filePath, content, 'utf-8');
      console.log(`Injected Menu into ${file}`);
    }
  }
}
