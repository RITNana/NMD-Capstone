# NMD-Capstone
Creating an interactive, cooperation game to build a Monster (work in progress)


## How to Branch
use terminal 

### CREATING BRANCHES:
to create new branch do - git branch (branch name)

switch the branch - git checkout (branch name)

make sure to pull if branch has updates

you can check which branch u are on in the terminal by looking in the ()
for example: it should say (main) next to the directory if on main

---

### PUSHING BRANCHES:
to push a NEW branch do - git push --set-upstream origin (branch name)

if the branch already exists, you can just git push as normal

NOTE:

Normal practice is to NOT change code on main, but instead make branches that will be merged into main later.

---

### MERGING TO MAIN:
To merge into main or another side branch we want to create, we use the pull requests tab in github. This way we can fix any merging issues we have, and we dont have to track when we pull the code out.

(But we are so good, we wont have any merge issues)

Under the pull request tab, use the new pull request button to create a new request.

The base should be the branch you want to push to (usually main) and the compare is the branch you were just wroking on.

Then press create pull request and it should tell you if there are conflicts.

We all probably have access to aprrove the pull requests, so we can work together on that.

---

## HOW TO GET BRANCH UP TO DATE WITH MAIN
first get local main up to date

go to the main branch and git pull

then switch back to your branch and do git merge main

that should put you up to date with the main branch so you can work from there

OOORRRRRR

if you do not want to switch out of your branch branch do

git fetch origin (get your local branches up to date)

git merge origin/main (then merge)

---