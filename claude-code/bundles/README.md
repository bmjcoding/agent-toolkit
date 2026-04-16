# claude-code/bundles/

Bundle manifests moved to the canonical root [`bundles/`](../../bundles) directory.

- Canonical source: `bundles/<slug>/bundle.yaml`
- Claude install/runtime surfaces still resolve from the generated catalog metadata
- Legacy `frankenstein-orchestration` requests are preserved through the canonical
  `bundles/ultra-dev/bundle.yaml` alias metadata

Do not add new bundle manifests under `claude-code/bundles/`. Update the root
`bundles/` tree and regenerate `index.json` instead.
