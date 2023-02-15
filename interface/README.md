# MetaExplorer
MetaExplorer (a.k.a. CLEAR Knowledge Management, CKM) is a web-based interactive system for systematic review and meta-analysis


- Google firebase is used to host this project:
  - https://evidence-extraction-multiple.web.app - no login required and includes some example data for demo.
  - https://evidence-extraction-eval.web.app - requires google login.


- This project depends on https://github.com/sarahyh/ckm-opencpu/ to calculate meta-analysis data with R script.


- How to run:
  - Download and install firebase (https://firebase.google.com/)
  - Set up your project, storage, and hosting in your firebase account.
  - You will need to be in a Firebase app directory where `firebase.json` is located.
  - firebase.json exists in www directory in this repository.
  - There are multiple targets specified in firebase.json.  You can choose one of the targets to run the application locally.
    e.g. run "firebase serve --only hosting:app-multiple"

