#!/bin/bash
# Quick and dirty script meant to be run on each fish folder, such as "./make-array florida/"
# This will format the list of files as a JS array and copy it onto the clipboard, so it can easily be pasted into util.js
# Some systems might not have the "xclip" program, in which case the output needs to be manually copied
cd $1
ls | grep -v manifest > manifest
sed -e "s/^/\t\t\t'/" -i manifest # Opening quote
sed -e "s/$/',/" -i manifest # Closing quote and comma for array
if ! command -v xclip &> /dev/null
then
    cat manifest
else
    head -c -1 manifest | xclip -selection c
fi
rm manifest
