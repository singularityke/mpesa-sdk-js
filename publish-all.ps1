# publish-all.ps1
# Publish core first
Write-Host "Publishing core..." -ForegroundColor Green
cd packages/core
pnpm run build
npm version 1.0.0-alpha.3 --no-git-tag-version --allow-same-version
pnpm publish --tag latest --no-git-checks
cd ../..
Start-Sleep -Seconds 5

# Publish all other packages
$packages = @("elysia", "express", "fastify", "hono", "nextjs", "nuxt", "react", "svelte", "sveltekit", "vue")

foreach ($package in $packages) {
    Write-Host "`nPublishing $package..." -ForegroundColor Green
    cd "packages/$package"
    pnpm run build
    npm version 1.0.0-alpha.3 --no-git-tag-version --allow-same-version
    pnpm publish --tag latest --no-git-checks
    cd ../..
    Start-Sleep -Seconds 2
}

Write-Host "`nAll packages published!" -ForegroundColor Cyan
