module.exports = {
    name: "mychall",
    timeout: 5000,
    async execute(browser, url) {
        const page = await browser.newPage();
        await page.setCookie({
            name: "adminpw",
            value: process.env.MYCHALL_ADMINPW || "placeholder",
            domain: process.env.MYCHALL_DOMAIN || "localhost:8080",
            httpOnly: true,
        });
        await page.goto(url);
        await page.waitForNetworkIdle({
            timeout: 5000,
        });
        await page.close();
    },
};
