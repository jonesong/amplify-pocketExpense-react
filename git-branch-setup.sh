#!/usr/bin/env bash
# =============================================================================
# git-branch-setup.sh
#
# Run this from the ROOT of your existing project repo.
# It creates a new branch "feature/sqlite-offline" and copies in the
# migrated source files.
#
# Usage:
#   chmod +x git-branch-setup.sh
#   ./git-branch-setup.sh
# =============================================================================

set -e

BRANCH="feature/sqlite-offline"
MIGRATION_DIR="./sqlite-migration-files"   # folder where you put the new files

# 5. Copy migrated source files
#    Adjust these paths if your project layout is different.
echo ""
echo "📂  Copying migrated source files..."

cp "$MIGRATION_DIR/src/db.ts"                          src/db.ts
cp "$MIGRATION_DIR/src/main.tsx"                       src/main.tsx
cp "$MIGRATION_DIR/src/App.tsx"                        src/App.tsx
cp "$MIGRATION_DIR/src/components/NewTransactionForm.tsx"  src/components/NewTransactionForm.tsx
cp "$MIGRATION_DIR/src/components/EditTransactionForm.tsx" src/components/EditTransactionForm.tsx
cp "$MIGRATION_DIR/src/components/TransactionPage.tsx"     src/components/TransactionPage.tsx
cp "$MIGRATION_DIR/src/components/ReportPage.tsx"          src/components/ReportPage.tsx

echo "✅  Source files copied."

# 6. Remove Amplify imports from package.json (optional — they won't break anything
#    if left, they just won't be used in this branch)
echo ""
echo "ℹ️   Amplify packages are still in package.json."
echo "    You can remove them later with:"
echo "    npm uninstall aws-amplify @aws-amplify/ui-react"

# 7. Sync Capacitor
echo ""
echo "🔄  Syncing Capacitor..."
npx cap sync android

# 8. Commit everything
echo ""
echo "📝  Committing migration..."
git add -A
git commit -m "feat: migrate data layer from DynamoDB/Amplify to local Android SQLite

- Add @capacitor-community/sqlite as the data persistence layer
- Remove all aws-amplify client calls (generateClient, observeQuery)
- Add src/db.ts as a single-source data service (initDB, CRUD for Account & Transaction)
- Remove Amplify Authenticator from main.tsx (offline-only, no cloud auth needed)
- Update all components to use db.ts types (Account, Transaction, TransactionUI)
- Data is stored in android/app SQLite file — no network required
- Currency symbol updated to ₱ (Philippine Peso) throughout"

echo ""
echo "════════════════════════════════════════════════════════"
echo " ✅  Done!  Branch: $BRANCH"
echo ""
echo " Next steps:"
echo "   1. Open in Android Studio:"
echo "      npx cap open android"
echo ""
echo "   2. In Android Studio → Build → Run on device/emulator"
echo ""
echo "   3. For browser dev (with SQLite shim):"
echo "      npm install jeep-sqlite"
echo "      # then uncomment the jeepSQLite block in src/main.tsx"
echo ""
echo "   4. Push branch to remote:"
echo "      git push -u origin $BRANCH"
echo "════════════════════════════════════════════════════════"
