const fs = require('fs');
const path = require('path');
const cp = require('child_process');

function getGitSha(cwd) {
  try {
    return cp.execSync('git rev-parse --short HEAD', { cwd, encoding: 'utf8' }).trim();
  } catch (e) {
    return process.env.GIT_SHA || 'unknown';
  }
}

function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const buildIndex = path.join(projectRoot, 'build', 'index.html');
  if (!fs.existsSync(buildIndex)) return;
  const sha = getGitSha(projectRoot);
  const stamp = `<!-- build_stamp: ${sha} ${new Date().toISOString()} -->`;
  let html = fs.readFileSync(buildIndex, 'utf8');
  if (html.includes('</body>')) {
    html = html.replace('</body>', `${stamp}\n</body>`);
  } else {
    html = html + '\n' + stamp;
  }
  fs.writeFileSync(buildIndex, html, 'utf8');
}

main();
