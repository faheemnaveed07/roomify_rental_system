// #!/usr/bin/env ts-node
// import fs from 'fs';
// import path from 'path';
// import { fileURLToPath } from 'url';

// const __filename = fileURLToPath(import.meta.url);
// const __dirname = path.dirname(__filename);

// const services = ['AuthService', 'BookingService', 'PropertyService', 'RoommateMatcher', 'VerificationService'];
// const serviceDir = path.join(__dirname, '../src/services');

// console.log('📊 Domavi Service Progress Check\n');

// services.forEach(serviceName => {
//   const filePath = path.join(serviceDir, `${serviceName}.ts`);
//   const content = fs.readFileSync(filePath, 'utf-8');
  
//   // Check for TODO comments
//   const todos = (content.match(/\/\/\s*TODO/g) || []).length;
  
//   // Check for empty methods
//   const emptyMethods = (content.match(/async\s+\w+\(.*?\):\s*\w+\s*{\s*}/g) || []).length;
  
//   // Check for implementation markers
//   const hasComments = content.includes('// Implementation');
//   const hasActualLogic = content.includes('await') && !hasComments;
  
//   const status = todos === 0 && emptyMethods === 0 && hasActualLogic ? '✅ DONE' : '⏳ IN PROGRESS';
//   const issues = todos + emptyMethods;
  
//   console.log(`${serviceName}: ${status}`);
//   if (issues > 0) {
//     console.log(`  - ${issues} items remaining`);
//   }
// });

// // Check model completeness
// const modelDir = path.join(__dirname, '../src/models');
// const models = fs.readdirSync(modelDir).filter(f => f.endsWith('.ts'));
// console.log(`\n📦 Models: ${models.length}/6 files`);

// // Check route completeness
// const routeDir = path.join(__dirname, '../src/routes');
// const routes = fs.readdirSync(routeDir).filter(f => f.endsWith('.ts'));
// console.log(`🛣️  Routes: ${routes.length}/5 files`);

// console.log('\n✨ Run: npm run check-progress to see this anytime');