import { createReleaseConfig } from '@yboyer/semantic-release-config'

export default createReleaseConfig({
  commitAnalyzer: {
    releaseRules: [
      { type: 'ci', release: 'minor' },
      { type: 'chore', scope: 'deps', release: 'patch' },
    ],
  },
  releaseNotes: {
    preset: 'conventionalcommits',
    presetConfig: {
      types: [
        { type: 'feat', section: 'Features' },
        { type: 'fix', section: 'Bug Fixes' },
        { type: 'perf', section: 'Performance Improvements' },
        { type: 'ci', section: 'CI', hidden: false },
        { type: 'chore', scope: 'deps', section: 'Dependencies', hidden: false },
      ],
    },
  },
  npm: false,
  gitAssets: false,
})
