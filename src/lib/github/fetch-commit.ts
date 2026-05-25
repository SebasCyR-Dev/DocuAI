import { Octokit } from '@octokit/rest';

export interface FileChange {
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  patch: string;
  truncated: boolean;
}

export interface HydratedCommit {
  sha: string;
  totalAdditions: number;
  totalDeletions: number;
  filesWithDiff: FileChange[];
  filesOmittedCount: number;
  filesOmittedSample: string[];
}

const IGNORE_PATTERNS = [
  /(^|\/)package-lock\.json$/,
  /(^|\/)pnpm-lock\.yaml$/,
  /(^|\/)yarn\.lock$/,
  /(^|\/)composer\.lock$/,
  /(^|\/)Gemfile\.lock$/,
  /(^|\/)Cargo\.lock$/,
  /(^|\/)go\.sum$/,
  /\.min\.(js|css)$/,
  /(^|\/)node_modules\//,
  /(^|\/)dist\//,
  /(^|\/)build\//,
  /(^|\/)\.next\//,
  /\.(png|jpe?g|gif|webp|svg|ico|pdf|zip|tar|gz|woff2?|ttf|eot|mp4|mp3|wav)$/i,
];

const MAX_FILES_WITH_DIFF = 15;
const MAX_PATCH_LINES = 200;

function shouldIgnore(filename: string): boolean {
  return IGNORE_PATTERNS.some((p) => p.test(filename));
}

function truncatePatch(patch: string): { patch: string; truncated: boolean } {
  const lines = patch.split('\n');
  if (lines.length <= MAX_PATCH_LINES) {
    return { patch, truncated: false };
  }
  const cut = lines.slice(0, MAX_PATCH_LINES).join('\n');
  return {
    patch: `${cut}\n... [truncado: ${lines.length - MAX_PATCH_LINES} líneas adicionales]`,
    truncated: true,
  };
}

export async function hydrateCommitDiff(params: {
  owner: string;
  repo: string;
  sha: string;
}): Promise<HydratedCommit | null> {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    console.warn(
      '⚠️  GITHUB_TOKEN no configurado, se omitirá la hidratación del diff'
    );
    return null;
  }

  const octokit = new Octokit({ auth: token });

  try {
    const { data } = await octokit.repos.getCommit({
      owner: params.owner,
      repo: params.repo,
      ref: params.sha,
    });

    const eligible: FileChange[] = [];
    const omitted: string[] = [];

    for (const f of data.files ?? []) {
      if (shouldIgnore(f.filename)) {
        omitted.push(f.filename);
        continue;
      }
      if (!f.patch) {
        omitted.push(f.filename);
        continue;
      }
      const { patch, truncated } = truncatePatch(f.patch);
      eligible.push({
        filename: f.filename,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
        patch,
        truncated,
      });
    }

    eligible.sort(
      (a, b) => b.additions + b.deletions - (a.additions + a.deletions)
    );
    const filesWithDiff = eligible.slice(0, MAX_FILES_WITH_DIFF);
    const overflow = eligible.slice(MAX_FILES_WITH_DIFF).map((f) => f.filename);

    return {
      sha: params.sha,
      totalAdditions: data.stats?.additions ?? 0,
      totalDeletions: data.stats?.deletions ?? 0,
      filesWithDiff,
      filesOmittedCount: omitted.length + overflow.length,
      filesOmittedSample: [...omitted, ...overflow].slice(0, 10),
    };
  } catch (err) {
    console.error('❌ Error hidratando commit desde GitHub:', err);
    return null;
  }
}

export function formatDiffForPrompt(hydrated: HydratedCommit): string {
  if (hydrated.filesWithDiff.length === 0) {
    return '(No se obtuvo diff legible para este commit)';
  }
  const blocks = hydrated.filesWithDiff.map((f) => {
    const header = `### ${f.filename} (${f.status}, +${f.additions}/-${f.deletions})${f.truncated ? ' [patch truncado]' : ''}`;
    return `${header}\n\`\`\`diff\n${f.patch}\n\`\`\``;
  });
  let footer = '';
  if (hydrated.filesOmittedCount > 0) {
    footer = `\n\n*Archivos omitidos del diff (${hydrated.filesOmittedCount}): ${hydrated.filesOmittedSample.join(', ')}${hydrated.filesOmittedCount > hydrated.filesOmittedSample.length ? '...' : ''}*`;
  }
  return `${blocks.join('\n\n')}${footer}`;
}
