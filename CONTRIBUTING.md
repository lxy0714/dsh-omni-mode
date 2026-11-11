# Contributing

Fork the repository, create a focused branch, and submit a pull request. Keep runtime changes small and describe the goal, behavior before/after, tests and compatibility impact.

```sh
npm ci --ignore-scripts
npm run verify
```

The pinned development Harness is a test dependency, not shipped inside the plugin. You may set `DSH_TEST_BASE` to an existing installation package.json. Do not broaden `engines.dsh` without testing the additional version.

Keep public APIs, isolated providers/consumers, cancellation and cleanup. Do not rewrite active profiles, intercept credentials, fabricate approval, create arbitrary session event types or mutate shared per-preset configuration for one session.

Tests must distinguish real services from mock inference. Never claim real-model improvement or cross-platform support from static checks. Include extracted-package installation/consumption checks when changing exports, files, names or relative paths.

Do not commit `.verification/`, `node_modules/`, local profiles, credentials, real conversations or generated archives. Preserve MIT and upstream notices. Do not add a paid API key to CI. CI status is evidence only after the workflow has run.
