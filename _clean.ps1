Remove-Item -LiteralPath 'f:\hadmaj\event-web\.next\types' -Recurse -Force -ErrorAction SilentlyContinue;
Remove-Item -LiteralPath 'f:\hadmaj\event-web\.next\dev' -Recurse -Force -ErrorAction SilentlyContinue;
Write-Output 'cleaned';