import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.resolve(rootDir, 'dist');

const owner = 'ahdalamary-star';
const repo = '-1';
const branch = 'gh-pages';

let token = process.argv[2] || process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
if (!token) {
  console.error('\n❌ برجاء تمرير رمز الدخول: node scripts/deploy_gh_pages.js <TOKEN>');
  process.exit(1);
}
token = token.trim();

async function api(endpoint, options = {}) {
  const url = `https://api.github.com${endpoint}`;
  const headers = {
    'Authorization': `token ${token}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'Ahed-Deployer',
    ...(options.headers || {})
  };
  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`GitHub API Error [${res.status} ${res.statusText}] for ${endpoint}: ${errorText}`);
  }
  return res.json();
}

function getFiles(dir, baseDir = '') {
  let results = [];
  const list = fs.readdirSync(dir);
  for (const file of list) {
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
  console.log(`  نشر النسخة الحية على GitHub Pages: ${owner}/${repo} (${branch})`);
  console.log(`======================================================\n`);

  // Ensure .nojekyll exists
  fs.writeFileSync(path.join(distDir, '.nojekyll'), '');

  // 1. Check if gh-pages branch exists
  let headSha = null;
  try {
    const ref = await api(`/repos/${owner}/${repo}/git/ref/heads/${branch}`);
    headSha = ref.object.sha;
    console.log(`✓ الفرع ${branch} موجود مسبقاً (Commit: ${headSha.slice(0, 7)})`);
  } catch (err) {
    console.log(`ℹ الفرع ${branch} غير موجود، سيتم إنشاؤه لأول مرة.`);
  }

  // 2. Scan all files in dist/
  const distFiles = getFiles(distDir);
  console.log(`جارٍ فحص ملفات dist... تم العثور على ${distFiles.length} ملفاً.`);

  // 3. Create blobs
  const treeEntries = [];
  for (let i = 0; i < distFiles.length; i++) {
    const { fullPath, relPath } = distFiles[i];
    const fileBuf = fs.readFileSync(fullPath);
    const isBinary = relPath.endsWith('.png') || relPath.endsWith('.ico') || relPath.endsWith('.jpg') || relPath.endsWith('.jpeg') || relPath.endsWith('.woff') || relPath.endsWith('.woff2');

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

    console.log(`  ✓ [${i + 1}/${distFiles.length}] ${relPath}`);
  }

  // 4. Create new tree (standalone without base_tree to only have dist files)
  console.log('جارٍ إنشاء Git Tree...');
  const newTree = await api(`/repos/${owner}/${repo}/git/trees`, {
    method: 'POST',
    body: JSON.stringify({
      tree: treeEntries
    })
  });

  // 5. Create commit
  console.log('جارٍ تسجيل الـ Commit للنشر المباشر...');
  const commitMsg = 'deploy: live release with all 10 updates (calendar corners, notifications center, AI hub, audit logs, devices)';
  const commitBody = {
    message: commitMsg,
    tree: newTree.sha,
    parents: headSha ? [headSha] : []
  };
  const newCommit = await api(`/repos/${owner}/${repo}/git/commits`, {
    method: 'POST',
    body: JSON.stringify(commitBody)
  });

  // 6. Update or create branch ref
  if (headSha) {
    console.log(`جارٍ تحديث الفرع ${branch}...`);
    await api(`/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      body: JSON.stringify({
        sha: newCommit.sha,
        force: true
      })
    });
  } else {
    console.log(`جارٍ إنشاء الفرع ${branch}...`);
    await api(`/repos/${owner}/${repo}/git/refs`, {
      method: 'POST',
      body: JSON.stringify({
        ref: `refs/heads/${branch}`,
        sha: newCommit.sha
      })
    });
  }

  console.log(`\n======================================================`);
  console.log(`🎉 تم نشر النسخة الحية بنجاح على GitHub Pages!`);
  console.log(`🌐 الرابط المباشر للموقع:`);
  console.log(`https://${owner}.github.io/${repo}/`);
  console.log(`======================================================\n`);
}

main().catch(err => {
  console.error('\n❌ خطأ أثناء النشر:', err.message);
  process.exit(1);
});
