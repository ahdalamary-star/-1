import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import cp from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

const owner = 'ahdalamary-star';
const repo = '-1';
const branch = 'main';

// Get token from arguments, env var, or interactive prompt
let token = process.argv[2] || process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!token) {
  try {
    token = cp.execSync('gh auth token').toString().trim();
  } catch (err) {}
}

if (!token) {
  console.error('\n❌ برجاء تمرير رمز الدخول (GitHub Personal Access Token):');
  console.error('node scripts/push_to_target.js <YOUR_GITHUB_TOKEN>\n');
  process.exit(1);
}

token = token.trim();

async function api(endpoint, options = {}, retries = 3) {
  const url = `https://api.github.com${endpoint}`;
  const headers = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Ahed-Deployer',
    ...(options.headers || {})
  };
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, { ...options, headers });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`GitHub API Error [${res.status} ${res.statusText}] for ${endpoint}: ${errorText}`);
      }
      return await res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      console.warn(`    ⚠️ محاولة ${attempt} فشلت، إعادة المحاولة بعد ثانية...`);
      await new Promise(r => setTimeout(r, 1000));
    }
  }
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
  console.log(`\n======================================================`);
  console.log(`  رفع منظومة العهد إلى المستودع: ${owner}/${repo}`);
  console.log(`======================================================\n`);

  // 1. Verify access to the repository
  const repoData = await api(`/repos/${owner}/${repo}`);
  console.log(`✓ تم التحقق من المستودع: ${repoData.full_name}`);

  // 2. Check if repo is empty
  let headSha = null;
  let baseTreeSha = null;
  try {
    const ref = await api(`/repos/${owner}/${repo}/git/ref/heads/${branch}`);
    headSha = ref.object.sha;
    const commit = await api(`/repos/${owner}/${repo}/git/commits/${headSha}`);
    baseTreeSha = commit.tree.sha;
    console.log(`✓ الفرع ${branch} موجود مسبقاً (Commit: ${headSha.slice(0, 7)})`);
  } catch (err) {
    console.log(`ℹ المستودع فارغ جديد، جارٍ تهيئة الفرع الأساسي ${branch}...`);
    const readmeContent = fs.readFileSync(path.join(rootDir, 'README.md'), 'utf-8');
    const initRes = await api(`/repos/${owner}/${repo}/contents/README.md`, {
      method: 'PUT',
      body: JSON.stringify({
        message: 'Initial commit',
        content: Buffer.from(readmeContent).toString('base64'),
        branch: branch
      })
    });
    headSha = initRes.commit.sha;
    baseTreeSha = initRes.commit.tree.sha;
    console.log(`✓ تم تهيئة المستودع بنجاح (Initial Commit: ${headSha.slice(0, 7)})`);
  }

  // 3. Scan all files
  const allFiles = getFiles(rootDir);
  console.log(`\nجارٍ فحص الملفات... تم العثور على ${allFiles.length} ملفاً.`);

  // 4. Create blobs
  const treeEntries = [];
  for (let i = 0; i < allFiles.length; i++) {
    const { fullPath, relPath } = allFiles[i];
    // Skip README if it was just created and nothing changed, or include it in tree
    const fileBuf = fs.readFileSync(fullPath);
    const isBinary = relPath.endsWith('.png') || relPath.endsWith('.ico') || relPath.endsWith('.jpg') || relPath.endsWith('.jpeg');

    const blob = await api(`/repos/${owner}/${repo}/git/blobs`, {
      method: 'POST',
      body: JSON.stringify({
        content: isBinary ? fileBuf.toString('base64') : fileBuf.toString('utf-8'),
        encoding: isBinary ? 'base64' : 'utf-8'
      })
    });

    treeEntries.push({
      path: relPath,
      mode: '100644',
      type: 'blob',
      sha: blob.sha
    });

    if ((i + 1) % 15 === 0 || i === allFiles.length - 1) {
      console.log(`تم رفع ${i + 1}/${allFiles.length} ملفاً...`);
    }
  }

  // 5. Create new tree
  console.log('جارٍ إنشاء Git Tree...');
  const newTree = await api(`/repos/${owner}/${repo}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({
      base_tree: baseTreeSha,
      tree: treeEntries
    })
  });

  // 6. Create commit
  console.log('جارٍ تسجيل الـ Commit...');
  const commitMsg = 'feat: initial release of Al-Ahad Production Platform for Ahed Al-Amari';
  const newCommit = await api(`/repos/${owner}/${repo}/git/commits`, {
    method: 'POST',
    body: JSON.stringify({
      message: commitMsg,
      tree: newTree.sha,
      parents: [headSha]
    })
  });

  // 7. Update branch
  console.log(`جارٍ تحديث الفرع ${branch}...`);
  await api(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    body: JSON.stringify({
      sha: newCommit.sha,
      force: false
    })
  });

  console.log(`\n======================================================`);
  console.log(`🎉 تم رفع كافة المواد والملفات بنجاح إلى:`);
  console.log(`https://github.com/${owner}/${repo}`);
  console.log(`======================================================\n`);
}

main().catch(err => {
  console.error('\n❌ فشلت عملية الرفع:', err.message);
  process.exit(1);
});
