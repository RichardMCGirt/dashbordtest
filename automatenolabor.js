const { execSync } = require('child_process');

(async () => {
    console.log("🚀 Starting automated Git commit & push...");

    try {
        // 🔄 Step 1: Add all changes to Git
        console.log("🔄 Adding all changes to Git...");
        execSync(`git add .`, { stdio: 'inherit' });

        // ✍️ Step 2: Commit changes
        console.log("✍️ Committing changes...");
        execSync(`git commit -m "Automated commit of latest changes"`, { stdio: 'inherit' });

        // 🚀 Step 3: Push changes to GitHub
        console.log("🚀 Pushing changes to GitHub...");
        execSync(`git push`, { stdio: 'inherit' });

        console.log("✅ Changes successfully committed and pushed!");
    } catch (error) {
        console.error("❌ Error during Git push:", error.message);
    }
})();
