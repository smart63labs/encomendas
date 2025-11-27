Command line instructions
You can also upload existing files from your computer using the instructions below.

Git global setup
git config --global user.name "Anderson Silva Dorneles"
git config --global user.email "88417646191@sefaz.to.gov.br"
Create a new repository
git clone http://gitlab.sefaz.to.gov.br/sefaz-to/ti/produtos/dinov/novo-sistema-protocolo.git
cd novo-sistema-protocolo
git switch --create main
touch README.md
git add README.md
git commit -m "add README"
Push an existing folder
cd existing_folder
git init --initial-branch=main
git remote add origin http://gitlab.sefaz.to.gov.br/sefaz-to/ti/produtos/dinov/novo-sistema-protocolo.git
git add .
git commit -m "Initial commit"
Push an existing Git repository
cd existing_repo
git remote rename origin old-origin
git remote add origin http://gitlab.sefaz.to.gov.br/sefaz-to/ti/produtos/dinov/novo-sistema-protocolo.git