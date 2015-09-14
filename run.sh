#!/bin/sh
node crawler > movies.json
cat movies.json | node to-html > movies.html