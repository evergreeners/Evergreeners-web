import "dotenv/config";
import { inviteAllExistingUsers, getCommunityOrg } from "../lib/org-invite.js";

async function main() {
    console.log("=================================================");
    console.log(`🌲 Evergreeners Org Inviter - Backfill Existing Users`);
    console.log(`Target Org: @${getCommunityOrg()}`);
    console.log("=================================================");

    if (!process.env.GITHUB_ORG_ADMIN_TOKEN) {
        console.error("❌ GITHUB_ORG_ADMIN_TOKEN is missing in environment.");
        process.exit(1);
    }

    try {
        const result = await inviteAllExistingUsers();
        console.log("\n✅ Backfill completed successfully!");
        console.log(`Total users checked: ${result.totalChecked}`);
        console.log(`Newly invited:       ${result.invited}`);
        console.log(`Already in org:      ${result.alreadyMembers}`);
        console.log(`Failed invites:      ${result.failed}`);
        console.log(`Skipped (no handle): ${result.skipped}`);

        if (result.details.length > 0) {
            console.log("\nDetails:");
            result.details.forEach(d => console.log(` - @${d.username}: ${d.result}`));
        }
        process.exit(0);
    } catch (err: any) {
        console.error("❌ Backfill failed:", err.message);
        process.exit(1);
    }
}

main();
