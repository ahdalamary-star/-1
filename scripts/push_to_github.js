import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cp from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const owner = 'yazeedabdulmonim-code';
const repo = 'al-ahad-system';
const branch = 'main';

// Get GitHub Token
let token = process.env.GITHUB_TOKEN;
if (!token) {
  try {
    token = cp.execSync('gh auth token').toString().trim();
  } catch (err) {
    console.error('Failed to get token from gh CLI:', err.message);
    process.exit(1);
  }
}

async function api(endpoint, options = {}) {
  const url = `https://api.github.com${endpoint}`;
  const headers = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Al-Ahad-Deployer',
    ...(options.headers || {})
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`GitHub API Error [${res.status} ${res.statusText}] for ${endpoint}: ${errorText}`);
  }
  return res.json();
}

const ignoredPaths = new Set([
  'node_modules',
  'dist',
  '.git',
  '.system_generated',
  '.oxlintcache'
]);

function getFiles(dir, baseDir = '') {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
    if (ignoredPaths.has(file)) continue;
    const fullPath = path.join(dir, file);
    const relPath = path.join(baseDir, file).replace(/\\/g, '/');
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      results = results.concat(getFiles(fullPath, relPath));
    } else {
      results.push({ fullPath, relPath, size: stat.size });
    }
  }
  return results;
}

async function main() {
  console.log(`Starting push to ${owner}/${repo} on branch '${branch}'...`);

  // 1. Get branch reference
  const ref = await api(`/repos/${owner}/${repo}/git/ref/heads/${branch}`);
  const latestCommitSha = ref.object.sha;
  console.log(`Latest commit on ${branch}: ${latestCommitSha}`);

  // 2. Get tree SHA of the latest commit
  const commit = await api(`/repos/${owner}/${repo}/git/commits/${latestCommitSha}`);
  const baseTreeSha = commit.tree.sha;
  console.log(`Base tree SHA: ${baseTreeSha}`);

  // 3. Scan files to upload
  const allFiles = getFiles(rootDir);
  console.log(`Found ${allFiles.length} files to synchronize.`);

  // 4. Create blobs for modified/new files
  const treeEntries = [];
  for (let i = 0; i < allFiles.length; i++) {
    const { fullPath, relPath } = allFiles[i];
    const fileContent = fs.readFileSync(fullPath);
    const isBinary = fileContent.some(byte => byte === 0);

    let blob;
    if (isBinary) {
      blob = await api(`/repos/${owner}/${repo}/git/blobs`, {
        method: 'POST',
        body: JSON.stringify({
          content: fileContent.toString('base64'),
          encoding: 'base64'
        })
      });
    } else {
      blob = await api(`/repos/${owner}/${repo}/git/blobs`, {
        method: 'POST',
        body: JSON.stringify({
          content: fileContent.toString('utf-8'),
          encoding: 'utf-8'
        })
      });
    }

    treeEntries.push({
      path: relPath,
      mode: '100644',
      type: 'blob',
      sha: blob.sha
    });

    if ((i + 1) % 10 === 0 || i === allFiles.length - 1) {
      console.log(`Uploaded ${i + 1}/${allFiles.length} files...`);
    }
  }

  // 5. Create new tree
  console.log('Creating new git tree...');
  const newTree = await api(`/repos/${owner}/${repo}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: treeEntries
    })
  });
  console.log(`New tree created: ${newTree.sha}`);

  // 6. Create commit
  console.log('Creating new commit...');
  const commitMessage = 'feat: enhance social media meta tags, PWA, SEO, cross-platform build, and documentation';
  const newCommit = await api(`/repos/${owner}/${repo}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({
      message: commitMessage,
      tree: newTree.sha,
      parents: [latestCommitSha]
    })
  });
  console.log(`New commit created: ${newCommit.sha}`);

  // 7. Update branch reference
  console.log(`Updating ref heads/${branch}...`);
  await api(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    body: JSON.stringify({
      sha: newCommit.sha,
      force: false
    })
  });

  console.log(`\n🎉 SUCCESS! Changes pushed successfully to:`);
  console.log(`https://github.com/${owner}/${repo}`);
}

main().catch(err => {
  console.error('\n❌ Push failed:', err);
  process.exit(1);
});
