import fs from 'fs';
import path from 'path';

const srcDir = path.resolve('./src');

function walk(dir: string, callback: (filepath: string) => void) {
  fs.readdirSync(dir).forEach(f => {
    const dirPath = path.join(dir, f);
    const isDirectory = fs.statSync(dirPath).isDirectory();
    if (isDirectory) {
      walk(dirPath, callback);
    } else if (dirPath.endsWith('.ts') || dirPath.endsWith('.tsx')) {
      callback(dirPath);
    }
  });
}

function processFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf-8');
  let originalContent = content;

  // Replace relative imports to ../data or ./data with @/src/services/mockData
  content = content.replace(/from\s+['"](?:\.\.\/|\.\/)*data['"]/g, "from '@/src/services/mockData'");
  
  // Replace types import
  content = content.replace(/from\s+['"](?:\.\.\/|\.\/)*types['"]/g, "from '@/src/types'");
  
  // Replace store import
  content = content.replace(/from\s+['"](?:\.\.\/|\.\/)*lib\/store['"]/g, "from '@/src/store'");
  content = content.replace(/from\s+['"](?:\.\.\/|\.\/)*store['"]/g, "from '@/src/store'"); // in case it was already replaced

  // Replace utils import
  content = content.replace(/from\s+['"](?:\.\.\/|\.\/)*lib\/utils['"]/g, "from '@/src/utils'");

  // Replace component imports
  content = content.replace(/from\s+['"](?:\.\.\/|\.\/)*components\/Navbar['"]/g, "from '@/src/components/layout/Navbar'");
  content = content.replace(/from\s+['"](?:\.\.\/|\.\/)*components\/Footer['"]/g, "from '@/src/components/layout/Footer'");
  content = content.replace(/from\s+['"](?:\.\.\/|\.\/)*components\/PlantCard['"]/g, "from '@/src/components/shop/PlantCard'");

  // Replace page imports in App.tsx
  content = content.replace(/from\s+['"]\.\/pages\/Home['"]/g, "from '@/src/pages/public/Home'");
  content = content.replace(/from\s+['"]\.\/pages\/Shop['"]/g, "from '@/src/pages/public/Shop'");
  content = content.replace(/from\s+['"]\.\/pages\/Services['"]/g, "from '@/src/pages/public/Services'");
  content = content.replace(/from\s+['"]\.\/pages\/AIDiagnosis['"]/g, "from '@/src/pages/public/AIDiagnosis'");
  content = content.replace(/from\s+['"]\.\/pages\/Blog['"]/g, "from '@/src/pages/public/Blog'");
  content = content.replace(/from\s+['"]\.\/pages\/Cart['"]/g, "from '@/src/pages/public/Cart'");
  content = content.replace(/from\s+['"]\.\/pages\/ProductDetail['"]/g, "from '@/src/pages/public/ProductDetail'");
  content = content.replace(/from\s+['"]\.\/pages\/Auth['"]/g, "from '@/src/pages/auth/Auth'");
  content = content.replace(/from\s+['"]\.\/pages\/AdminDashboard['"]/g, "from '@/src/pages/admin/AdminDashboard'");

  if (content !== originalContent) {
    fs.writeFileSync(filePath, content, 'utf-8');
    console.log('Updated: ' + filePath);
  }
}

// First, fix lib/utils.ts to utils/index.ts
try {
  fs.mkdirSync(path.join(srcDir, 'utils'), { recursive: true });
  if (fs.existsSync(path.join(srcDir, 'lib/utils.ts'))) {
    fs.renameSync(path.join(srcDir, 'lib/utils.ts'), path.join(srcDir, 'utils/index.ts'));
    console.log('Moved lib/utils.ts to utils/index.ts');
  }
} catch(e) { console.error(e) }

walk(srcDir, processFile);
