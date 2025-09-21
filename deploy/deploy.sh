#!/bin/bash

# I'm making a number of assumptions with this code:
# 1 - The current user who is deploying the API will have the following folder and file structure:
#     /home/user/DQRetro.TournamentTracker
#        DQRetro.TournamentTracker.Api
#        Deploy
#        appsettings.Secrets.json
# 2 - The appsettings.Secrets.json contians all substituted variables, so will overwrite the extracted artifact's appsettings.Secrets.json file.
# 3 - 7-zip is installed, though this can be switched to other extraction tools based on preferences...
# 4 - The dqretro-tournamenttracker-api service has already been set-up as per the instructions in /deploy/dqretro-tournamenttracker-api.service in this repository.
# 5 - When this script is executed, the built artifact from the build pipeline should have already been copied to "~/DQRetro.TournamentTracker/Deploy".
# 6 - The final "rm -r ./*" in theory isn't required, but I've added this to reduce disk space usage in the event of a failure.

echo "Switching directory to ~/DQRetro.TournamentTracker/Deploy...";
cd ~/DQRetro.TournamentTracker/Deploy;

echo "Extracting the API and removing the archive...";
7z x ./DQRetro.TournamentTracker.Api.zip;
rm ./DQRetro.TournamentTracker.Api.zip;

echo "Overwriting the Appsettings Secrets file with local copy...";
cp -f ../appsettings.Secrets.json ./appsettings.Secrets.json;

echo "Stopping the API...";
sudo service dqretro-tournamenttracker-api stop;

echo "Overwriting existing API files";
rm -r ../DQRetro.TournamentTracker.Api/*;
mv ./* ../DQRetro.TournamentTracker.Api/;

echo "Granting execute permission to the API...";
chmod +x ../DQRetro.TournamentTracker.Api/DQRetro.TournamentTracker.Api;

echo "Starting the API...";
sudo service dqretro-tournamenttracker-api start;

echo "Ensuring Deploy folder is empty...";
rm -r ./*;
