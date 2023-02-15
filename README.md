# MetaExplorer

This repo contains supplemental materials for the CHI 2023 submission: "MetaExplorer: Facilitating Reasoning with Epistemic Uncertainty in Meta-analysis".

## Contents

`backend/` contains R code to run meta-analysis and unit conversions on an OpenCPU server. This folder is copied from https://github.com/sarahyh/ckm-opencpu

- `DESCRIPTION/` and `NAMESPACE/` folders describe the custom R package deployed on OpenCPU.
- `R/` folder contains R code for meta-analysis and unit conversion calculations supporting MetaExplorer.
- Other files are boilerplate for OpenCPU applications.

`interface/` contains the codebase for MetaExplorer. MetaExplorer is a Firebase application hosted at https://evidence-extraction-multiple.web.app/. This folder is copied from https://github.com/sarahyh/ckm, where the software is publicly available as an open source project called CKM (CLEAR Knowledge Management; the name MetaExplorer was chosen after the fact for publication at CHI), funded by the US Navy.

- `www/public/` folder contains HTML files for each interface component described in the paper.
- `www/public/js/` folder contains javascript code for dynamic aspects of the application.
- `www/public/stylesheets/` folder contains css styling.

`evidence-extraction-planning/` contains snapshots of our planning document for implementing the evidence extraction tool, included to provide the reader a view into our design process. Files are listed by the date of the snapshot.

`paper-prototype/` contains snapshots of our paper prototype, included to provide the reader a view into our design process. Files are listed by the date of the snapshot.

`qual-analysis.xlsx` contains our codebook for qualitative analysis, including transcribed quotes.
