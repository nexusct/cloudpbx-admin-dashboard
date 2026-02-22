import { PbxConfigSchema } from './pbxinaflash';

async function runTests() {
    console.log("Running PBX in a Flash Tests...");
    let passed = 0;
    let failed = 0;

    function assert(condition: boolean, message: string) {
        if (condition) {
            console.log(`✅ PASS: ${message}`);
            passed++;
        } else {
            console.error(`❌ FAIL: ${message}`);
            failed++;
        }
    }

    // 1. Zod Testing - Valid Config
    try {
        PbxConfigSchema.parse({
            host: "192.168.1.100",
            port: 5038,
            username: "cloudpbx",
            secret: "supersecret"
        });
        assert(true, "Zod accepts valid config");
    } catch (e) {
        assert(false, "Zod rejected valid config");
    }

    // 2. Zod Testing - Missing Host
    try {
        PbxConfigSchema.parse({
            port: 5038,
            username: "cloudpbx",
            secret: "supersecret"
        });
        assert(false, "Zod accepted missing host");
    } catch (e: any) {
        assert(e.errors[0].message === "Required", "Zod properly rejected missing host");
    }

    // 3. Zod Testing - Invalid Port
    try {
        PbxConfigSchema.parse({
            host: "192.168.1.100",
            port: 999999, // Max is 65535
            username: "cloudpbx",
            secret: "supersecret"
        });
        assert(false, "Zod accepted invalid port 999999");
    } catch (e: any) {
        assert(e.errors[0].message.includes("Number must be less than or equal to 65535"), "Zod properly rejected invalid port > 65535");
    }

    // 4. Zod Testing - Default Port
    try {
        const res = PbxConfigSchema.parse({
            host: "192.168.1.100",
            username: "cloudpbx",
            secret: "supersecret"
        });
        assert(res.port === 5038, "Zod properly applied default port 5038");
    } catch (e: any) {
        assert(false, "Zod failed default port test");
    }

    console.log(`\nTests finished: ${passed} Passed, ${failed} Failed`);
    if (failed > 0) process.exit(1);
}

runTests().catch(console.error);
