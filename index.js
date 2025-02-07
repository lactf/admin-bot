require("dotenv").config({ path: ["chall.env", ".env"] });

const express = require("express");
const axios = require("axios");
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer");

const app = express();

const port = Number(process.env.PORT) || 8080;

const submitPage = fs.readFileSync(path.join(__dirname, "submit.html"), "utf8");

function replace(str, old, rep) {
    return str.replaceAll(old, rep.replaceAll("$", "$$$$"));
}

const browser = puppeteer.launch({ pipe: true, args: ["--js-flags=--jitless", "--incognito"] });

app.use(express.urlencoded({ extended: false }));

const handlers = new Map();
for (const f of fs.readdirSync(path.join(__dirname, "handlers"))) {
    if (f.endsWith(".js")) {
        const handler = require("./" + path.join("handlers", f));
        let page = replace(submitPage, "$NAME", handler.name);
        page = replace(page, "$RECAPTCHA_SITE", process.env.RECAPTCHA_SITE || "");
        page = replace(page, "$RECAPTCHA_SECRET", process.env.RECAPTCHA_SECRET || "");
        app.get("/" + handler.name, (req, res) => {
            res.type("text/html").send(page);
        });
        app.post("/" + handler.name, async (req, res) => {
            const url = req.body.url;
            if (!(handler.urlRegex || /^https?:\/\//).test(url)) {
                return res.redirect(`/${handler.name}?e=${encodeURIComponent("Invalid URL")}`);
            }
            if (process.env.RECAPTCHA_SITE && process.env.RECAPTCHA_SECRET) {
                try {
                    const body = new URLSearchParams({
                        secret: process.env.RECAPTCHA_SECRET,
                        response: req.body["g-recaptcha-response"],
                    });
                    const resp = await axios.post("https://www.google.com/recaptcha/api/siteverify", body);
                    if (!resp.data.success) {
                        return res.redirect(`/${handler.name}?e=${encodeURIComponent("Invalid captcha")}`);
                    }
                } catch (err) {
                    console.error("Captcha verification failure", err);
                    return res.redirect(`/${handler.name}?e=${encodeURIComponent("Error verifying captcha")}`);
                }
            }
            let ctx = null;
            let ret = undefined;
            try {
                if (!handler.noContext) {
                    ctx = await (await browser).createBrowserContext();
                }
                ret = await handler.execute(ctx, url);
            } catch (err) {
                console.error("Handler error", err);
                if (ctx) {
                    try {
                        await ctx.close();
                    } catch (e) {}
                }
                return res.redirect(`/${handler.name}?e=${encodeURIComponent("Error visiting page")}`);
            }
            if (ctx) {
                try {
                    await ctx.close();
                } catch (e) {}
            }
            if (typeof ret === "object" && ret !== null && "error" in ret) {
                return res.redirect(`/${handler.name}?e=${encodeURIComponent(ret.error)}`);
            }
            return res.redirect(`/${handler.name}?m=${encodeURIComponent("Visit successful")}`);
        });
        handlers.set(handler.name, handler);
        console.log(`Registered handler for ${handler.name}.`);
    }
}

app.get("/", (req, res) => {
    if (handlers.size === 1) {
        res.redirect("/" + [...handlers.keys()][0]);
    } else {
        res.send("Admin bot is running.");
    }
});

app.listen(port, () => {
    console.log(`App listening on port ${port}.`);
});
