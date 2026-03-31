// GitHub API Client
const GitHub = {
  parseRepoInput(input) {
    input = input.trim();
    const match = input.match(/(?:https?:\/\/)?(?:github\.com\/)?([^\/\s]+)\/([^\/\s#?]+)/);
    if (!match) return null;
    return { owner: match[1], repo: match[2].replace(/\.git$/, '') };
  },

  async fetchRepo(owner, repo) {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`);
    if (!res.ok) {
      if (res.status === 404) throw new Error('Repository not found');
      if (res.status === 403) throw new Error('API rate limit exceeded — try again in a minute');
      throw new Error(`GitHub API error: ${res.status}`);
    }
    return res.json();
  },

  repoToProject(data) {
    const langColors = {
      JavaScript: 'yellow', TypeScript: 'pink', Python: 'purple',
      Rust: 'purple', Go: 'default', Java: 'pink', 'C++': 'default',
      C: 'default', Ruby: 'pink', Swift: 'pink', Kotlin: 'purple',
      HTML: 'yellow', CSS: 'pink', Shell: 'default', Dart: 'purple'
    };

    const tags = [];
    if (data.language) {
      tags.push({ label: data.language, color: langColors[data.language] || 'default' });
    }
    const topicColors = ['default', 'pink', 'purple', 'yellow'];
    (data.topics || []).slice(0, 5).forEach((t, i) => {
      tags.push({ label: t, color: topicColors[i % topicColors.length] });
    });

    const links = { github: data.html_url };
    if (data.homepage) links.demo = data.homepage;

    return {
      id: data.full_name.replace('/', '-').toLowerCase(),
      title: data.name
        .replace(/[-_]/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase()),
      description: data.description || 'No description provided.',
      tags,
      links,
      size: 'standard',
      accent: 'default',
      featured: false,
      order: 999,
      source: 'github',
      github_meta: {
        stars: data.stargazers_count,
        forks: data.forks_count,
        language: data.language,
        updated_at: data.updated_at,
        full_name: data.full_name
      }
    };
  }
};

window.GitHub = GitHub;
