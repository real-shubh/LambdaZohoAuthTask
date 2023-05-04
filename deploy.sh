#!/bin/bash

showUsage()
{
    echo ""
    echo "Usage: $0 -e Environment"
    echo -e "\tEnvironment : uat / production"
    echo ""
    exit 1 # Exit script after printing help
}

while getopts "e:" flag
do
    case "${flag}" in
        e) Environment="${OPTARG}" ;;
        ?) showUsage ;;
    esac
done

if [ -z "$Environment" ]
then
    echo ""
    echo "Some or all of the parameters are empty";
    showUsage
fi

echo "Selected $Environment deployment";

# rm -rf node_modules

# echo "Reinstalling node_modules";

# npm install --omit=dev

echo "Deleting all .map files to save space";

zsh ./rimrf.zsh

rm -rf LambdaCRMRequestHandler-$Environment.zip

INCLUDE_FOLDERS="index.js node_modules tasks pdf assets task-apiId-map.js"

# if [ $Environment == "uat" ]
# then
#   INCLUDE_FOLDERS+=" test"
# fi

zip -r LambdaCRMRequestHandler-$Environment.zip $INCLUDE_FOLDERS

echo
echo "------------------------------------------------------"
echo "Created output file LambdaCRMRequestHandler-$Environment.zip"
echo "------------------------------------------------------"
echo