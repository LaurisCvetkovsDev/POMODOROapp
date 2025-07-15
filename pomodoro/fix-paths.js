const fs = require('fs');
const path = require('path');

// Fix paths in index.html
const indexPath = path.join(__dirname, 'dist', 'index.html');
if (fs.existsSync(indexPath)) {
  let content = fs.readFileSync(indexPath, 'utf8');
  content = content.replace(/href="\/pomodoro\//g, 'href="./');
  content = content.replace(/src="\/pomodoro\//g, 'src="./');
  fs.writeFileSync(indexPath, content);
  console.log('Fixed paths in index.html');
}

// Fix paths in compact.html if it exists
const compactPath = path.join(__dirname, 'dist', 'compact.html');
if (fs.existsSync(compactPath)) {
  let content = fs.readFileSync(compactPath, 'utf8');
  content = content.replace(/href="\/pomodoro\//g, 'href="./');
  content = content.replace(/src="\/pomodoro\//g, 'src="./');
  fs.writeFileSync(compactPath, content);
  console.log('Fixed paths in compact.html');
} 