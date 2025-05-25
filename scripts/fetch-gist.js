import fetch from 'node-fetch';
import fs from 'fs/promises';

const GIST_ID = process.env.KHAI_ID;
const GITHUB_TOKEN = process.env.KHAI_TOKEN;
const CONTENT_DIR = 'content';

async function fetchGistMarkdown() {
  const res = await fetch(`https://api.github.com/gists/${GIST_ID}`, {
  headers: {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    'User-Agent': 'gist-fetch-script'
    }
  });
  const data = await res.json();
  const files = data.files;

  // Bersihkan folder posts dan root page
  await fs.rm(`${CONTENT_DIR}/posts`, { recursive: true, force: true });

  await fs.mkdir(`${CONTENT_DIR}/posts`, { recursive: true });

  for (const file of Object.values(files)) {
    if (!file.filename.endsWith('.md')) continue;

    const content = file.content;

    // Deteksi frontmatter `type`
    const match = content.match(/^---\s*([\s\S]*?)\s*---/);
    let type = 'post';

    if (match) {
      const frontmatter = match[1];
      const typeMatch = frontmatter.match(/type:\s*["']?(page|post)["']?/i);
      if (typeMatch) type = typeMatch[1].toLowerCase();
    }

    const targetPath = type === 'page'
      ? `${CONTENT_DIR}/${file.filename}`       // contoh: content/disclaimer.md
      : `${CONTENT_DIR}/posts/${file.filename}`; // contoh: content/posts/post1.md

    await fs.writeFile(targetPath, content);
  }

  console.log('✅ Fetched and saved Gist content.');
}

fetchGistMarkdown().catch(err => {
  console.error('❌ Error fetching gist:', err);
  process.exit(1);
});
