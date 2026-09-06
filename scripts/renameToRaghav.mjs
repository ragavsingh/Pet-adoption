import fs from 'fs';
import path from 'path';

const filesToUpdate = [
  'src/data/mockData.ts',
  'scripts/generatePets.mjs',
  'src/contexts/AuthContext.tsx',
  'src/components/common/DemoRoleBar.tsx',
  'src/components/adopter/AdoptionRequestModal.tsx',
  'src/pages/adopter/AdopterDashboard.tsx',
  'src/pages/adopter/AdopterRequestsPage.tsx',
  'src/pages/adopter/AdopterAdoptionsPage.tsx',
  'src/pages/adopter/AdopterProfilePage.tsx',
  'src/pages/AdoptionSuccessPage.tsx',
  'src/pages/admin/AdminUsersPage.tsx',
  'src/pages/auth/LoginPage.tsx',
  'src/pages/auth/SignupPage.tsx',
  'src/pages/public/ContactPage.tsx',
  'src/pages/public/HomePage.tsx',
  'pawtrial.html'
];

filesToUpdate.forEach(relPath => {
  if (!fs.existsSync(relPath)) return;
  let content = fs.readFileSync(relPath, 'utf8');

  // Exact replacements
  content = content.replace(/Rahul Sharma/g, 'Raghav Singh');
  content = content.replace(/rahul\.sharma@example\.com/g, 'raghav.singh@example.com');
  content = content.replace(/rahul@example\.com/g, 'raghav@example.com');
  content = content.replace(/usr_rahul/g, 'usr_raghav');
  content = content.replace(/Adopter \(Rahul\)/g, 'Adopter (Raghav)');
  content = content.replace(/— Rahul & Bruno/g, '— Raghav & Bruno');
  content = content.replace(/Adopter profile · Rahul/g, 'Adopter profile · Raghav');
  content = content.replace(/placeholder="Rahul"/g, 'placeholder="Raghav"');
  content = content.replace(/Default logged in user is Rahul/g, 'Default logged in user is Raghav');

  fs.writeFileSync(relPath, content, 'utf8');
  console.log(`Updated: ${relPath}`);
});

console.log('All files successfully updated to Raghav Singh!');
