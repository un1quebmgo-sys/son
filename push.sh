#!/bin/bash
git remote remove origin 2>/dev/null || true
git remote add origin "https://un1quebmgo-sys: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@github.com/un1quebmgo-sys/son.git"
git push -u origin main || git push -u origin master
