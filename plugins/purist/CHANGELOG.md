# @ajrsoftware/oxlint-plugin-purist

## 2.0.0

### Major Changes

- 7333ec4: Split `purist/preset` into `purist/no-default-export` and `purist/filename-case`, so each check can be turned off or disabled on its own. `allowDefaultExport` moves to `no-default-export`; `filenamePattern` and `ignoreFilenames` move to `filename-case`. `purist/react` is removed: its checks are now separate rules in `@ajrsoftware/oxlint-plugin-react-preset`. See the README for upgrading from 1.x.
