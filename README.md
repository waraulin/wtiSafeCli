# wtiSafeCli
A cli to display a diff before pulling from WTI and making sure no diff artifacts are committed while pushing to WTI.

Run npm install to install dependencies.

Add your file paths and WTI info into `wti-safe-config.properties.example` and remove the `.example`

#wti-safe-pull
Pulls `.properties` file from WTI via API, calculates the diff from your local version, and then annotates your local file with additions, removals, and changed values at the bottom of the file. 

#wti-safe-push
Checks to make sure you've resolved all conflicts printed from `wti-safe-pull` and then pushes your local properties file to WTI.

If you have any questions, feel free to email <a href="mailto:wraulin@gmail.com">waraulin@gmail.com</a>. 

If you have any improvements, please submit a pull request, they are always welcome. This needs to be ported to Ruby and submitted to WTI at some point.