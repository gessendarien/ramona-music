const fs = require('fs');
const path = require('path');

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error("Please provide a version string, e.g., 0.02");
  process.exit(1);
}

const newVersion = args[0];

const updateJsonFile = (filePath, updater) => {
  if (!fs.existsSync(filePath)) return;
  const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  const updatedContent = updater(content);
  fs.writeFileSync(filePath, JSON.stringify(updatedContent, null, 2) + '\n', 'utf8');
  console.log(`Updated ${filePath}`);
};

// Update mobile/app.json
updateJsonFile('./mobile/app.json', (content) => {
  content.expo.version = newVersion;
  content.expo.android.versionCode = (content.expo.android.versionCode || 0) + 1;
  return content;
});

// Update web/package.json
updateJsonFile('./web/package.json', (content) => {
  content.version = newVersion;
  return content;
});

// Update backend/package.json
updateJsonFile('./backend/package.json', (content) => {
  content.version = newVersion;
  return content;
});

// Update desktop/package.json
updateJsonFile('./desktop/package.json', (content) => {
  content.version = newVersion;
  return content;
});

// If root package.json exists
updateJsonFile('./package.json', (content) => {
  content.version = newVersion;
  return content;
});

// Update mobile/android/app/build.gradle
const buildGradlePath = './mobile/android/app/build.gradle';
if (fs.existsSync(buildGradlePath)) {
  let gradleContent = fs.readFileSync(buildGradlePath, 'utf8');
  // Bump versionCode (requires finding the line)
  const versionCodeMatch = gradleContent.match(/versionCode\s+(\d+)/);
  if (versionCodeMatch) {
    const newVersionCode = parseInt(versionCodeMatch[1]) + 1;
    gradleContent = gradleContent.replace(/versionCode\s+(\d+)/, `versionCode ${newVersionCode}`);
  }
  
  // Replace versionName
  gradleContent = gradleContent.replace(/versionName\s+".*?"/, `versionName "${newVersion}"`);
  
  fs.writeFileSync(buildGradlePath, gradleContent, 'utf8');
  console.log(`Updated ${buildGradlePath}`);
}

console.log(`\nSuccessfully bumped version to ${newVersion}!`);
