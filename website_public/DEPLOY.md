# Public (named) project page — deployment notes

This folder is the **named** version of the DriveAnchor project page (authors, affiliations,
Meituan / XJTU / BIT logos, Meituan yellow theme). The anonymous review page at
`https://driveanchor.github.io/` must stay untouched and must **never link here** while the
ICLR 2027 review is running.

## 1. Choose a host that is separate from the anonymous site

Create a new GitHub organization (e.g. `driveanchor-public`) or use the Meituan organization,
then a repository named `<org>.github.io` (served at `https://<org>.github.io/`) or any
repository with GitHub Pages enabled (served at `https://<org>.github.io/<repo>/`).
Do not reuse the `DriveAnchor` organization that hosts the anonymous page.

## 2. Replace the placeholders before publishing

| Where | Placeholder | Replace with |
|---|---|---|
| `index.html`, Code button | `https://github.com/meituan/DriveAnchor` | the public code repository |
| `index.html`, arXiv button | `https://arxiv.org/abs/2606.00519` | keep (v2 will appear under the same ID) |
| `index.html`, full 41-min video | release asset of the anonymous repo | upload `full-deployment.mp4` (about 1 GB) as a Release asset of the new repo and point the `<source>` there |
| `../arxiv/main_arxiv.tex`, `\projecturl` | `https://driveanchor-public.github.io/` | the final URL of this page |

## 3. Publish

```bash
cd website_public
git init && git add . && git commit -m "Public DriveAnchor project page"
git branch -M main
git remote add origin https://github.com/<org>/<repo>.git
git push -u origin main
# then: repository Settings > Pages > Deploy from branch "main" / root
```

The nine short clips (about 190 MB) are committed directly; GitHub allows files up to 100 MB each.
